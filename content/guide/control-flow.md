---
title: Control flow
weight: 150
toc: true
---

Control flow is used to determine which chunks of code are executed and how many times. Various statements direct the execution of a program based on certain conditions, repeat blocks of code, and manage flow more effectively.

## Truth

All control flow is based on *deciding* whether or not to do something. This decision depends on some expressions's value. We take the entire universe of possible objects and divide them into two buckets: some we consider "true" and the rest are "false".

Obviously, the boolean `true` is in the "true" bucket and `false`is in "false", but what about values of other types? Teascript treats as false the following types:
- The value `nil`
- The boolean `false`
- The number `0`
- An empty string
- An empty list
- An empty map

This means that `1` and every other number and object is considered "true"

## If statements

The `if` statement lets you execute a chunk of code if a specified condition is true. It looks like this:

```tea
if ready { print("Let's go!") }
```

## Logical operators

Logical operators are used to combine multiple conditions, as they conditionally evaluate the right operand - they short circuit.

The `and` expression evaluates the left-hand argument. If it's false, it returns the value.

```tea
print(false and 1)  // false
print(1 and 2)  // 2
```

The `or` expression is reversed. If the left-hand argument is *true*.

```tea
print(false or 1)   // 1
print(1 or 2)   // 1
```

There is also the `not` unary expression, which inverts the truthiness of a condition.

```tea
print(not true)     // false
print(not false)    // true
```

## Conditional operator

The conditional (ternary) operator is a shorthand way to write a simple `if else` expression. It takes three operands: a condition, a result for true and a result for false.

```tea
print((score > 50) ? "Pass" : "Fail")
```

## While statements

It's hard to write a useful program without executing some chunk of code repeatedly. To do that, you use looping statements. There are two in Teascript, and they should be familiar if you’ve used other imperative languages.

The simplest, a `while` statement executes a chunk of code as long as a condition continues to hold. For example:

```tea
// Hailstone sequence
var n = 27
while n != 1
{
    if n % 2 == 0
    {
        n = n / 2
    }
    else
    {
        n = 3 * n + 1
    }
}
```

## For statements

While statements are useful when you want to loop indefinitely or according to some complex condition. But in most cases, you're looping through a list, a series of numbers, or some other "iterable" object. It looks like this:

```tea
for var fruit in ["apple", "orange", "banana"]
{
    print(fruit)
}
```

## Break statements

Sometimes, right in the middle of a loop body, you decide you want to bail out and stop. To do that, you can use a `break` statement. That immediately exits out of the nearest enclosing `while` or `for` loop.

```tea
for var i in [1, 2, 3, 4]
{
    print(i)            // 1
    if(i == 3) break    // 2
}                       // 3
```

## Continue statements

During the execution of a loop body, you might decide that you want to skip the rest of this iteration and move on to the next one. You can use a `continue` statement to do that. Execution will immediately jump to the beginning of the next loop iteration (and check the loop conditions).

```tea
for var i in [1, 2, 3, 4]
{
    if i == 2 { continue }  // 1
    print(i)                // 3
}                           // 4
```

## Numeric For (C style)

Teascript supports the traditional C-style `for` loop for numeric iteration. This type of loop is particularly useful for iterating through a range of numbers.

```tea
for var i = 0; i < 10; i += 2
{
    print(i);
}
```