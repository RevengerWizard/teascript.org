---
title: String Methods
number: 3.
weight: 300
---

The `String` type represents a sequence of byte characters.

---

## Attributes

### String:len

The attribute `len` allows to receive the byte length of a Tea string.

#### Example
```tea
const s = "Hello, world!"
print(s.len)  // 13

print("Exploding Kittens!".len) // 19
```

---

## Methods

### String:upper()

```tea
function String:upper()
```

The `upper` method produces a new Tea string copy of the original string with all its characters uppercase.

#### Arguments
The method takes no arguments.

#### Example
```tea
var str = "Hello, world!"
str = my_string.upper()
print(str)  // "HELLO, WORLD!"
```

---

### String:lower()

```tea
function String:lower()
```

The `lower` method produces a new Tea string copy of the original string with all its characters lowercase.

#### Arguments
The method takes no arguments.

#### Example
```tea
var str = "Hello, world!"
str = my_string.lower()
print(str)  // "hello, world!"
```

---

### String:reverse()

```tea
function String:reverse()
```

The `reverse` method produces a new Tea string copy of the original string with its characters reversed in order.

#### Arguments
The method takes no arguments.

#### Example
```tea
const str = "Hello, world!"
str = str.reverse()
print(str)  // "!dlrow ,olleH"
```

---

### String:split()

```tea
function String:split(separator='', maxsplit=nil)
```

The `split` method 

#### Arguments
- `separator`: A string that specified the character(s) to use as the separator. If `separator` is not specified, the string is split on any white space `" "`.
- `maxsplit`: An optional number that specified the maximum number of splits allowed to perform. If `maxsplit` is not specified, the string is split into as many sub-strings as possible.

#### Returns
The method returns a list of string created by splitting the original string at each occurrence of the specified `separator` value, `maxsplit` times.

#### Example
```tea
var str = "Hello, world! How are you today?"
str = str.split()
print(my_list)  // ["Hello,", "world!", "How", "are", "you", "today?"]
```

---

### String:contains()

```tea
function String:contains(substr)
```

The `contains` method checks whether the specified string is found within the original string.

#### Arguments
- `substring`: The string to search for within the original string.

#### Returns
The method returns `true` if the `substring` is found within the original string, or `false` otherwise.

#### Example
```tea
var str = "Hello, world!"
var result = str.contains("world")
print(result)  // true

result = str.contains("foo")
print(result)  // false
```

---

### String:startswith()

```tea
function String:startswith(prefix)
```

The `startswith` method checks whether the original string starts with a specified string sequence.

#### Arguments
- `prefix`: The string to search for at the start of the original string.

#### Returns
The method returns `true` if the original string starts with `prefix`, and `false` otherwise.

#### Example
```tea
var str = "Hello, world!"
var res = str.startswith("Hello")
print(result)  // true

res = str.startswith("foo")
print(result)  // false
```

---

### String:endswith()

```tea
function String:endswith(suffix)
```

The `endswith` method checks whether the original string ends with a specified string sequence.

#### Arguments
- `suffix`: The string to search for at the end of the original string.

#### Returns
The method returns `true` if the original string ends with `suffix`, and `false` otherwise.

#### Example
```tea
var str = "Hello, world!"
var res = str.endswith("world!")
print(res)  // true

res = str.endswith("foo")
print(res)  // false
```

---

### String:leftstrip()

```tea
function String:leftstrip()
```

The `leftstrip` strips the original string of any leading white spaces.

#### Arguments
The method takes no arguments.

#### Returns
The method returns a copy of the original string with leading white space removed.

#### Example
```tea
var str = "   Hello, world!"
str = str.leftstrip()
print(str)  // "Hello, world!"
```

---

### String:rightstrip()

```tea
function String:rightstrip()
```

The `rightstrip` method strips the original string of any trailing white spaces.

#### Arguments
The method takes no arguments.

#### Returns
The method returns a copy of the original string with all trailing white spaces removed.

#### Example
```tea
var str = "Hello, world!   "
str = str.rightstrip()
print(str)  // "Hello, world!"
```

---

### String:strip()

```tea
function String:strip()
```

The `strip` method strips the original string of any leading and trailing white spaces.

#### Arguments
The method takes no arguments.

#### Returns
The method returns a copy of the original string with all its trailing and leading white spaces removed.

#### Example
```tea
var str = "   Hello, world!   "
str = my_string.strip()
print(str)  // "Hello, world!"
```

---

### String:count()

```tea
function String:count(substr)
```

The `count` method counts the number of occurrences of a specified string string within the original string.

#### Arguments
- `substr`: The string to search for within the original string.

#### Returns
The method returns the number of occurrences of `substr` within the original string.

#### Example
```tea
var str = "Hello, world! Hello, world!"
var res = str.count("Hello")
print(res)  // 2
res = str.count("foo")
print(res)  // 0
```

---

### String:find()

```tea
function String:find(substr)
```

The `find` method finds the index of the first occurrence of a specified string within the original string.

#### Arguments
- `substr`: The string to search for within the original string.

#### Returns
The method returns the index of the first occurrence of `substr` within the original string, or `-1` if the string if not found.

#### Example
```tea
var str = "Hello, world!"
var res = str.find("world")
print(res)  // 7
res = str.find("foo")
print(res)  // -1
```

---

### String:replace()

```tea
function String:replace(oldstring, newstring)
```

The `replace` method replaces all occurrences found of a specified string from the original string with a different string sequence.

#### Arguments
- `oldstring`: The old string occurrence present within the original string.
- `newstring`: The string to replace `oldstring` with in the new string.

#### Returns
The method returns a copy of the original string with all occurrences of `oldstring` replaced with `newstring`. If no occurrences have been found, the returned string is exactly the same original string value.

#### Example
```tea
var str = "Hello, world!"
str = str.replace("world", "foo")
print(str)  // "Hello, foo!"
```
