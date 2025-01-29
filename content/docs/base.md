---
title: base
weight: 100
toc: true
---

## print

The `print` function is a global function in Teascript that is used to output values to the console. If no arguments are provided, it prints a new line. If arguments are provided, it prints each value separated by a tab.

#### Syntax

```tea
print(...)
```

#### Parameters

-   `...`: The values to be printed. These can be of any type.

#### Return value

None.

#### Example

```tea
print("Hello, world!")  // "Hello, world!"

var x = 5
var y = 10
print(x, y)  // "5   10"
```

---

## input

The `input` function reads a line of text from the standard input stream (usually the keyboard) and returns it as a string.

#### Syntax

```tea
input(prompt='')
```

#### Parameters

-   `prompt`: An optional string to be printed before reading the input.

#### Return value

A string containing the text entered by the user.

#### Example

```tea
var name = input("Enter your name: ")
print("Hello, " + name + "!")
```

---

## assert

The `assert` function is used to check if a given condition is `true`, and if it is not, it raises an error with an optional error message.

#### Syntax

```tea
assert(condition, message)
```

#### Parameters

-   `condition`: A boolean value or expression to be evaluated.
-   `message` (optional): A string to be printed as the error message if the assertion fails.

#### Return value

`nil` if the assertion is successful. If the assertion fails, it raises an error with the optional error message.

#### Example

```tea
assert(5 > 3, "5 is not greater than 3")
assert([1, 2, 3].len == 3, "The list does not have 3 elements")
```

---

## error

The `error` function is used to raise an error with a specified message. It is similar to the `assert` function, but `error` always raises an error, whereas `assert` only does so if the given condition is `false`.

#### Syntax

```tea
error(message)
```

#### Parameters

-   `message`: A string to be printed as the error message.

#### Return value

The function does not return a value. Instead, it raises an error with the specified message message.

#### Example

```tea
function divide(x, y)
{
    if(y == 0)
        error("Cannot divide by zero")
    return x / y
}

divide(5, 0)  // Raises an error with message "Cannot divide by zero"
```

---

## typeof

The `typeof` function is used to determine the type of a value.

#### Syntax

```tea
typeof(value)
```

#### Parameters

-   `value`: The value whose type is to be determined.

#### Return value

A string with the name of the type of the value.

#### Example

```tea
print(typeof(5))  // "number"
print(typeof("hello"))  // "string"
print(typeof([1, 2, 3]))  // "list"
print(typeof({a = 1, b = 2}))  // "map"
print(type(1..10))  // "range"
```

---

## gc

The `gc` function is used to invoke the garbage collector, which is responsible for freeing up memory that is no longer being used by the program.

#### Syntax

```tea
gc()
```

#### Parameters

None.

#### Return value

None.

#### Example

```tea
gc()
```

---

## interpret

The `interpret` function is used to interpret and execute a given string of Teascript code.

#### Syntax

```tea
interpret(code)
```

#### Parameters

`code`: A string containing the Teascript code to be interpreted and executed.

#### Return value

None.

#### Example

```tea
var code = 'print("Hello, World!")'
interpret(code)
```

---

## char

The `char` function returns a string containing a single character, given an ASCII code.

#### Syntax

```tea
char(code)
```

#### Parameters

-   `code`: An integer representing the ASCII code of the character to be returned.

#### Return value

A string containing the character represented by the given ASCII code.

#### Example

```tea
print(char(65))  // "A"
print(char(97))  // "a"
print(char(48))  // "0"
```

---

## ord

The `ord` function returns the ASCII code of a given character.

#### Syntax

```tea
ord(char)
```

#### Parameters

-   `char`: A string containing the character whose ASCII code is to be returned.

#### Return value

An integer representing the ASCII code of the given character.

#### Example

```tea
print(ord("A"))  // 65
print(ord("a"))  // 97
print(ord("0"))  // 48
```

---

## tonumber

The `tonumber` function converts a string to a number or raises an error if the string cannot be converted.

#### Syntax

```tea
tonumber(x)
```

#### Parameters

-   `x`: a string.

#### Return value

A number or an error if the string provided cannot be converted.

#### Example

```tea
print(number("123"))  // 123
print(number("123.45"))  // 123.45
print(number("0xff"))  // 255
```