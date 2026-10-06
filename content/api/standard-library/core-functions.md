---
title: Core Functions
number: 2.
weight: 200
---

The core or base functions are a set of global functions that Teascript makes available for simple operations that might not fit inside a particular module or type, or it would rather be better accessible directly.

---

## print()

```tea
function print(...)
```

The `print` function is a global function in Teascript that is used to output values to the console. If no arguments are provided, it prints a new line `\n`. If arguments are provided, it prints each value separated by a tab `\t`.

#### Arguments
- `...`: the values to be printed. These can be of any Tea type.

#### Returns
Always `nil`.

#### Example
```tea
print()
print(1, 2, 3);                 // 1    2   3
print(true, 789.98, "hello");   // true 789.98  "hello"

print("Hello, world!")          // "Hello, world!"

var x = 5
var y = 10
print(x, y)                     // "5   10"
```

---

## input()

```tea
function input(prompt='')
```

The `input` function reads a line of text from the standard input stream of the console, and returns it as a string.

#### Arguments
- `prompt`: an optional string value, defaults as an empty string `""`.

#### Returns
The text entered by the user as a Tea string.

#### Example
```tea
var name = input("Enter your name: ")
print("Hello, " + name + "!")
```

---

## assert()

The `assert` function is used to check whether a given condition is `true`, and if is not, it raises an error with an optional error message.

```tea
function assert(condition, message=nil)
```

#### Arguments
- `condition`: a boolean value or an expression to be evaluated based on its truthyness.
- `message`: an optional string to be printed as the error message if the `condition` arguments results `false`.

#### Returns
`nil` when the condition results `true`. It does not return if the condition is `false`, raising an error instead.

#### Example
```tea
assert(5 > 3, "5 is not greater than 3")
assert([1, 2, 3].len == 3, "The list does not have 3 elements")
```

---

## error()

```tea
function error(message)
```

The `error` function is used to raise an error with a specified string message. It is similar to the `assert` function, but `error` always raises an error.

#### Arguments
- `message`: A string to be used as the error message.

#### Errors
Raises an error using the specified string message.

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

## typeof()

```tea
function typeof(value)
```

The `typeof` function is used to determine the type of a given value.

#### Arguments
- `value`: The Tea value whose type is to be determined.

#### Returns
A string containing the name of the value type.

#### Example
```tea
print(typeof(5))  // "number"
print(typeof("hello"))  // "string"
print(typeof([1, 2, 3]))  // "list"
print(typeof({a = 1, b = 2}))  // "map"
print(type(1..10))  // "range"
```

---

## tostring()

```tea
function tostring(value)
```

The `tostring` function converts any value into its string representation. It respects an instance or userdata `tostring()` special method if one is defined, allowing custom formatting for these objects.

#### Arguments
- `value`: The Tea value to convert to a string

#### Returns
A string representation of `value`. For plain values, the result is a readable form suitable for display or concatenation.

#### Example
```tea
print(tostring(123))          // "123"
print(tostring(true))         // "true"
print(tostring([1, 2, 3]))    // "[1, 2, 3]"
print(tostring({a = 1}))      // "{a = 1}"
```

---

## tonumber()

```tea
function tonumber(value, base=10)
```

The function `tonumber` converts a given Tea value into a number, or returns `nil` if is unable to convert it. When `base` is 10 (default), any value that can be coerced into a number is converted directly. For other bases (between `2` and `36`), the input must be a string, which is interpreted as a number in that base.

#### Arguments
- `value`: The Tea value to coerce into a number
- `base`: An optional number specifying the base for string parsing. Defaults to `10`

#### Returns
The parsed number, or `nil` if the conversion fails.

#### Example
```tea
print(tonumber("123"))      // 123
print(tonumber("123.45"))   // 123.45
print(tonumber(42))         // 42
print(tonumber("ff", 16))   // 255
print(tonumber("101", 2))   // 5
print(tonumber("xyz"))      // nil
```

---

## gc()

```tea
function gc()
```

The `gc` function is used to invoke the Teascript garbage collector, which is responsible for freeing up memory that is no longer being used by the Tea program.

#### Arguments
The function takes no arguments

#### Returns
The number of Kbytes being collected. This is expressed as: number of bytes / 2 ** 10

#### Example
```tea
const collected = gc()
print('Collected ', collected, 'Kib')
```

--- 

## eval()

```tea
function eval(source)
```

The `eval` function compiles and executes then given source string as Tea code in the current environment, returning any result produced by the evaluated chunk.

#### Arguments
- `source`: A string containing Tea source code to compile and run

#### Returns
The value produced by the evaluated code (if any). If code raises an error, the error is propagated to the caller and can be caught with `pcall`.

#### Example
```tea
print(eval("1 + 2 * 3"))     // 7
eval("var greeting = 'hi'")
print(greeting)              // "hi"
```

---

## dump()

```tea
function dump(func, strip=false)
```

