---
title: Error Model
number: "10."
weight: 1000
---

Teascript reports abnormal conditions with _errors_. An error interrupts the code that is running and unwinds the active function calls is caught, or, if nothing catches it, terminates the program. This chapter defines what causes an error, what an error value is, how an error propagates through the program, and how a program can catch an error and continue.

The language has **no exception syntax**. There is no `try`, `catch`, `throw` or `finally`. Errors are raised by the runtime and by the functions `error` and `assert`, and they are caught by the function `pcall`, all described below. The error conditions of individual constructs are defined with the constructs themselves; this chapter only collects them.

## Error Values

An error is either detected **before** the code that contains it runs, or **while** the program executes:

| Kind | Raised by | Effect |
| --- | --- | --- |
| **Compile-time error** | the compiler: a lexical, syntactic or scoping error in source text | none of the source text that was being compiled runs |
| **Runtime error** | a running program | execution is interrupted at the point of the error |

Compile-time errors in the main script stop the program before anything is executed. Code that is compiled while the program is running, with `eval`, `loadstring` or `loadfile`, can also contain compile-time errors; these are raised as errors at the point of that call and can be caught like any runtime error. See [Protected Execution](#protected-execution).

Resource exhaustion, such as running out of memory or of space for nested calls, is reported as an error of the same kind and can be caught in the same way.

### Conditions that Raise Errors

The following situations raise a runtime error. Each is specified with the constructs concerned,

| Condition | Specified in |
| --- | --- |
| An operator applied to operands it does not support, and no operator method is applicable | [Operator Semantics](expressions.md#operator-semantics) |
| Calling a value that is not callable, or calling with the wrong number of arguments | [Calling convention](functions.md#calling-convention) |
| Spreading a value that is not a list into a call, or expanding a value that cannot be expanded in a list literal | [Expressions](expressions.md#calls) |
| Creating a range from operands that are not numbers | [Ranges](expressions.md#ranges) |
| Unpacking a value that is not a list, or a list of the wrong length | [Variable Declaration](declarations.md#variable-declaration), [Multiple Assignment](statements.md#multiple-assignment) |
| Iterating over a value that is not iterable | [Generic for](statements.md#generic-for) |
| Using a name on an object that has no such member, calling a member that does not exist, or reading an export that does not exist | [Method Resolution Order](object-system.md#method-resolution-order) |
| Instantiating a class that has no constructor, or declaring an invalid superclass | [Instantiation](object-system.md#instantiation), [Inheritance Semantics](object-system.md#inheritance-semantics) |
| An argument of the wrong type or value passed to a built-in function | the description of the function |
| `error` called, or `assert` failing | below |

Conditions that are **not** errors include division by zero, which produces infinity or `NaN`; see [NaN and Infinity](type-system.md#nan-and-infinity).

### The Error Value

Every error carries an **error value**, which describes it. The error value is a _string_:

- For an error raised by the runtime, the string is a human-readable message that identifies the problem. For example, a message for an operator applied to unsupported operands names the operator and the types of the operands, and a message for a bad argument of built-in function gives the position of the argument, counting from 1, and the type that was expected and the type that was received. The runtime may add information about the active calls at the point of the error. The exact wording and layout of messages are not specified, and programs should not depend on them.
- For a compile-time error, the message begins with the name of the source and the line of the error, in the form `File name, [line n]: message`, and may add the token near which the error was found.
- For `error` and `assert`, the string contains the message supplied by the program.

The runtime may append information about the active calls to any error value. A program should not therefore treat an error value as text to display or to search, and should not rely on it being equal to the message it supplied. There are no error classes or error objects, and a program cannot distinguish kinds of error except by examining the message. The error value that `pcall` returns is this same string.

### error

`error(message)` raises a runtime error whose error value is `message`. The argument is required and should be a string; the effect of any other type is unspecified. `error` never returns.

```tea
function parse_port(text)
{
    var n = tonumber(text)
    if n == nil
    {
        error("invalid port: " + text)
    }
    return n
}
```

### assert

`assert(value, message)` checks a condition. If `value` is **truthy**, `assert` returns `value` and does nothing else. Otherwise it raises a runtime error: with `message` as the error value if `message` is given and is a string, and with a default message otherwise. The `message` argument is optional.

```tea
var port = assert(tonumber(text), "port must be a number")
```

## Propagation

When an error is raised, execution is _interrupted_ at once; the rest of the current expression and statement is therefore not evaluated. The error then _propagates_ outwards, through the function that raised it and the functions that called it, until it reaches a protected call (see below).

Propagation has three properties:

1. Every active function call is abandoned. The code that remains in each of them does not run, uncluding the remainder of any loops and blocks, and the call never returns a value. This applies equally to functions written in Teascript and to built-in functions.
2. Nothing is rolled back. The effects of the code that ran before the error remain: assignments to variables, changes made to lists, maps and instances, and any other side effects keep their values. A statement or expression that was interrupted may have left a partial effect, for instance if it assigned to two variables and the error occurred between the two.
3. Closures stay valid. A variable of an abandoned function that was captured by a closure continues to exist for as long as the closure does; see [Closures and Upvalue Capture](functions.md#closures-and-upvalue-capture).
4. There is no cleanup construct. No code runs automatically while an error unwinds. A program that must release a resource when an error occurs does so by running the failing code under `pcall`, and releasing the resource afterwards.
5. An error that nothing catches ends the program. If no protected call is active when an error is raised, the program terminates and the host environment reports the error. Code that has not yet been executed does not run. Statements already executed keep their effects, but no further code of the program runs.

## Protected Execution

### pcall

`pcall(function, arguments...)` calls `function` with the given arguments in **protected mode**; if an error occurs while the call is running, the error is caught instead of propagating, and `pcall` itself returns normally.

`pcall` returns a **list of exactly two elements**:

| Outcome | Result |
| --- | --- |
| the call finished without an error | `[true, value]`, where `value` is the value returned by the call |
| an error occurred | `[false, error_value]`, where `error_value` is the error value (a string) |

The result is a list so that it can be unpacked directly into two variables (see [Multiple Return Values](functions.md#multiple-return-values)):

```tea
var ok, result = pcall(parse_port, "8080")
// ok is true, result is 8080

var ok2, message = pcall(parse_port, "http")
// ok2 is false, message describes "invalid port: http"
```

The first argument is required, and the other arguments are passed on to the function in order. A function that returns no value gives `nil` as `value`.

### What is caught

`pcall` catches every error raised **while the called function is running**, whatever its origin: an error in the function itself, in any function that it calls directly or indirectly, an error raised with `error` or `assert`, resource exhaustion, and compile-time errors raised by `eval`, `loadstring` or `loadfile` (these functions raise the error of the compilation as an ordinary error). For example, a program can test source text before relying on it:

```tea
var ok, err = pcall(eval, "1 +")      // ok is false, err describes the syntax error
```

Errors raised *before* `pcall` is called, or after it has returned, are not affected by it.

### State After an Error is Caught

When `pcall` catches an error:

- Execution continues normally with the code that follows the call to `pcall`, in the function that called it. Only the activations of the functions that were running *inside* `pcall` are abandoned.
- Everything described under [Propagation](#propagation) holds for those abandoned activations: their effects remain, and their captured variables stay valid.
- `pcall` can be nested. An error is caught by the **innermost** active `pcall`; the code that called an outer `pcall` is unaffected unless the inner handler raises a new error.

### Rethrowing

A program that catches an error but cannot fully handle it passes it on by raising it again with `error`:

```tea
function fetch(url)
{
    var ok, result = pcall(download, url)
    if ok
    {
        return result
    }
    print("download failed: " + result)     // handle: report it...
    error(result)                           // ...and raise the same error value again
}
```

A rethrown error is a new error: it propagates from the point of the `error` call, and its message may therefore gain information about the calls active at that point.
