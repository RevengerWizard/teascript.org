---
title: Storing State in C
number: 15.
weight: 3600
---

Frequently, C functions need to keep some data that will outlive their original invocation. In C, we typically use global or static values for that need. When you are embedding Teascript, however, this isn't a good approach. First, you cannot store a generic Teascript value in a C variable. Secondly, a library that uses such variables cannot be used in multiple Tea states.

An alternative approach is to store such values into Tea global variables. This approach solves the previous two problems. Tea global variables can store any Teascript value and each independent state has its own independent set of global variables. However, this is not always a satisfactory solution, because Tea code can tamper with those global variables and therefore compromise the integrity of C data. To avoid this issue, Teascript offers two mechanisms: the _registry_, which is a Tea map that C code can freely use, but Teascript code cannot access, and C _upvalues_.

## The Registry

The registry is always located at a _pseudo-index_, whose value is defined by the macro `TEA_REGISTRY_INDEX`. A pseudo-index is like an index to the stack, except that its associated value is not in the stack. Most functions in the Teascript API that accept indices as arguments also accept pseudo-indices; the exceptions being those functions that manipulate the stack itself, such as `tea_remove` and `tea_insert`. For instance, to get a value stored with the key `"Key"` in the registry, you can use the following C code:

```c
tea_push_string(T, "Key");
if(tea_get_field(T, TEA_REGISTRY_INDEX)) 
{
    /* Value is present, do something */
}
```

The registry is a regular Tea map. As such, you can index it with any Tea value. However, because all C libraries share the registry, you must choose with care what values you use as keys, to avoid collisions. A bullet-proof method is to use as key the address of a static variable in your code: this ensures that this key will be unique among all libraries. To use this option, you need to use the function `tea_push_pointer`, which pushes on the Tea stack a value representing a C pointer. The following shows how to store and retrieve a number from the registry using such method:

```c
/* Variable with unique address */
static const char KEY = 'k';

/* Store a number */
tea_push_pointer(T, (void*)&KEY);   /* Push address key */
tea_push_number(T, 10); /* Push value */
/* REGISTRY[&Key] = 10 */
tea_set_field(T, TEA_REGISTRY_INDEX);

/* Retrieve a number */
tea_push_pointer(T, (void*)&KEY);   /* Push address key */
tea_get_field(T, TEA_REGISTRY_INDEX);   /* Retrieve value */
tea_Number num = tea_get_number(T, -1);
```

Of course, you can also use strings as keys into the registry, as long as you choose unique names. String keys are particularly useful when you want to allow other independent libraries to access your data, because all they need to know is the key name. For such keys, there is no bullet-proof method for choosing a name, but there are good practices, such as avoiding common names and prefixing your names with the library name or some other faily unique prefix.

## Upvalues

While the registry implements global values, the _upvalue_ mechanism implements an equivalent of C static variables, which are visible only inside a particular function. Every time you create a new C function in Teascript, you can associate with it any number of upvalues; each upvalue can hold a single Tea value. Later, when the function is called, it has free access to any of its upvalues, using pseudo-indices.

We call this association of a C function with its upvalues a _closure_. As covered, in Teascript code, a closure is a function that uses local variables from an outer function. A C closure is a C approximation to a Tea closure. One interesting fact about closures is that you can create different closures using the same function code, but with different upvalues.

To see a simple example, let's create a `newCounter` function in C. This function is a factory function: it returns a new counter function each time it is called. Although all counters share the same C code, each one keeps its own independent counter. The C function is like this:

```c
/* Forward declaration */
static void counter(tea_State* T);

void newCounter(tea_State* T)
{
    tea_push_number(T, 0);
    tea_push_cclosure(T, counter, 1, 0, 0);
}
```

The key function here is the `tea_push_cclosure` API function, which creates a new closure. Its second argument is the C function to "enclose", followed by the number of Tea values already pushed onto the stack to use as upvalues. In our example, we push the number zero as the initial value for the single upvalue. As expected, `tea_push_cclosure` leaves a new closure on the stack, so the closure is ready to be returned as the result of `newCounter`:

```c
static void counter(tea_State* T)
{
    tea_Number val = tea_get_number(T, tea_upvalue_index(0));
    tea_push_number(T, ++val);  /* New value */
    tea_push_value(T, -1);  /* Duplicate it */
    tea_replace(T, tea_upvalue_index(0));   /* Replace upvalue */
    /* New value on top of the stack */
}
```

Here the key concept is `tea_upvalue_index`, a macro which produces the pseudo-index of an upvalue. Again, this pseudo-index is like any stack index, except that it does not live in the stack. The `tea_upvalue_index(0)` refers to the index of the first upvalue of the function. So, the `tea_get_number` in function `counter` retrieves the current value of the first (and only) upvalue as a number. Then, function `counter` pushed the new value `++val`, makes a copy of it, and uses one of the copies to replace the upvalue with the new value. Finally, it returns the other copy as its return value.

Unlike Tea closures, C closures cannot share upvalues: each closure has its own independent set. However, we can set the upvalues of different functions to refer to common objects, such that it becomes a common place where those functions can share data.
