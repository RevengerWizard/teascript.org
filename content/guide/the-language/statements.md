---
title: Statements
number: 4.
weight: 400
---

Statements could be considered as the building blocks making up a Teascript program. Unlike expressions, which produce a value, statements direct the flow of execution: declaring variables, branching, looping, and returning from functions. This chapter covers the core statement forms of the language.

## Blocks and Scope

A block is a sequence of statements enclosed in curly braces `{` `}`. Blocks define scope; any variable declared inside a block is local to that block, and ceases to exist once that block is left.

```tea
{
    var x = 10
    print(x)    // ok, "10"
}
print(x)    // error, "x is not defined"
```

Blocks are not only used to group statements; they appear as the body of every control flow and function construct in Teascript. They can also stand alone, as above, simply to introduce a new scope.

## Variable Declarations

Unlike other languages, variables in Teascript must be explicitly declared before using them. Teascript has two kinds of variable declarations: `var` and `const`. Both introduce a new name into the current scope.

### var

A `var` declaration introduces a mutable binding. The variable may be assigned a new value at any point after its declaration.

```tea
var x = 10
x = 20  // ok
```

A `var` declaration may omit the initializer, in which case the variable is bound to `nil` until assigned.

```tea
var x
print(x)    // nil
x = 10
print(x)    // 10
```

### const

A `const` declaration binds a name to a value that cannot be re-assigned after its first initialization. Attempting to do so is an error.

```tea
const y = 10
y = 20  // error, "cannot assign to a constant"
```

Unlike `var`, a `const` declaration must always provide an initializer. Declaring a constant without a value has no meaningful interpretation and is a compile-time error.

## Name Resolution

Teascript resolves names at compile time, before any code is executed. This has some notable consequences worth understanding early on.

### Globals

Global names, such as `print`, `typeof`, and other facilities provided by the host, are made available before any user code is loaded. They are not declared in any source file; the host environment registers them into the runtime prior to execution. The full set of globals available in a standard Teascript environment is covered in Part IV.

### Module-Level Resolution

Names declared at the top level of a file, outside any function or block, are _module-level_ names. These are resolved at compile time, within the file they are declared in. This means that using a name before it has been declared is a compile error, not a runtime one.

```tea
print(x)    // error, "x is not defined"
var x = 10
```

Forward references to module-level names are not permitted within the same file. If you attempt to reference a name before its declaration appears in the source, the compiler will reject the program. This also applies to `const` — it must be declared before use, and exactly once.

### Local Resolution

Names declared inside a function or a nested block are _local_ to that scope. Local names shadow any module-level or global name of the same spelling for the duration of their scope.

```tea
var x = "module"

{
    var x = "local"
    print(x)    // "local"
}

print(x)    // "module"
```

Name resolution always proceeds from the innermost enclosing scope outward: local first, then enclosing blocks, then module level, then globals. The first match found is used.

## Multi-Variable Assignment

Teascript allows declaring and assigning multiple variables in a single statement. This can keep related declarations together and is also the natural way to capture multiple return values from a function.

Multiple variables can be declared together with a single `var` or `const`:

```tea
var a, b, c
```

When declared this way without initializers, each variable is bound to `nil`. If initializers are provided, every variable in the list must have one:

```tea
var a = 1, b = 2, c = 3
```

It is not valid to partially initialize a multi-variable declaration — either all variables have initializers, or none of them do. This avoids ambiguity about which variables are `nil` and which are intentionally unset.

Multiple variables can also be assigned from a single expression on the right-hand side. This is primarily useful when calling a function that returns multiple values. In Teascript, multiple return values are represented as a list, and a multi-variable declaration will unpack them positionally:

```tea
var a, b, c = multi()
```

Here, `a` receives the first value, `b` the second, and `c` the third. If the function returns fewer values than there are variables, the remaining ones are bound to `nil`. If it returns more, the excess values are discarded. Multiple return values are discussed in detail in section 5.3.

As with single declarations, `const` can be used in place of `var` for any of these forms, with the same restriction that every variable must be initialized and cannot be re-assigned.

```tea
const a, b, c = multi()
```

## Control Flow

Teascript provides a small and conventional set of control flow structures: `if` for conditionals, and `while`, `do while`, and `for` for iteration.

The condition expression in any of these constructs may be any kind of value. The rules for what counts as _truthy_ or _falsy_ are covered in section 2.2.

### if / else

An `if` statement evaluates a condition and executes a block if it is _truthy_. An `if` statement can be followed by an optional `else` branch, which executes when the condition is _falsy_.

```tea
if x > 0
{
    print("positive")
}
else
{
    print("non-positive")
}
```

Chains of `else if` are supported for testing multiple conditions in sequence.

```tea
if x > 0
{
    print("positive")
}
else if x < 0
{
    print("negative")
}
else
{
    print("zero")
}
```

### while / do while

A `while` statement creates a loop that executes its body repeatedly, as long as its condition remains _truthy_.

```tea
var i = 0
while i < 10
{
    print(i)
    i += 1
}
```

A `do while` loop is similar, but its condition is evaluated after the body rather than before. This guarantees that the body executes at least once, regardless of the condition.

```tea
var i = 0
do
{
    print(i)
    i += 1
}
while i < 10
```

### Numeric for

The `for` statement has two variants. The first is the _numeric_ `for`, which has three parts: an initializer, a condition, and an increment expression, separated by semicolons.

```tea
for var i = 0; i < 10; i += 1
{
    print(i)
}
```

The initializer runs once before the loop begins. Before each iteration, the condition is checked; if it is _falsy_, the loop exits. The increment expression runs at the end of each iteration, after the body.

### Generic for

The _generic_ `for` allows traversing all values produced by an _iterable_ object.

```tea
var list = [1, 2, 3]
for var item in list
{
    print(item)
}
```

Any object in Teascript that implements the defined _iterator protocol_ can be traversed this way. This includes the built-in collection types, as well as user-defined classes. The iterator protocol is discussed further in chapter 9.

## break / continue / return

The statements `break`, `continue`, and `return` alter the normal flow of execution within loops and functions.

The `break` statement exits the innermost enclosing loop immediately.

```tea
for var i = 0; i < 10; i += 1
{
    if i == 5 { break }
    print(i)
}
// prints 0 through 4
```

The `continue` statement skips the remainder of the current loop iteration and proceeds to the next one.

```tea
for var i = 0; i < 10; i += 1
{
    if i % 2 == 0 { continue }
    print(i)
}
// prints 1, 3, 5, 7, 9
```

Using `break` or `continue` outside of a loop is a compile-time error.

The `return` statement exits the current function, optionally producing a value. If no expression follows `return`, it implicitly returns `nil`. Using `return` at the module level, outside any function, is not permitted and will result in a compile-time error.

```tea
function double(x)
{
    return x * 2
}
```

Multiple return values are covered in section 5.3.
