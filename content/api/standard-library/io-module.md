---
title: IO Module
number: 8.
weight: 800
---

The `io` module provides input/output functionality, including reading from and writing to files, pipes, and the standard input/output/error streams.

---

## io.stdin

```tea
io.stdin
```

The `io.stdin` file represents the standard input stream. It can be used to read input from the user.

#### Example
```tea
import io

// Read a line of input from the user
var str = io.stdin.readline()
print(str)
```

---

## io.stdout

```tea
io.stdout
```

The `io.stdout` file represents the standard output stream. It can be used to write output text to the console.

#### Example
```tea
import io

// Print a string to the console
io.stdout.write("Hello, world!")    // Hello, world!
```

---

## io.stderr

```tea
io.stderr
```

The `io.stderr` file represents the standard error stream. It can be used to write error messages to the console.

#### Example
```tea
import io

// Print an error message to the console
io.stderr.write("An error occurred!")  // An error occurred!
```

---

## io.open()

```tea
function io.open(path, mode='r')
```

The `open` function opens a file at the specified path with the given mode.

#### Arguments
- `path`: The path to the file to open.
- `mode`: An optional string specifying the mode in which to open the file. Defaults to `"r"`.

#### Example
```tea
import io

// Open a file for reading
var file = io.open("data.txt", "r")

// Open a file for writing
var output = io.open("output.txt", "w")

// Open a file for appending
var log = io.open("log.txt", "a")
```

---

## io.popen()

```tea
function io.popen(path, mode='r')
```

The `popen` function opens a pipe to a subprocess command.

#### Arguments
- `path`: The command to execute.
- `mode`: An optional string specifying the mode in which to open the pipe. Defaults to `"r"`.

#### Example
```tea
import io

// Open a pipe to read from a command
var pipe = io.popen("ls -la", "r")
var content = pipe.read()
print(content)
```

---

## File

The `File` class represents an open file handle returned by `io.open`, `io.popen`, or the standard streams:
- `io.stdout`
- `io.stdin`
- `io.stderr`

---

### File:write()

```tea
function File:write(...)
```

The `write` method writes one or more values to the file.

#### Arguments
- `...`: One or more values to write to the file.

#### Example
```tea
import io

var file = io.open("output.txt", "w")
file.write("Hello, world!\n")
file.write("Line 2\n")
file.write("Value: ", 42, "\n")
file.close()
```

---

### File:read()

```tea
function File:read(count=nil)
```

The `read` method reads data from the file. When called with no arguments, it reads the entire file content. When called with a `count` argument, it reads up to `count` bytes.

#### Arguments
- `count`: An optional number of bytes to read. If not specified, the entire file is read.

#### Example
```tea
import io

var file = io.open("data.txt", "r")

// Read the entire file
var content = file.read()
print(content)

// Read a specific number of bytes
file.seek("set", 0)
var first_10 = file.read(10)
print(first_10)

file.close()
```

---

### File:readline()

```tea
function File:readline()
```

The `readline` method reads a single line from the file.

#### Arguments
The method takes no arguments.

#### Example
```tea
import io

var file = io.open("data.txt", "r")
var line = file.readline()
while line != nil
{
    print(line)
    line = file.readline()
}
file.close()
```

---

### File:seek()

```tea
function File:seek(whence='cur', offset=0)
```

The `seek` method moves the file position indicator to a new location.

#### Arguments
- `whence`: An optional string specifying the reference point for the offset. Can be `"set"`, `"cur"`, or `"end"`. Defaults to `"cur"`.
- `offset`: An optional number specifying the number of bytes to move from the reference point. Defaults to `0`.

#### Example
```tea
import io

var file = io.open("data.txt", "r")

// Move to the beginning of the file
var pos = file.seek("set", 0)
print("Position:", pos)

// Move forward 10 bytes from current position
pos = file.seek("cur", 10)
print("Position:", pos)

// Move to 5 bytes before the end of the file
pos = file.seek("end", -5)
print("Position:", pos)

file.close()
```

---

### File:flush()

```tea
function File:flush()
```

The `flush` method flushes any buffered data to the file.

#### Arguments
The method takes no arguments.

#### Example
```tea
import io

var file = io.open("output.txt", "w")
file.write("Important data")
file.flush()  // Ensure data is written to disk immediately
```

---

### File:setvbuf()

```tea
function File:setvbuf(mode, size=8192)
```

The `setvbuf` method sets the buffering mode for the file.

#### Arguments
- `mode`: A string specifying the buffering mode. Can be `"full"`, `"line"`, or `"no"`.
- `size`: An optional number specifying the buffer size in bytes. Defaults to `8192`.

#### Example
```tea
import io

var file = io.open("output.txt", "w")

// Set line buffering
file.setvbuf("line")

// Set no buffering
file.setvbuf("no")

// Set full buffering with a custom size
file.setvbuf("full", 4096)
```

---

### File:close()

```tea
function File:close()
```

The `close` method closes the file. Standard streams cannot be closed.

#### Arguments
The method takes no arguments.

#### Example
```tea
import io

var file = io.open("data.txt", "r")
var content = file.read()
file.close()
```

---

### File:tostring()

```tea
function File:tostring()
```

The `tostring` method provides a string representation of the file object.

#### Arguments
The method takes no arguments.

#### Example
```tea
import io

var file = io.open("data.txt", "r")
print(file.tostring())  // <file>
file.close()
print(file.tostring())  // <file (closed)>
```

---

### File:iter()

```tea
function File:iter()
```

The `iter` method provides an iterator that reads lines from the file one at a time.

#### Arguments
The method takes no arguments.

#### Example
```tea
import io

var file = io.open("data.txt", "r")
for const line in file.iter()
{
    print(line)
}
file.close()
```
