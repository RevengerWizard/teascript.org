---
title: Functions
number: "7."
weight: 700
---

A _function_ is a value that packages code which can be executed repeatedly, with different arguments, by calling it. This chapter defines how functions are declared and called, how arguments are bound to parameters (including optional and variadic parameters), what a function returns, how functions capture variables of the scopes in which they are created, and what the language guarantees about tail calls.

The types of callable values are listed in [Type System](../type-system#function), the call expression in [Expressions](../expressions#calls), the `return` statement in [Statements](../statements#return), and the scoping rules for function names and parameters in [Declarations](../declarations). Methods, constructors and accessors are functions that belong to a class; they are described in the chapter on the object system.

## Definition and Calling Convention

### Function Values

A function is a first-class value of type `function`. It can be stored in a variable, passed as an argument, returned, and kept in lists, maps and attributes. A function is made by one of the forms below, and every **every evaluation of such a form creates a new function value**. Two functions created by evaluating the same form twice are therefore different values. Functions are equal only if they are the same object.

A function remembers the **module** in which it was created. The module variables that it uses are those of that module, wherever the function is later called from.

### Forms That Create Functions

```
function_declaration ::= 'function' <name> '(' parameters? ')' block
                       | 'function' <name> ( '.' <name> )+ '(' parameters? ')' block
                       | 'function' <name> ( '.' <name> )* ':' <name> '(' parameters? ')' block

function_expression  ::= 'function' '(' parameters? ')' block
                       | '(' parameters? ')' '=>' ( expression | block )
```

- `function name(...) { ... }` declares the variable `name` and stores the function in it. The name is visible inside the function's own body, so a function can call itself; see [Declarations](../declarations#visibility-during-initialization)
- `function a.b.c(...) { ... }` does not declare a variable. It evaluates the path `a.b` and stores the new function in the attribute `c` of the result, like an assignment to `a.b.c`
- `function Class:name(...) { ... }` adds a **method** `name` to the existing class `Class`. The value denoted by `Class` must be a class, otherwise a runtime error is raised. Inside the body, `self` denotes the receiver
- Function expressions and arrow functions are described in [Expressions](../expressions#function-expressions)

### Parameters

```
parameters ::= parameter ( ',' parameter )*
parameter  ::= <name>                  (* required *)
             | <name> '=' expression   (* optional, with a default value *)
             | '...' <name>            (* variadic *)
```

A function has three kinds of parameters, which must appear in this order:

1. **Required** parameters: an argument must be supplied for each
2. **Optional** parameters: they have a default value, used when the argument is omitted
3. A **variadic** parameter, which collects the surplus arguments in a list

The following are compile-time errors: two parameters with the same name; a required parameter after an optional one; a parameter after the variadic one; a default value on the variadic parameter. Because the variadic parameter counts as a required parameter, **a function cannot have both optional and a variadic parameter**

Parameters are ordinary local variables of the function, declared in the scope that also contains the top-level declarations of the body; see [Declarations](../declarations#kinds-of-scope). They may be assigned to; this never affects the caller's variables.

### Calling Convention

A call `f(a1, ..., an)` proceeds in this order:

1. The callee `f` is evaluated, then the arguments from left to right (a spread argument `...list` is replaced by the elements of the list)
2. The number of arguments is checked against the function's parameters and the arguments are bound as described in the following sections. If the check fails, a runtime error is raised **before any of the function's code is executed**
3. A new **activation** of the function is created, with its own set of local variable: its parameters, and then every variable declared in its body. Activations are independent. Recursive calls and calls made at the same time to the same function do not share locals
4. The body is executed until it returns or an error occurs; see [return](../statements#return). The call evaluates to the returned value; if the body ends without returning a value explicitly, the call evaluates to `nil`

For a method call, a call through a bound method, or a call of an instance whose class defines `call`, the **receiver** (instance or object) is the value of `self` in the activation, and the arguments are bound to the parameters that follow. The kinds of values that can be called are listed in [Type System](../type-system#function).

Native functions, implemented by the host program, are called in the same way and are subject to the same argument-count checking.

## Argument Passing Semantics

Arguments are passed **by value, where the value of a reference type is the reference**, sometimes called _call by sharing_.

- Each parameter is a new variable initialized with the argument's value. Assigning to the parameter changes only that variable; it never changes a variable of the caller
- For the reference types, the parameter and the argument refer to the **same object**. Mutating the object through the parameter, for example by assigning to an element of a list, is visible to the caller, and no copy is made
- For the value types, the parameter holds a copy

```tea
function reset(list, n)
{
    list[0] = 0         // visible to the caller: same list
    n = 0               // not visible to the caller: n is a copy
}
```

Arguments are matched to parameters **by position**. There are no named arguments. In `f(a = 1)` the argument is the _assignment expression_ `a = 1`, whose value is passed; see [Expressions](../expressions#calls).

#### Argument Count
Let _r_ be the number of required parameters, _o_ the number of optional parameters, and let the function be _variadic_ or not. A call is valid if:

| Function | Number of arguments |
| --- | --- |
| not variadic | at least *r* and at most *r* + *o* |
| variadic | at least *r* − 1, where *r* counts the variadic parameter |

Any other number of arguments is a runtime error that reports the number of arguments expected and the number given. Surplus arguments to a non-variadic function are an error; they are never silently dropped.

#### Spreading
An argument written `...expr` must evaluate to a list, and its elements are passed as separate arguments in its place; it is a runtime error if it is not a list. A call may mix ordinary and spread arguments in any order.

```tea
var args = [1, 2]
f(0, ...args, 3)        // same as f(0, 1, 2, 3)
```

## Default and Variadic Arguments

### Optional Parameters

A parameter written `name = expression` is optional. If the call supplies an argument for it, the parameter takes that value. Otherwise it takes the value of the default expression. Optional parameters are filled in order: a call with _k_ of the _o_ optional arguments gives them to the first _k_ optional parameters, and the remining ones take their defaults. An argument cannot be skipped.

**When default are evaluated** The default expressions are evaluated **at the start of every call**, in the activation of the function, from left to right, in the order of the parameters, **whether or not the corresponding argument was supplied**; the value of a default whose argument was supplied is discared. A default expression with side effects is therefore executed on every call. Each default expression sees the parameters that precede it, with the values they actually have for this call (supplied or defaulted), and any variable that is visible at the point where the function is written.

```tea
function f(a, b = a * 2, c = b + 1)
{
    return [a, b, c]
}
f(1)         // -> [1, 2, 3]
f(1, 10)     // -> [1, 10, 11]
f(1, 10, 0)  // -> [1, 10, 0]
```

### Variadic Parameters

A variadic parameter, written `...name` and always the last, receives the **surplus arguments**: all the arguments beyond those bound to the required parameters that precede it. They are collected, in order, into a _new list_ that is bound to `name`. The list is created for each call and belongs to the callee; is is empty if there are no surplus arguments.

```tea
function log(level, ...parts) { return parts }
log("info")              // -> []
log("info", "a", "b")    // -> ["a", "b"]
```

A single list passed for the variadic parameter is **not** unpacked: `log("info", [1, 2])` produces `[[1, 2]]`. To pass the elements of a list as separate arguments, spread it at the call: `log("info", ...items)`.

## Multiple Return Values

A Teascript function returns **exactly one value**. `return` takes at most one expression, and there is no syntax for returning several values.

To return several results, return one **list** and unpack it at the call site. The declaration and multiple-assignment forms unpack a list with exactly as many elements as there are targets:

```tea
function swap(a, b)
{
    return [b, a]
}

var x, y = swap(1, 2)      // declaration: x is 2, y is 1
x, y = swap(x, y)          // multiple assignment: x is 1, y is 2
```

If the returned list does not have exactly as many elements as there are targets, a runtime error is raised; see [Variable Declaration](../declarations#variable-declaration) and [Multiple Assignment](../statements#multiple-assignment). Destructuring with a rest variable (`var first, ...others = f()`) also accepts lists of different lengths.

## Closures and Upvalue Capture

A **closure** is a function together with the variables of enclosing functions that it uses. Every function created in the body of another function is a closure.

### Which Variables are Captured

When a name inside a function resolves to a **local variable of an enclosing function** (step 2 of the lookup in [Name Resolution Rules](../declarations#name-resolution-rules)), the function _captures_ that variable; the captured variables are called **upvalues**. Capture is transitive: a function nested severals levels deep that uses a variable of an outer function causes each function inbetween to capture it as well.

Module variables and predefined globals are **not** captured. They are accessed directly in the module, and every function sees the current value.

### Capture by Reference

A captured variable is **shared**, not copied;

- A closure sees the current value of the variable, including changes made after the closure was created
- An assignment to the variable inside the closure is an assignment to the variable of the enclosing function, unless the variable is a constant (a compile-time error)
- All closures that capture the same variable share it, as does the enclosing function while its scope is active

```tea
function counter()
{
    var n = 0
    return [
        function() { n += 1; return n },    // both functions use the same n
        function() { return n }
    ]
}
```

### Lifetime of Captured Variables

When the scope of a captured variable ends (the block is left, or the function returns), the variable **does not disappear**. It stays alive for as long as any closure refers to it. From then on, the closures that captured it are its only users.

### One Variable per Execution of a Scope

A variable is created each time its declaration is executed. Consequently, closures created in different iterations of a loop body, or in different calls of a function, capture **different variables** even though the declaration is the same:

```tea
function make(n)
{
    return function() { return n }       // n is new on every call of make
}
var a = make(1)
var b = make(2)
a()        // -> 1
b()        // -> 2
```

The variable of a `for` loop has one copy per iteration; see [Generic for](../statements#generic-for) and [Iterative for](../statements#iterative-for).

## Tail Calls

Teascript does **not** eliminate tail calls. A call that is the last action of a function, as in `return f(x)`, is an ordinary call. It creates a new activation, and the activation of the caller, with its local variables and captured variables, stays in existence until the callee returns.

Consequently:

- **Recursion depth is bounded** A recursive function, whether or not its recursive call is in tail position, uses additional resources for every active call. A recursion that goes deep enough is runtime error; the limit is implementation-defined and is described in the Implementation part of this documentation.
- A program must not rely on a tail-recursive function running in constant space. Loops (`while`, `for`) should be used for unbounded iteration.
