---
title: Calling C from Teascript
number: 12.
weight: 3300
---

One of the basic means for extending Teascript is for the application to _register_ new C functions into Teascript.

When we say that Teascript can call C functions, this does not mean that Teascript can call any C function. As we saw in chapter 10, C functions that Teascript can call must follow a specific protocol for receiving arguments and returning values through the stack. A function with the wrong signature simply cannot be registered. The type `tea_CFunction` captures this protocol:

```c
typedef void (*tea_CFunction)(tea_State* T);
```

Every C function callable from Teascript takes a `tea_State*` and returns nothing. Arguments arrive on the stack and return values are pushed onto it before the function returns. Everything else — type checking, argument counts, error reporting — is the function's own responsibility.

## C Functions

Let's write a simple C function and make it available to Teascript. We will implement a `clamp` function that restricts a number to a given range:

```c
static void c_clamp(tea_State* T)
{
    double value = tea_check_number(T, 0);
    double min   = tea_check_number(T, 1);
    double max   = tea_check_number(T, 2);

    if(min > max)
        tea_error(T, "min must be less than or equal to max");

    double result = value < min ? min : value > max ? max : value;
    tea_push_number(T, result);
}
```

Arguments are at indices `0`, `1`, `2` and so on. `tea_check_number` retrieves the value at the given index and raises a descriptive error if the value is not a number, so we never have to handle the wrong-type case manually. We push exactly one return value and return.

To make this function available as a global in Teascript, use `tea_push_cfunction` followed by `tea_set_global`:

```c
tea_push_cfunction(T, c_clamp, 3, 0);
tea_set_global(T, "clamp");
```

The third argument to `tea_push_cfunction` is the expected argument count, and the fourth is the number of optional arguments. Teascript uses these to check the call site — passing the wrong number of arguments raises an error before your function is even entered. Pass `TEA_VARG` as the argument count for variadic functions that accept any number of arguments.

From Teascript the function is now indistinguishable from one defined in the language:

```tea
print(clamp(15, 0, 10))   # 10
print(clamp(-3, 0, 10))   # 0
print(clamp(7, 0, 10))    # 7
```

Closures with upvalues work similarly. `tea_push_cclosure` creates a C function that closes over a set of values currently on the stack:

```c
void tea_push_cclosure(tea_State* T, tea_CFunction fn, int nupvalues, int nargs, int nopts);
```

Push the upvalues first, then call `tea_push_cclosure`. Inside the function body, retrieve upvalues by index using the `tea_upvalue_index` macro:

```c
static void c_adder(tea_State* T)
{
    double addend = tea_get_number(T, tea_upvalue_index(0));
    double value  = tea_check_number(T, 0);
    tea_push_number(T, value + addend);
}

/* Create an adder that adds 10 to its argument */
tea_push_number(T, 10.0);
tea_push_cclosure(T, c_adder, 1, 1, 0);
tea_set_global(T, "add10");
```

```tea
print(add10(5))    # 15
print(add10(32))   # 42
```

Upvalue indices are negative and count from `TEA_UPVALUES_INDEX`. Each closure instance gets its own copy of the upvalues, so you can create multiple closures from the same `tea_CFunction` with different captured state.

## C Modules

Registering functions one by one as globals works for small integrations, but for anything substantial you should group related functions into a module. Modules keep the global namespace clean and let scripts import only what they need.

The `tea_Reg` struct describes an array of functions to register together:

```c
typedef struct tea_Reg
{
    const char* name;
    tea_CFunction fn;
    int nargs;
    int nopts;
} tea_Reg;
```

The array must be terminated with a sentinel entry where all fields are `NULL` or zero. `tea_create_module` takes a name and a `tea_Reg` array and builds the module in one call:

```c
static void c_clamp(tea_State* T) { /* ... */ }
static void c_lerp(tea_State* T)  { /* ... */ }
static void c_sign(tea_State* T)  { /* ... */ }

static const tea_Reg mathx_module[] = {
    { "clamp", c_clamp, 3, 0 },
    { "lerp",  c_lerp,  3, 0 },
    { "sign",  c_sign,  1, 0 },
    { NULL, NULL, 0, 0 }
};

TEA_API void tea_import_mathx(tea_State* T)
{
    tea_create_module(T, "mathx", mathx_module);
}
```

