---
title: Functions
number: 5.
weight: 500
---

Functions are the primary unit of abstraction in Teascript. A function groups a sequence of statements into a named, reusable operation, optionally accepting inputs and producing a result. Functions in Teascript are first-class values: they can be stored in variables, passed as arguments, and returned from other functions.

A function is declared with the `function` keyword, followed by a name, a parameter list, and a body block:

```tea
function greet(name)
{
    print("Hello, " .. name)
}

greet("world")  // Hello, world
```

This form of constructing a function in Teascript effectively declares a new module-level variable named `greet`.

A function that reaches the end of its body without a `return` statement implicitly returns `nil`.

## Arguments

When calling a function, arguments are passed positionally. The first argument maps to the first parameter, the second to the second, and so on. Passing too few arguments binds the missing parameters to `nil`; passing too many silently discards the excess values.

```tea
function add(a, b)
{
    return a + b
}

add(1, 2)   // 3
add(1)      // error at runtime: b is nil, cannot add nil to number
add(1, 2, 3)    // 3, third argument is discarded
```

## Default Arguments

Parameters can be given a default value, which is used when the caller does not supply a corresponding argument. Default arguments are written as `param = expr` in the parameter list:

```tea
function greet(name, greeting = "Hello")
{
    print(greeting .. ", " .. name)
}

greet("Alice")          // Hello, Alice
greet("Alice", "Hi")    // Hi, Alice
```

The default expression is evaluated at the call site each time it is needed, not once when the function is defined. This means it can reference other variables in scope and will reflect their current value:

```tea
var default_step = 1
function range(start, step=default_step)
{
    // ...
}
```

Parameters follow a fixed ordering: positional parameters must come first, followed by parameters with defaults, and finally a variadic parameter if present. Placing a positional parameter after a default one is a compile-time error.

## Variadic Arguments

A function can accept a variable number of arguments by ending its parameter list with a variadic parameter, written as `...name`:

```tea
function sum(...values)
{
    var total = 0
    for var v in values
    {
        total += v
    }
    return total
}

sum(1, 2, 3)        // 6
sum(1, 2, 3, 4, 5)  // 15
```

Inside the function, the variadic parameter is bound to a list containing all the extra arguments passed at the call site. It may be empty if no extra arguments were provided.

A variadic parameter must always appear last in the parameter list, after both positional and default parameters:

```tea
function log(level, timestamp = now(), ...messages)
{
    // level is positional, timestamp has a default, messages catches the rest
}
```

Only one variadic parameter is permitted per function.

## Multiple Return Values

While Teascript technically does not have a distinct notion of multiple return values at the language level, a function that needs to return more than one result can still do so by returning a _list_.

The caller of the function can then unpack its items using a multi-variable declaration:

```tea
function min_max(list)
{
    var min = list[0]
    var max = list[0]
    for var v in list
    {
        if v < min { min = v }
        if v > max { max = v }
    }
    return [min, max]
}

var lo, hi = min_max([3, 1, 4, 1, 5, 9])
print(lo)   // 1
print(hi)   // 9
```

The unpacking follows the same rules described in section 4.4: if the list has fewer values than variables, the remaining ones are bound to `nil`; if it has more, the excess is discarded.

Returning a list is a deliberate and transparent convention — the caller always receives a plain list, and can choose to unpack it, pass it along, or index into it directly.

```tea
var result = min_max([3, 1, 4, 1, 5, 9])
print(result[0])    // 1
print(result[1])    // 9
```

## Closures

Functions in Teascript are to all effects also closures.

A closure is a function defined inside another function which can reference and capture variables from the enclosing scope, even after that scope has exited. The captured variables are called _upvalues_ and will live as long as the original closure is kept around.

```tea
function make_counter()
{
    var count = 0
    function increment()
    {
        count += 1
        return count
    }
    return increment
}

var counter = make_counter()
print(counter())    // 1
print(counter())    // 2
print(counter())    // 3
```

Here, `increment` captures `count` from `make_counter`. Each call to `make_counter` produces a new closure with its own independent `count` upvalue. Two counters created separately do not share state:

```tea
var a = make_counter()
var b = make_counter()

print(a())  // 1
print(a())  // 2
print(b())  // 1
```

Upvalues are shared by reference between all closures that capture the same variable from the same scope. If two inner functions both capture the same variable, mutations made by one are visible to the other:

```tea
function make_pair()
{
    var shared = 0
    function get() { return shared }
    function set(v) { shared = v }
    return [get, set]
}

var pair = make_pair()
var get, set = pair

print(get())    // 0
set(42)
print(get())    // 42
```

Closures capture the variable itself, not its value at the time of capture. This is an important distinction: a closure always sees the current value of the upvalue, not a snapshot of it.

## Lambdas

For short, anonymous functions, Teascript provides lambda expressions. 

A lambda is written as a parameter list followed by an arrow `=>` and either a block body or a single expression:

```tea
var double = (x) => x * 2
var add = (a, b) => a + b

print(double(5))    // 10
print(add(3, 4))    // 7
```

When the body is a single expression, its value is implicitly returned. When a block is needed — for multiple statements or explicit control flow — curly braces are used:

```tea
var clamp = (x, lo, hi) => {
    if x < lo { return lo }
    if x > hi { return hi }
    return x
}
```

Lambda parameters follow the same rules as regular function parameters: positional parameters first, then defaults, then an optional variadic:

```tea
var greet = (name, greeting = "Hello") => greeting .. ", " .. name
var sum = (...values) => {
    var total = 0
    for var v in values { total += v }
    return total
}
```

Lambdas are closures in exactly the same way as named functions: they capture upvalues from their enclosing scope by reference, and the same sharing semantics apply.

Lambdas are most naturally used where a short function is passed as an argument or assigned inline, avoiding the need to name a function that is only used once:

```tea
var numbers = [3, 1, 4, 1, 5, 9]
var evens = numbers.filter((x) => x % 2 == 0)
var doubled = numbers.map((x) => x * 2)
```
