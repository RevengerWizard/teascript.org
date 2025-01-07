---
title: Functions
weight: 150
toc: true
---

Like many languages today, functions in Teascript are blocks of code that allow you to encapsulate code for reuse. 
Functions can be created using the `function` keyword followed by the function name, a set of parentheses for parameters, and a block of code enclosed in curly braces.

```tea
function greet()
{
    print("Hello world!")
}
```

To call the function, simply use its name followed by parentheses:

```tea
greet()     // Hello world!
```

## Function parameters

Default parameters:

```tea
function greet(name = "Guest")
{
    console.log("Hello, " + name + "!");
}

greet()         // Hello, Guest!
greet("Alice")  // Hello, Alice!
```

Rest parameters:

```tea
function sum(...numbers) 
{
    return numbers.reduce((total, num) => total + num, 0)
}

print(sum(1, 2, 3)) // 6
print(sum(4, 5))    // 9
```

## Returning values

Functions can return values using the `return` statement. This allows the function to pass a value back to a caller.

```tea
function add(a, b)
{
    return a + b
}

var result = add(5, 3)
print(result)     // 8
```

If `return` isn't used by the function, it will return `nil`:

```tea
function thing() { }
print(thing())  // nil
```

## Closures

As one might expect, functions are closures. A closure is a function that can access variables defined outside of their scope. They will hold onto closed-over variables even after leaving the scope where the function is defined:

```tea
function make_counter()
{
    var count = 0
    return function() {
        count++
        return count
    }
}

var counter = make_counter()
print(counter())    // 1
print(counter())    // 2
```

## Lambdas