The `dump` function serializes a Tea function into bytecode, returning the compiled representation as a string. The result can later be loaded with `loadstring` to reconstruct the function.

#### Arguments
- `func`: The function to serialize. Must be a Tea function (not a C function)
- `strip`: An optional boolean (or string containing the `"s"`). When truthy, debug information is stripped from the output, producing smaller bytecode.

#### Returns
A Tea string containing the serialized bytecode.

#### Example
```tea
function greet(name)
{
    return "Hello, " + name
}

var bytecode = dump(greet)
print(typeof(bytecode))          // "string"

var reloaded = loadstring(bytecode)
print(reloaded("world"))         // "Hello, world"
```

---

## loadfile()

```tea
function loadfile(filename, mode='t')
```

The `loadfile` function loads a Tea chunk from the specified file and returns it as a callable function, without executing it.

#### Arguments
- `filename`: The path of the file to load
- `mode`: An optional string specifying the accepted input modes: `"t"` for text source, `"b"` for binary bytecode, or `"bt"` for both. Defaults to `"t"`.

#### Returns
A Tea function representing the compiled chunk. If the file cannot be read or compiled, an error is raised.

#### Example
```tea
var chunk = loadfile("script.tea")
chunk()
```

---

## loadstring()

```tea
function loadstring(source, name='?<load>')
```

The `loadstring` function compiles the given Tea source string into a callable Tea function without executing it. The optional `name` argument is used as the chunk name in error messages and stack traces.

#### Arguments
- `source`: A string containing Tea source code
- `name`: An optional module environment name. Defaults to `"?<load>"`.

#### Returns
A Tea function representing the compiled chunk. If compilation fails, an error is raised.

#### Example
```tea
var chunk = loadstring("print(6 * 7)")
print(chunk())               // 42
```

---

## pcall()

```tea
function pcall(func, ...)
```

The `pcall` function calls `func` in protected mode, catching any error that occurs during execution. This is the primary mechanism for handling runtime errors in Tea code.

#### Arguments
- `func`: The Tea function to call
- `...`: Any arguments to be passed to `func`

#### Returns
The function returns a two-element list. The first element is a boolean indicating whether the call succeeded. The second element is the function's return value on success, or the error message on failure.

#### Example
```tea
var result = pcall(function() error("something went wrong") end)
print(result[0])             // false
print(result[1])             // "something went wrong"

var ok, res = pcall(function(a, b) return a + b end, 2, 3)
print(ok, res)          // true 5
```

---

## rawequal()

```tea
function rawequal(a, b)
```

The `rawequal` function compares two Tea values for equality without invoking any special method. Unlike the `==` operator, which may call `operator ==` if defined, this performs a direct, primitive comparison.

#### Arguments
- `a`: The first (left) value to compare
- `b`: The second (right) value to compare

#### Returns
`true` if the two values are primitively equal; `false` otherwise.

#### Example
```tea
print(rawequal(1, 1))        // true
print(rawequal("a", "a"))    // true
print(rawequal([1], [1]))    // false (distinct list objects)
```

---

## hasattr()

```tea
function hasattr(obj, name)
```

The `hasattr` function checks whether the given object has an attribute with the specified name, consulting the object's attributes and any applicable method.

#### Arguments
- `obj`: The object to inspect
- `name`: A string containing the attribute name to look up

#### Returns
`true` if the attribute exists; `false` otherwise.

#### Example
```tea
var point = {x = 10, y = 20}
print(hasattr(point, "x"))       // true
print(hasattr(point, "z"))       // false
```

---

## getattr()

```tea
function getattr(obj, name)
```

The `getattr` function retrieves the value of the named attribute from the given object, honoring special methods such as getters and `getattr()`.

#### Arguments
- `obj`: The object to read from
- `name`: A string containing the attribute name to retrieve

#### Returns
The value of the attribute. If the attribute does not exist, an error is raised.

#### Example
```tea
var point = {x = 10, y = 20}
print(getattr(point, "x"))       // 10
print(getattr(point, "z"))       // error: attribute "z" not found
```

---

## setattr()

```tea
function setattr(obj, name, value)
```

The `setattr` function assigns a value to the named attribute of the given object, honoring special methods such as setters and `setattr()`.

#### Arguments
- `obj`: The object to modify
- `name`: A string containing the attribute name to set
- `value`: The value to assign

#### Returns
`nil`

#### Example
```tea
var point = {x = 10, y = 20}
setattr(point, "x", 99)
print(point.x)                   // 99

setattr(point, "z", 5)
print(point.z)                   // 5
```

---

## delattr()

```tea
function delattr(obj, name)
```

The `delattr` function removes the named attribute from the given object.

#### Arguments
- `obj`: The object from which to remove the attribute
- `name`: A string containing the attribute name to delete

#### Returns
`nil`

#### Example
```tea
var point = {x = 10, y = 20}
delattr(point, "y")
print(hasattr(point, "y"))       // false
```
