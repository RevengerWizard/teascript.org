---
title: Expressions
number: 3.
weight: 300
---

Expressions denote values. In Teascript, expressions include numeric constants and string literals, list and map literals, variables, unary and binary operators, and function calls. This chapter covers all of the operators Teascript provides, what they operate on, and how they interact through precedence rules.

## Arithmetic Operators

Teascript supports the usual arithmetic operators: binary addition `+`, subtraction `-`, multiplication `*`, division `/`, and unary negation `-`. All of them operate primarily on numbers.

```tea
print(10 + 3)   // 13
print(10 - 3)   // 7
print(10 * 3)   // 30
print(10 / 3)   // 3.3333...
print(-10)      // -10
```

Teascript also provides exponentiation with `**`:

```tea
print(2 ** 8)   // 256
print(9 ** 0.5) // 3.0
```

The modulo operator `%` returns the remainder of integer division:

```tea
print(10 % 3)   // 1
```

## Comparison Operators

Teascript provides the following comparison operators:

`<` `>` `<=` `>=` `==` `!=`

All comparison operators always produce either `true` or `false`.

The operators `<`, `>`, `<=`, and `>=` are defined for numbers and strings. When applied to strings, they compare lexicographically.

```tea
print(10 > 3)       // true
print("abc" < "b")  // true
```

The operators `==` and `!=` test for equality and inequality respectively, and can be applied to any two values. Two values are equal only if they have the same type and the same value. In particular, `0 == false` is `false`, and `nil == false` is `false`.

```tea
print(1 == 1)       // true
print(1 == "1")     // false
print(nil == false) // false
```

## Logical Operators

The logical operators are `and`, `or`, and `not` / `!`.

The operators `and` and `or` do not necessarily return a boolean — they return one of their operands. `and` returns its first argument if it is falsy; otherwise it returns its second argument. `or` returns its first argument if it is truthy; otherwise it returns its second argument.

```tea
print(1 and 2)      // 2
print(false and 2)  // false
print(1 or 2)       // 1
print(false or 2)   // 2
```

Both `and` and `or` use short-circuit evaluation: the second operand is only evaluated if necessary. This matters when the second operand has side effects, or when it might otherwise produce an error.

```tea
var x = nil
var y = x and x.value   // safe: x.value is never evaluated
```

Teascript also supports the ternary conditional expression `a ? b : c`, which evaluates `b` if `a` is truthy, and `c` otherwise. Only one of `b` or `c` is evaluated.

```tea
var label = x > 0 ? "positive" : "non-positive"
```

The operators `not` and `!` are equivalent — both negate a value and always return `true` or `false`.

```tea
print(not true)     // false
print(!false)       // true
print(not nil)      // true
print(not 0)        // false
```

## Identity Operators

The identity operators `is` and `in` test properties of a value rather than comparing it to another.

The `is` operator tests whether a value is of a given type or class:

```tea
print(1 is Number)      // true
print("hi" is String)   // true
print([] is List)       // true
```

The `in` operator tests whether a value is contained within a collection:

```tea
var list = [1, 2, 3]
print(2 in list)    // true
print(5 in list)    // false
```

Both operators can be negated by composing them with `not`:

```tea
print(1 is not String)  // true
print(5 not in list)    // true
```

The negated forms `is not` and `not in` are parsed as single compound operators, and should be preferred over wrapping the whole expression in `not (...)` for readability.

## Bitwise Operators

Teascript provides the standard set of bitwise operators, operating on integer values:

operator | description
---|---
`&` | Bitwise AND
`\|` | Bitwise OR
`^` | Bitwise XOR
`~` | Bitwise NOT (unary complement)
`<<` | Left shift
`>>` | Right shift

```tea
print(0b1010 & 0b1100)  // 0b1000 — 8
print(0b1010 | 0b1100)  // 0b1110 — 14
print(0b1010 ^ 0b1100)  // 0b0110 — 6
print(~0b1010)          // bitwise complement
print(1 << 3)           // 8
print(16 >> 2)          // 4
```

These operators follow the same semantics as their C counterparts.

## Assignment Expressions

### Simple Assignment

The assignment operator `=` binds a new value to an already-declared variable. Unlike many expressions, assignment does not produce a value that can be used in a larger expression — it is a statement.

```tea
var x = 10
x = 20
```

Attempting to assign to an undeclared name, or to a `const` binding, is a compile-time error.

### Compound Assignment

Teascript provides compound assignment operators that combine an arithmetic or bitwise operation with assignment. These are shorthand for updating a variable in place:

operator | equivalent to
---|---
`+=` | `x = x + y`
`-=` | `x = x - y`
`*=` | `x = x * y`
`/=` | `x = x / y`
`%=` | `x = x % y`
`**=` | `x = x ** y`
`&=` | `x = x & y`
`\|=` | `x = x \| y`
`^=` | `x = x ^ y`
`<<=` | `x = x << y`
`>>=` | `x = x >> y`

```tea
var x = 10
x += 5      // x is now 15
x *= 2      // x is now 30
x >>= 1     // x is now 15
```

## Precedence

Operator precedence in Teascript follows the table below, from higher to lower priority:

prec | operator | description | associates
---|---|---|---
1 | `.` `()` | Member access, calls | Left
2 | `[]` | Subscript | Left
3 | `not` `!` `~` `-` | Logical not, complement, negation | Right
4 | `**` | Exponentiation | Left
5 | `*` `/` `%` | Multiply, divide, modulo | Left
6 | `+` `-` | Add, subtract | Left
7 | `..` | Range | Left
8 | `<<` `>>` | Left shift, right shift | Left
9 | `&` | Bitwise AND | Left
10 | `^` | Bitwise XOR | Left
11 | `\|` | Bitwise OR | Left
12 | `<` `>` `<=` `>=` | Comparison | Left
13 | `is` `is not` `in` `not in` | Identity, membership | Left
14 | `==` `!=` | Equality | Left
15 | `and` | Logical AND | Left
16 | `or` | Logical OR | Left
17 | `? :` | Ternary | Right
18 | `=` `+=` `-=` ...| Assignment | Right

Most operators are **left** associative, except for assignment, the ternary `? :`, and the unary operators, which are right associative. Therefore, the following expressions on the left are equivalent to those on the right:

```tea
2 ** 3 ** 2     // (2 ** 3) ** 2
a = b = 10      // a = (b = 10)
not not x       // not (not x)
```

When in doubt, always use explicit parentheses to group expressions. It is easier than looking up the guide, and you will likely have the same doubt when you read the code again.
