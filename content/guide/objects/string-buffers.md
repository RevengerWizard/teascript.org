---
title: String Buffers
number: 7.
weight: 2200
---

Strings in Teascript are _immutable_. Once a string has been created, it will never change. Every operation that appears to modify one actually produces a brand new string. That is usually what you want, however it becomes wasteful once you attempt to build a large piece of text out of many small parts. Each step allocates a new string and copies everything accumulated so far.

To solve this issue, a **string buffer** has been introduced into the language. It is effectively a growable block of memory you can append to, and which you can turn into a regular string only once you are finished appending to it. Buffers are provided by the built-in `Buffer` class.

## Creating Buffers

You can create a new buffer by calling `Buffer.new`, just like any other class:

```tea
var buf = Buffer.new()
```

A new buffer once created is empty. Its `len` property tells you how many bytes or characters it currently holds:

```console
> var buf = Buffer.new()
> print(buf.len)
0
```

### Pre-allocating

If you already know roughly how much space you're going to need to build you final text, you can an initial size in bytes:

```tea
var buf = Buffer.new(4096)
```

This internally only reserves the memory up front, so the buffer doesn't need to grow while you fill it. If you try checking it, the buffer is actually still empty (`buf.len` is `0`), and it will grow past its original defined size once it has been surpassed. The size must be a non-negative integer.

And like any other value in Teascript, buffers are managed for you, meaning they're reclaimed once the buffer is no longer used.

## Creating Buffers

Create a buffer by calling `Buffer`, like any other class:

```tea
var buf = Buffer()
```

A new buffer is empty. Its `len` property tells you how many bytes it currently holds:

```console
> print(buf.len)
0
```

If you know roughly how much text you are going to produce, you can pass an initial size in bytes. The buffer still starts empty, but it won't need to grow as you fill it:

```tea
var buf = Buffer(4096)
```

Like every other value, buffers are managed for you: there is nothing to close or free.

## Reading and Writing

A buffer has two ends. You write at the back, and you consume from the front.

### Appending

The `put` method appends one or more values to the end of the buffer. Strings and numbers can be used directly:

```console
> var buf = Buffer()
> buf.put("x = ", 42, ", y = ", 0.5)
> print(buf.tostring())
x = 42, y = 0.5
```

For more control over the layout of a value, `format` takes a format string, like the string `format` method, and appends the result.

Both methods return the buffer itself, so calls can be chained:

```tea
var s = Buffer().put("a", 1).put("b", 2).tostring()
```

### Reading

To get the content out as a string, call `tostring`. This does not consume anything: the buffer keeps its content and you can continue appending to it.

### Consuming

The `skip` method discards bytes from the front of the buffer, and `reset` empties it completely so it can be reused:

```console
> var buf = Buffer()
> buf.put("Hello, World")
> buf.skip(7)
> print(buf.tostring())
World
> buf.reset()
> print(buf.len)
0
```

Together, `put` at the back and `skip` at the front make a buffer behave like a queue of bytes, which is handy for data that arrives in pieces.

The exact rules for each method are covered in the [String Buffer reference](TODO-BUFFER-REFERENCE).

## Common Patterns

### Building Text in a Loop

This is the situation buffers are made for. Instead of growing a string one piece at a time, append to a buffer and convert once at the end:

```tea
var buf = Buffer.new()
var i = 1

while i <= 5
{
    buf.put(i, " ")
    i += 1
}

print(buf.tostring())
```

```console
$ tea numbers.tea
1 2 3 4 5 
```

### Reusing a Buffer

If you produce many strings in a row, keep a single buffer and `reset` it between uses:

```tea
var buf = Buffer.new(256)

function render(item)
{
    buf.reset()
    buf.put("<", item, ">")
    return buf.tostring()
}
```

### Consuming as You Go

When data arrives in chunks, keep a buffer as the pending input. Append each new chunk, process what you can, then `skip` what you handled:

```tea
pending.put(chunk)

var text = pending.tostring()
// ... handle the first `used` bytes of text ...
pending.skip(used)
```

### Using Custom Types

A class with a `tostring` method can be passed straight to `put`. See [Special Methods](TODO-SPECIAL-METHODS).

You do not need a buffer for everything: joining two or three strings is fine as it is. Reach for one when you are building text incrementally, or consuming data in chunks.

## When to Use a Buffer

You do not need a buffer for everything. Joining two or three strings together is perfectly fine when working with relatively short strings. Reach for a buffer when you are producing text *incrementally*, in a loop or from many pieces, or when you are handling data that arrives in chunks and needs to be consumed from the front.