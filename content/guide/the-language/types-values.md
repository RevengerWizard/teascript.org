---
title: Types and Values
number: 2.
weight: 200
---

Teascript is a dynamically typed language. This means that there are no type definitions in the language; each value carries its type.

There are eight basic types in Teascript: _nil_, _bool_, _number_, _range_, _string_, _function_, _list_ and _map_. The `typeof` built-in function can be used to retrieve the type name of a given value:

```tea
print(typeof(nil))      // "nil"
print(typeof(true))     // "bool"
print(typeof(2004))     // "number"
print(typeof(1..10))    // "range"
print(typeof("hello"))  // "string"
print(typeof(typeof))   // "function"
```

Although, throughout this guide you will notice that there are _more_ than these eight basic types.

Variables have no predefined types; any variable may hold values of any type:

```tea
var a = 10
print(typeof(a))    // "number"
a = "hello"
print(typeof(a))    // "string"
a = print
a(typeof(a))        // "function"
```

## Nil

`nil` is a single value type whose main property is to differentiate between the presence or absence of a useful value.

## Bools

`bool` is a type representing the two traditional boolean values `true` and `false`.

## Numbers

The `number` type represents real (double-precision floating-point) numbers

## Strings

Strings are sequences of characters. A character in Teascript is an eight-bit numeric value which can represent a specific letter or symbols; since it's a numeric value, strings be used to represent more than letters and words. This means that you can store arbitrary binary data into a string. Strings in Teascript are immutable, meaning you cannot change any character present inside a string. Instead, you will need to create a new string with the desired changes:

```tea
var str = "shining cats"
var res = s.replace("cats", "coins")
print(str)  // "shining cats"
print(res)  // "shining coins"
```

You can delimit literal strings using single quotes, double quotes, or backticks:

```tea
var s = "first line"
var t = 'another line'
var r = `last line`
```

Because of this, if a string needs to contain single or double quotes or backticks, one can alternate the literal delimiters, or use escape the required literal using a backslash. These are called _escape sequences_ and can also be used to put in the string characters which otherwise wouldn't be normally possible to represent inside a text editor:

|   |   |
|---|---|
|`\"`|double quote|
|`\'`|single quote|
|``\` ``|backtick|
|`\0`|(embeded) zero|
|`\$`|dollar sign|
|`\a`|bell|
|`\b`|backspace|
|`\e`|ESC character|
|`\f`|form feed|
|`\n`|new line|
|`\r`|carriage return|
|`\t`|horizontal tab|
|`\v`|vertical tab|
|`\\`|backslash|
|`\xhh`|hexadecimal escape|
|`\uxxxx`|short unicode escape|
|`\Uxxxxxxxx`|long unicode escape|
|`\ddd`|decimal escape|

```
> print("first line\nsecond line\n\"line in quotes\", 'in quotes'")
fist line
second line
"line in quotes", 'in quotes'
> print('a backslash inside quotes: \'\\\'')
a backslash inside quotes: '\'
> print("a simpler way: '\\'")
a simpler way: '\'
```

A character can also be specified by its numerical value through the escape sequence `\ddd`, where `ddd` represents a three digit _decimal_ value. As a somewhat complex example, the two literals `"alo\n123\""` and `'\97lo\10\04923"'` have the same value, in a system using ASCII: 97 is the ASCII code for `a`, 10 is the code for newline, and 49 (`\049` in the example) is the code for the digit 1.

We can also delimit strings by using **three** single, double quotes or backticks. These are called _raw strings_, can run for multiple lines and do not interpret escape sequences. Moreover, this form ignores, if present, the first new line inside the string. This form is especially useful for writing long strings, or program pieces:

```tea
const page = '''
<html>
<head>
<title>A simple HTML page</title>
</head>
<body>
<a href="https://teascript.org">Teascript</a>
</body>
</html>
'''
print(page)
```

Teascript provides the ability to concatenate multiple string literals at compile time, using the `+` operator:

```tea
print('hello' + 'world' + '!')
```

One important aspect to note in Teascript is that no form of implicit string coercion is allowed. This means that the following cases effectively make no sense:

```tea
print(1 + "20")     // runtime error
print("hi" + 5)     // runtime error
```

It is possible to convert any Teascript value into a string using the built-in function `tostring`.

```tea
print(tostring(false))      // "false"
print(tostring(1.34676543)) // "1.34676543"
print(tostring(1..100))     // "1..100"
print(tostring(print))      // "<function>"
```

String literals also allow for **interpolation**. Using the dollar sign `$` followed by valid Teascript code inside square brackets, its result is evaluated

```tea
print("Math ${3 + 4 * 5} is fun!")  // Math 23 is fun!
```

Arbitrarily complex expressions are allowed inside the brackets:

```tea
print("wow ${[1, 2, 3].map(n => n * n).join()}")    // wow 149
```

An interpolated expression can also contain other string literals, which in turn have their own nested interpolations, but doing so can get unreadable pretty quickly.

## Ranges

Ranges allow you to express a numeric interval

## Functions

Functions are first-class values in Teascript. This means that functions can be stored as variables, passed as arguments to other functions, and returned as results. Moreover, Teascript offers good support for functional programming, including nested functions with proper lexical scoping.

Teascript can call functions written in Teascript, as well as functions written in C. The built-in modules in Teascript are in fact written in C. Application programs may define other functions in C.
