---
title: Variables
weight: 160
toc: true
---

Variables are named slots for storing values. You define a new variable in Teascript using a `var` or `const` statement, like so:

```tea
var a = 1 + 2
const b = "Hello"
```

This creates a new variable `a` in the current scope and initializes it with the result of the expression following the `=`. Once a variable has been defined, it can be accessed by name as you would expect.

```tea
var animal = "Siamese cat"
print(animal)   // Siamese cat
```

## Scope

Teascript has true block scope: a variable exists from the point where it is defined until the end of the block where that definition appears.

```tea
{
    print(a)    // Syntax error! "a" doesn't exist yet
    var a = 123
    print(a)    // 123
}
print(a)    // Syntax error! "a" doesn't exist anymore
```

All variables defined inside a block scope are *local*. Declaring a variable in an inner scope with the same name as an outer one is called *shadowing* and is not an error (although it's not something you likely intend to do much).

```tea
var a = "outer"
{
    var a = "inner"
    print(a)    // inner
}
print(a)    // outer
```

## Assignment

After a variable has been declared using `var`, you can assign to it using `=`

```tea
var a = 123
a = 234
```

An assignment walks up the scope stack to find where the named variable is declared. It's an error to assign to a variable that isn't defined. Teascript doesn’t roll with implicit variable definition.

When used in a larger expression, an assignment expression evaluates to the assigned value.

```tea
var a = "before"
print(a = "after")  // after
```

Declaring a variable using `const` prevents the variable from being reassigned, giving you a compile time syntax error:

```tea
const a = 42 * 2
animal = "Thing"  // Syntax error!
```