Once registered, the module is importable from Teascript like any other:

```tea
import mathx

print(mathx.clamp(15, 0, 10))
print(mathx.lerp(0, 100, 0.25))
print(mathx.sign(-3))
```

Or with selective imports:

```tea
import mathx { clamp, lerp }

print(clamp(15, 0, 10))
```

For larger modules it is often natural to split functionality into submodules. `tea_create_submodule` works identically to `tea_create_module` but nests the result under the module currently on top of the stack:

```c
static const tea_Reg mathx_trig[] = {
    { "sin", c_sin, 1, 0 },
    { "cos", c_cos, 1, 0 },
    { "tan", c_tan, 1, 0 },
    { NULL, NULL, 0, 0 }
};

TEA_API void tea_import_mathx(tea_State* T)
{
    tea_create_module(T, "mathx", mathx_module);
    tea_create_submodule(T, "trig", mathx_trig);
}
```

```tea
from mathx import trig

print(trig.sin(0))
```

If your module functions need shared state — a cached resource, a configuration value, a counter — use upvalues. Push the shared state before calling `tea_set_funcs`, which registers a `tea_Reg` array and distributes the upvalues on the stack to every function in the array:

```c
void tea_set_funcs(tea_State* T, const tea_Reg* reg, int nup);
```

All functions registered in the same `tea_set_funcs` call share the same upvalue slots. This is the standard way to give a module its own private state without resorting to C globals.

## C Classes

C modules expose collections of free functions. When you need to associate behavior with a specific kind of value — as we did with `RingBuffer` in chapter 14 — the right abstraction is a C class.

The `tea_Methods` struct extends `tea_Reg` with a type tag that controls how a method participates in Teascript's dispatch:

```c
typedef struct tea_Methods
{
    const char* name;
    const char* type;
    tea_CFunction fn;
    int nargs;
    int nopts;
} tea_Methods;
```

The `type` field can be:

| Tag | Meaning |
|---|---|
| `"method"` | A regular callable method |
| `"get"` | A property getter, invoked on `obj.name` |
| `"set"` | A property setter, invoked on `obj.name = value` |
| `"static"` | A static method, callable on the class itself |

`tea_create_class` takes a class name and a `tea_Methods` array and registers the class in the current module:

```c
static void point_tostring(tea_State* T)
{
    /* ... */
}

static void point_get_x(tea_State* T)
{
    /* ... */
}

static void point_translate(tea_State* T)
{
    /* ... */
}

static void point_origin(tea_State* T)
{
    tea_push_number(T, 0);
    tea_push_number(T, 0);
    /* construct and push a Point at (0, 0) */
}

static const tea_Methods point_methods[] = {
    { "__string",  "method", point_tostring,  1, 0 },
    { "x",         "get",    point_get_x,     1, 0 },
    { "translate", "method", point_translate, 3, 0 },
    { "origin",    "static", point_origin,    0, 0 },
    { NULL, NULL, NULL, 0, 0 }
};
```

`"static"` methods receive no implicit `self` — the class itself is not passed either. They are called directly on the class:

```tea
var p = Point.origin()
```

Classes and modules compose naturally. A module can export both free functions and classes:

```c
TEA_API void tea_import_geometry(tea_State* T)
{
    tea_create_class(T, "Point", point_methods);
    tea_create_class(T, "Rect",  rect_methods);
    tea_create_module(T, "geometry", geometry_funcs);
}
```

```tea
import geometry { Point, Rect }

var p = Point(3, 4)
var r = Rect(p, 100, 200)
```

The class is just another value inside the module. From a script's perspective there is no observable difference between a class written in Teascript and one registered from C. Both support construction, method calls, property access, operator overloading, and inheritance — all through the same mechanisms.

There is one important thing a C class cannot do that a Teascript class can: define `init` through the methods table in a way that participates in inheritance chains. The constructor is the function registered in the module's `tea_Reg` — it is a plain C function that calls `tea_new_udata` and sets up the block. If you need a C class to be subclassable from Teascript, you will need to expose the initialization logic in a way that a subclass `init` can invoke explicitly.
