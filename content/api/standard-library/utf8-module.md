---
title: UTF-8 Module
number: 14.
weight: 1400
---

The `utf8` modules provides functions to handle Unicode UTF-8 encoding, decoding, and manipulation of Teascript strings.

---

## Functions

### utf8.len()

```tea
function utf8.len(str)
```

The function `len` provides the number of UTF-8 characters in a string.

#### Arguments
- `str`: A string

#### Returns
The number of characters

#### Example
```tea
import utf8

// Basic usage
print(utf8.len("hello"))      // 5
print(utf8.len("héllo"))      // 5
print(utf8.len("こんにちは"))  // 5

// Compare with byte length
var text = "café"
print("Characters: " + utf8.len(text))  // Characters: 4

// Validate user input length
var username = "José"
if utf8.len(username) < 3
{
    print("Username too short")
}
else
{
    print("Username accepted")
}
```

---

### utf8.char()

```tea
function utf8.char(n)
```

The function `char` provides the UTF-8 string corresponding to a Unicode code point.

#### Arguments
- `n`: A Unicode code point as an integer

#### Returns
The UTF-8 encoded character

#### Example
```tea
import utf8

// Basic usage
print(utf8.char(65))       // A
print(utf8.char(233))      // é
print(utf8.char(12354))    // あ
print(utf8.char(128512))   // 😀

// Build a string from code points
var message = ""
var codes = [72, 101, 108, 108, 111]
for const c in codes
{
    message += utf8.char(c)
}
print(message)  // Hello

// Generate an emoji
print(utf8.char(0x1F600))  // 😀
```

---

### utf8.ord()

```tea
function utf8.ord(c)
```

The function `ord` provides the Unicode code point of the first character in a string.

#### Arguments
- `c`: A string containing a single UTF-8 character

#### Returns
The Unicode code point as an integer

#### Example
```tea
import utf8

// Basic usage
print(utf8.ord("A"))     // 65
print(utf8.ord("é"))     // 233
print(utf8.ord("あ"))    // 12354
print(utf8.ord("😀"))    // 128512

// Round-trip conversion
var original = "ñ"
var code = utf8.ord(original)
print(utf8.char(code))   // ñ

// Inspect the first character of a string
var word = "tea"
print("First code point: " + utf8.ord(word))  // First code point: 116
```

---

### utf8.reverse()

```tea
function utf8.reverse(str)
```

The function `reverse` provides a string with its UTF-8 characters in reverse order.

#### Arguments
- `str`: A string

#### Returns
The reversed string

#### Example
```tea
import utf8

// Basic usage
print(utf8.reverse("hello"))      // olleh
print(utf8.reverse("abc"))        // cba

// Works correctly with multibyte characters
print(utf8.reverse("café"))       // éfac
print(utf8.reverse("こんにちは"))  // はちにんこ

// Reverse an emoji string
print(utf8.reverse("😀😁😂"))      // 😂😁😀

// Practical example: check for palindromes
var word = "level"
if word == utf8.reverse(word)
{
    print(word + " is a palindrome")
}
else
{
    print(word + " is not a palindrome")
}
```

---

### utf8.iter()

```tea
function utf8.iter(str)
```

The function `iter` provides an iterator over the UTF-8 characters of a string.

#### Arguments
- `str`: A string

#### Returns
An iterator function

#### Example
```tea
import utf8

// Basic usage
for const c in utf8.iter("hello")
{
    print(c)
}
// h
// e
// l
// l
// o

// Iterate over multibyte characters
for const c in utf8.iter("café")
{
    print(c + " -> " + utf8.ord(c))
}
// c -> 99
// a -> 97
// f -> 102
// é -> 233

// Count characters manually
var count = 0
for const c in utf8.iter("こんにちは")
{
    count += 1
}
print("Character count:", count)  // 5

// Process each character with its index
var index = 0
for const c in utf8.iter("tea")
{
    print("[" + index + "] " + c)
    index += 1
}
```
