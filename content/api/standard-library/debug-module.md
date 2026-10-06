---
title: Debug Module
number: 13.
weight: 1300
---

The `debug` module provides access to internal Teascript scaffolding structures or informations, like line information and raw bytecode data. This information can be used to implement tools for inspecting aspects of Teascript's inner workings.

---

## Functions

### debug.funcinfo()

```tea
function debug.funcinfo(proto, pc)
```

The function `funcinfo` provides information about a function prototype.

#### Arguments
- `proto`: The function prototype to inspect
- `pc`: An optional bytecode position (default: 0)

#### Example
```tea
import debug

// Inspect a function's prototype
var info = debug.funcinfo(my_function)
print("Function name:", info.name)
print("Defined from line:", info.linedefined)
print("Defined to line:", info.lastlinedefined)
print("Number of parameters:", info.params)
print("Number of optional parameters:", info.optparams)
print("Number of constants:", info.kconsts)
print("Number of upvalues:", info.upvalues)
print("Number of bytecodes:", info.bytecodes)
print("Stack slots:", info.stackslots)
print("Is vararg:", info.isvararg)
print("Has children:", info.children)

// Inspect at a specific bytecode position
var info = debug.funcinfo(my_function, 5)
print("Current line at pc 5:", info.currentline)
```

---

### debug.funck()

```tea
function debug.funck(proto, index)
```

The function `funck` retrieves a constant from a function prototype's constant table.

#### Arguments
- `proto`: The function prototype to inspect
- `index`: The index of the constant to retrieve

#### Example
```tea
import debug

// Get the first constant
var constant = debug.funck(my_function, 0)
print("Constant at index 0:", constant)

// Get a string constant
var name = debug.funck(my_function, 1)
print("Constant at index 1:", name)

// Iterate through all constants
var info = debug.funcinfo(my_function)
for const i in 0..info.kconsts
{
    var k = debug.funck(my_function, i)
    print("Constant " + i + ": " + tostring(k))
}
```

---

### debug.funcbc()

```tea
function debug.funcbc(proto, index)
```

The function `funcbc` retrieves a bytecode instruction from a function prototype.

#### Arguments
- `proto`: The function prototype to inspect
- `index`: The index of the bytecode instruction to retrieve

#### Example
```tea
import debug

// Get the first bytecode instruction
var bc = debug.funcbc(my_function, 0)
print("First bytecode:", bc)

// Inspect all bytecode instructions
var info = debug.funcinfo(my_function)
for const i in 0..info.bytecodes
{
    var bc = debug.funcbc(my_function, i)
    print("Bytecode " + i + ": " + bc)
}
```

---

### debug.funcuv()

```tea
function debug.funcuv(proto, index)
```

The function `funcuv` retrieves information about an upvalue from a function prototype.

#### Arguments
- `proto`: The function prototype to inspect
- `index`: The index of the upvalue to retrieve

#### Example
```tea
import debug

// Get the first upvalue
var uv = debug.funcuv(my_function, 0)
print("Upvalue at index 0:", uv)

// Inspect all upvalues
var info = debug.funcinfo(my_function)
for const i in 0..info.upvalues
{
    var uv = debug.funcuv(my_function, i)
    print("Upvalue " + i + ": " + uv)
}
```

---

### debug.funcline()

```tea
function debug.funcline(proto, offset)
```

The function `funcline` provides the source line number corresponding to a bytecode offset in a function prototype.

#### Arguments
- `proto`: The function prototype to inspect
- `offset`: The bytecode offset

#### Example
```tea
import debug

// Get the line number for a specific bytecode offset
var line = debug.funcline(my_function, 0)
print("Line at offset 0:", line)

// Map bytecode offsets to source lines
var info = debug.funcinfo(my_function)
for const i in 0..info.bytecodes
{
    var line = debug.funcline(my_function, i)
    print("Bytecode " + i + " is at line " + line)
}
```
