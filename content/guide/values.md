---
title: Values
weight: 120
toc: true
---

Values are the built-in atomic object types that all other objects are composed of. They can be created through literals, expressions that evaluate to a value. All values are immutable—once created, they do not change. The number `3` is always the number `3`. The string `"frozen"` can never have its character array modified in place.

## Booleans

A boolean value represents truth or falsehood. There are two boolean literals, `true` and `false`.

## Numbers

Like other scripting languages, Teascript has a single numeric type: double-precision floating point. Number literals look like you expect coming from other languages:

```tea
0
1234
-5678
3.14159
1.0
-12.34
0.0314159e02
0.0314159e+02
314.159e-02
0xcaffe2
0b100010
0o457
```

## Strings

A string is an array of bytes. Typically, they store characters encoded in UTF-8, but you can put any byte values in there, even zero or invalid UTF-8 sequences. (You might have some trouble printing the latter to your terminal, though.) Strings can be created with single quotes ('), double quotes ("), or backticks (```).

## Escaping

A handful of escape characters are supported:

```tea
"\0"    // The NUL byte: 0
"\""    // A double quote character
"\\"    // A backslash
"\$"    // A dollar sign
"\a"    // Alarm beep
"\b"    // Backspace
"\e"    // ESC character
"\f"    // Formfeed
"\n"    // Newline
"\r"    // Carriage return
"\t"    // Tab
"\v"    // Vertical tab

"\x48"        // Unencoded byte     (2 hex digits)
"\u0041"      // Unicode code point (4 hex digits)
"\U0001F64A"  // Unicode code point (8 hex digits)
"\123"        // Decimal byte value (3 decimal digits)
```

A `\x` followed by two hex digits specifies a single unencoded byte:

```tea
print("\x48\x69\x2e")   // Hi.
```

A `\u` followed by four hex digits can be used to specify a Unicode code point:

```tea
print("\u0041\u0b83\u00DE") // AஃÞ
```

A capital `\U` followed by eight hex digits allows Unicode code points outside of the basic multilingual plane, like all-important emoji:

```tea
print("\U0001F64A\U0001F680")   // 🙊🚀
```

A `\` followed by three decimal digits specifies a single byte value:

```tea
print("\84\101\97")   // SAL
```

## Interpolation

String literals also allow `interpolation`. If you have a dollar sign (`$`) followed by an expression inside square brackets, the expression is evaluated.

```tea
print("Math ${3 + 4 * 5} is fun!")  // Math 23 is fun!
```

Arbitrarily complex expressions are allowed inside the brackets:

```tea
print("wow ${[1, 2, 3].map(n => n * n).join()}")    // wow 149
```

An interpolated expression can even contain a string literal which in turn has its own nested interpolations, but doing that gets unreadable pretty quickly.

## Multiline strings

Teascript supports multiline strings using triple quotes, which can be single, double, or backticks:

````tea
'''This is a 
multiline string
with single quotes.'''

"""This is a 
multiline string
with double quotes."""

```This is a 
multiline string
with backticks.```
````

## Nil

Teascript has a special value `nil`. It functions a bit like `void` in some languages: it indicates the absence of a value. If you call a function or method that doesn't return anything and get its returned value, you get `nil` back.