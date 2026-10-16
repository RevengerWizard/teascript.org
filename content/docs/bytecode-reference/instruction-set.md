---
title: Instruction Set
number: "3."
weight: 1400
---

Teascript executes programs on a stack based virtual machine. Source code is compiled, one function at a time, into a _prototype_ (`GCproto`) that holds a flat array of bytecode, a constant table and a list of upvalues descriptors. This chapter documents every instruction the VM understand: how it is encoded, what it leaves behind, and when it raises a runtime error.

The chapter is organised as follows:

- **Instruction Encoding** describes the binary layout of instructions.
- **Operand Types and Notation** defines the notation used in the reference entries.
- **Instruction Reference** documents each instruction, grouped by purpose, with an example.
Opcodes are defined in `tea_bc.h` and executed in `vm_execute` in `tea_vm.c`. The opcode numbers are assigned in the order in which the instructions appear in the `BCDEF` table, so **the order of that table is part of the bytecode format**.

## Instruction Encoding

Bytecode is an array of bytes (`BCIns` is `uint8_t`). Every instruction is a single **opcode byte** followed by zero or more _operand types_. Instructions have a fixed length that depends only on the opcode, so a function's bytecode can be walked linearly without decoding operand values.

```
+------------+------------+------------+------------+
|   opcode   |  operand0  |  operand1  |  operand2  |
+------------+------------+------------+------------+
    1 byte    0 to 3 operand bytes (opcode dependent)
```

Instruction lengths range from 1 to 4 bytes:

| Length | Layout | Used By |
| --- | --- | --- |
| 1 byte | `op` | Instructions with no operands (`POP`, `ADD`, `RETURN`, ...) |
| 2 bytes | `op A` | One 8-bit operand: slot, constant index, count |
| 3 bytes | `op A B` or `op J` | Two 8-bit operands, or one 16-bit jump offset |
| 4 bytes | `op J A` | `SPREAD` only: 16-bit offset plus an 8-bit count |

Notes on encoding:
- **8-bit operands** are unsigned (0 to 255). This bounds the number of locals, upvalues, module variables and constants addressable by a single instruction, and the number of call arguments, to 256 each.
- **16-bit operands** are stored
- **Jumps are relative and unsigned**. The offset is applied to the instruction pointer _after_ the whole instruction has been read. `JMP`, `JMPFALSE`, `JMPNIL`, `JMPCMP` add the offset (forward jump); `LOOP` subtracts it (backward jump). The target of a jump at offset `ofs` is therefore `ofs + 3 + offset` for forward jumps and `ofs + 3 - offset` for `LOOP`.
- **Constants are referenced by index** into the prototype's constant table. Constants hold numbers, strings and nested function prototypes. Operands that name an identifier (attributes, methods, globals, classes) always point to a string constant.
- **Upvalue descriptors are not part of the instruction stream**. `CLOSURE` takes only a constant index; the capture list lives in the child prototype's `uv` array as 16-bit entries, where the low 8 bits are an index and the flag `0x0100` (`PROTO_UV_LOCAL`) means "capture an enclosing local slot" (otherwise, "capture an enclosing upvalue").

### Stack Frames

Each call has a frame whose `base` points at the **callee slot**. The callee (or the receiver, for method calls) lives at slot `0`, the arguments occupy slots `1..n`, and further locals and temporaries follow. Consequently, the first declared parameter is local slot `1`. `GETLOCAL`/`SETLOCAL` operands are offsets from `base`.

### Call States and Re-entry

Calls to Teascript functions from `CALL`, `INVOKE`, `NEW` and `SUPER` do not recurse in C; the VM pushes a new `CallInfo` and continues the dispatch loop. Calls made by the VM on behalf of an instruction (operator overloads `iter`, `contains`, attribute getters) re-enter `vm_execute` through `tea_vm_call`. This distinction is invisible at the bytecode level, but it explains why those instructions treat the call result as their result.

## Operand Types and Notation

### Operand Types

| Notation | Size | Meaning |
| --- | --- | --- |
| `S` | 8 bits | **Slot**: index of a local variable (relative to `base`), an upvalue, or a module variable, depending on the instruction |
| `K` | 8 bits | **Constant**: index into the current prototype's constant table. `K[x]` denotes the constant itself. `K[x]:str` means it must be a string, `K[x]:proto` a function prototype |
| `N` | 8 bits | **Count**: number of arguments, variables, or values |
| `F` | 8 bits | **Flags**: bit set, see **Method flags** below |
| `J` | 16 bits | **Jump**: unsigned offset, relative to the end of the instruction |

### Method Flags

`METHOD` carries a flag byte built from these bits:

| Value | Name | Meaning |
| --- | --- | --- |
| `0x1` | `ACC_STATIC` | Static method |
| `0x2` | `ACC_GET` | Getter |
| `0x4` | `ACC_SET` | Setter |

### Stack Notation

Each entry has a **Stack** line describing the effect of the instruction. The stack grows to the right and `...` stands for the untouched part of the stack:

```
Stack: ..., a, b -> ..., r
```

reads "`b` is on top of the stack, with `a` below it: both are removed and the result `r` is pushed". Stack names used throughout:

| Name | Meaning |
| --- | --- |
| `a`, `b`, `v`, `x` | Arbitrary values |
| `obj`, `idx`, `item` | Object, index/key, and value being stored |
| `arg1 ... argN` | Call arguments |
| `callee` | A callable value (function, bound method, class, instance with `call`) |
| `L[S]`, `M[S]`, `U[S]` | Local, module-variable and upvalue number `S` |
| `G[name]`, `E[name]` | Global, and current module export, named `name` |

### Syntax Lines

The syntax block of each entry shows the mnemonic followed by its operands in order, e.g. `INVOKE K, N`. In bytecode listings (as produced by `tea -bc`) each instruction is printed on its own line as `offset line mnemonic operands`, where a repeated source line is shown as `|`, and constant operands are followed by the constant's value:

```
0000    1 CONSTANT          0 10
0002    | SETLOCAL            1
```

### Stack Effect Table

| Instruction | Operands | Bytes | Net Stack Effect |
| --- | --- | --- | --- |
| `GETLOCAL` | `S` | 2 | +1 |
| `SETLOCAL` | `S` | 2 | 0 |
| `CONSTANT` | `K` | 2 | +1 |
| `POP` | | 1 | -1 |
| `KNIL` / `KTRUE` / `KFALSE` | | 1 | +1 |
| `CALL` | `N` | 2 | -N |
| `INVOKE` | `K N` | 3 | -N |
| `NEW` | `N` | 2 | -N |
| `SUPER` | `K N` | 3 | -(N + 1) |
| `RETURN` | | 1 | frame exit |
| `ADD` `SUB` `MUL` `DIV` `MOD` `POW` | | 1 | -1 |
| `NEG` `NOT` `BNOT` | | 1 | 0 |
| `ISEQ` `ISLT` `ISLE` `ISGT` `ISGE` `IS` `IN` | | 1 | -1 |
| `BAND` `BOR` `BXOR` `LSHIFT` `RSHIFT` | | 1 | -1 |
| `JMP` / `LOOP` | `J` | 3 | 0 |
| `JMPFALSE` | `J` | 3 | 0 |
| `JMPNIL` | `J` | 3 | -1 if jumped, else 0 |
| `JMPCMP` | `J` | 3 | -1 (match: -2) |
| `LIST` / `MAP` | | 1 | +1 |
| `LISTITEM` | | 1 | -1 |
| `MAPFIELD` | | 1 | -2 |
| `RANGE` | | 1 | -2 |
| `UNPACK` | `N` | 2 | +(len-1) |
| `UNPACKREST` | `N S` | 3 | +(N-1) |
| `LISTEXTEND` | | 1 | -1 |
| `SPREAD` | `J N` | 4 | +(len-1) |
| `GETATTR` | `K` | 2 | 0 |
| `PUSHATTR` | `K` | 2 | +1 |
| `SETATTR` | `K` | 2 | -1 |
| `GETIDX` | | 1 | -1 |
| `PUSHIDX` | | 1 | +1 |
| `SETIDX` | | 1 | -2 |
| `GETSUPER` | `K` | 2 | -1 |
| `GETGLOBAL` | `K` | 2 | +1 |
| `GETMODULE` | `K` | 2 | +1 |
| `SETMODULE` | `S` | 2 | 0 |
| `DEFMODULE` | `K` | 2 | 0 |
| `CLOSURE` | `K` | 2 | +1 |
| `CLOSEUPVAL` | | 1 | -1 |
| `GETUPVAL` | `S` | 2 | +1 |
| `SETUPVAL` | `S` | 2 | 0 |
| `GETITER` | `S` | 2 | +1 |
| `FORITER` | `S` | 2 | +1 |
| `CLASS` | `K` | 2 | +1 |
| `METHOD` | `K F` | 3 | -1 |
| `INHERIT` | | 1 | -1 |
| `ISTYPE` | | 1 | 0 |
| `IMPORTNAME` | `K` | 2 | 0 |
| `IMPORTSTR` | `K` | 2 | 0 |
| `IMPORTFMT` | | 1 | -1 |
| `IMPORTALIAS` | | 1 | +1 |
| `IMPORTVAR` | `K` | 2 | +1 |
| `IMPORTEND` | | 1 | 0 |
| `DEFOPT` | `N N` | 3 | see entry |
| `MULTICASE` | `N` | 2 | see entry |
| `END` | | 1 | 0 |

The effects above reflect what the VM actually does. The "stack effect" column of the `BCDEF` table in `tea_bc.h` is a compiler-side estimate and differs from the runtime behavior for a few instructions.

## Instruction Reference

Unless stated otherwise, operand values are taken from the instruction stream and the instruction pointer advances past the whole instruction. Where an instruction can fail, the error is raised as a normal Teascript runtime error.

---

### Stack Operations

### GET_LOCAL

```
GETLOCAL S
```

Pushes a copy of local slot `S` onto the stack. Slot `0` is the callee/receiver slot, so the first parameter is slot `1`.

<!--- 
Stack: `... -> ..., L[S]`
-->

{{< stack before="..." after="...,L[S]" >}}

#### Example

```
// function add(a, b) { return a + b }
0000    1 GETLOCAL           1      ; a
0002    | GETLOCAL           2      ; b
0004    | ADD
0005    | RETURN
```

### SETLOCAL

```
SETLOCAL S
```

Copies the value on top of the stack into local slot `S`. The value is **not** popped, so an assignment can be used as an expression. A following `POP` discards it when the assignment is used as a statement.

<!---
Stack: `..., v -> ..., v` (and `L[S] = v`)
-->

{{< stack before="...,v" after="...,v" >}}

#### Example

```
// x = 5
0000    1 CONSTANT           0 5
0002    | SETLOCAL           1
0004    | POP
```

### CONSTANT

```
CONSTANT K
```

Pushes constant `K` from the constant table (a number, string, or other literal) onto the stack.

<!---
Stack: `... -> ..., K[K]`
-->

{{< stack before="..." after="...,K[K]" >}}

#### Example

```
0000    1 CONSTANT           0 "hello"
```

### POP

```
POP
```

Discards the top of the stack.

<!---
Stack: `..., v -> ...`
-->

{{< stack before="...,v" after="..." >}}

#### Example

```
// f()   (result unused)
0000    1 GETGLOBAL          0 f
0002    | CALL               0
0004    | POP
```

---

### Constant Operations

### KNIL

```
KNIL
```

Pushes `nil`.

<!---
Stack: `... -> ..., nil`
-->

{{< stack before="..." after="...,nil" >}}

#### Example

```
0000    1 KNIL
```

### KTRUE

```
KTRUE
```

Pushes `true`.

<!---
Stack: `... -> ..., true`
-->

{{< stack before="..." after="...,true" >}}

#### Example

```
0000    1 KTRUE
```

### KFALSE

```
KFALSE
```

Pushes `false`.

<!---
Stack: `... -> ..., false`
-->

{{< stack before="..." after="...,false" >}}

#### Example

```
0000    1 KFALSE
```

---

### Function Calls

### CALL

```
CALL N
```

Calls the value `N` slots below the top of the stack, passing `N` values above its arguments. Callable values are functions (Tea or C), bound methods (the receiver replaces the callee slot), and instances/userdata that define the `call` special method. For a Tea function a new frame is pushed and execution continues in it; for a C function the call completes immediately. Either way the callee and its arguments are replaced by the single return value once the call finishes.

Argument-count checking happens here: too few or too many arguments raises an error, except that missing variadic parameters become an empty list, surplus arguments are packed into the variadic list, and optional parameters are filled in by `DEFOPT`.

<!--
Stack: `..., callee, arg1, ..., argN -> ..., result`
-->

{{< stack before="...,callee,arg1,...,argN" after="...,result" >}}

Errors: the value is not callable; wrong number of arguments.

#### Example

```
// print("hi")
0000    1 GETGLOBAL          0 print
0002    | CONSTANT           1 "hi"
0004    | CALL               1
```

### INVOKE

```
INVOKE K N
```

Optimised `obj.name(args)` call. `K` selects the method/function name (string constant) and `N` the argument count. The receiver sits `N` slots below the top and is looked up as follows:

- **class**: `name` must be a static method
- **module**: `name` is looked up in the module's exports
- **instance / userdata**: an attribute named `name` is tried first, then a method of its class (getter methods are evaluated first and their result is called), then the `getter` special method
- **any other value**: methods of the built-in class for that type (string, list, map, ...)

The receiver slot is passed to the method as slot `0` (`self`). The result replaces the receiver and arguments.

<!--
Stack: `..., obj, arg1, ..., argN -> ..., result`
-->

{{< stack before="...,obj,arg1,...,argN" after="...,result" >}}

Errors: no such method/export; the resolved value is not callable.

#### Example

```
// items.add(7)
0000    1 GETLOCAL           1      ; items
0002    | CONSTANT           0 7
0004    | INVOKE             1 add 1
```

### NEW

```
NEW N
```

Instantiates the class that is `N` slots below the top of the stack and runs its constructor (`new` method) with the `N` arguments above it. If the constructor is a Tea function, a fresh instance replaces the class on the stack and becomes the constructor's `self`. If the constructor is native, the class itself is left in that slot and the C function is responsible for building the object. The result of the call replaces the class and arguments.

<!--
Stack: `..., cls, arg1, ..., argN -> ..., instance`
-->

{{< stack before="...,cls,arg1,...,argN" after="...,instance" >}}

Errors: the value is not a class; the class has no constructor.

#### Example

```
// Point.new(1, 2)
0000    1 GETGLOBAL          0 Point
0002    | CONSTANT           1 1
0004    | CONSTANT           2 2
0006    | NEW                2
```

### SUPER

```
SUPER K N
```

Calls the method named by string constant `K` as defined on a superclass, bypassing normal lookup. The superclass is on top of the stack (above the arguments) and is consumed. Below the arguments is the receiver, which is passed as `self`. Used for `super.method(args)`.

<!---
Stack: `..., self, arg1, ..., argN, super -> ..., result`
-->

{{< stack before="...,self,arg1,...,argN,super" after="...,result" >}}

Errors: the superclass has no such method.

#### Example

```
// inside a method: super.speak(1)
0000    1 GETLOCAL           0      ; self
0002    | CONSTANT           0 1
0004    | GETUPVAL           0      ; super (captured)
0006    | SUPER              1 speak 1
```

### RETURN

```
RETURN
```

Pops the return value, closes every upvalue that still points into the current frame, discards the frame (including the callee slot, arguments and locals) and pushes the return value for the caller. If the frame was entered from native code (`tea_call`) the interpreter loop exits; otherwise execution continues in the calling function. Functions without an explicit result return `nil`, which the compiler pushes with `KNIL` before `RETURN`.

Stack: `..., result -> (frame discarded) -> caller: ..., result`

{{< stack before="...,result" after="...,result" >}}

#### Example

```
// return 1
0000    1 CONSTANT           0 1
0002    | RETURN
```

---

### Arithmetic Operations

Binary arithmetic operates on two numbers on the top of the stack and replaces them with the result. If either operand is not a number, the VM looks for the corresponding operator meta-method, first on the left operand, then on the right; the meta-method receives both operands and its return value is the result. If no meta-method is found, an operand type error is raised.

| Instruction | Operation | Meta-method |
| --- | --- | --- |
| `ADD` | `a + b` | `MM_PLUS` |
| `SUB` | `a - b` | `MM_MINUS` |
| `MUL` | `a * b` | `MM_MULT` |
| `DIV` | `a / b` | `MM_DIV` |
| `MOD` | `fmod(a b)` | `MM_MOD` |
| `POW` | `pow(a, b)` | `MM_POW` |

### ADD

```
ADD
```

Numeric addition (`a + b`), or the `+` operator overload.

<!---
Stack: `..., a, b -> ..., a + b`
-->

{{< stack before="...,a,b" after="...,a + b" >}}

Errors: operand types not supported by `+`.

#### Example

```
// 1 + 2
0000    1 CONSTANT           0 1
0002    | CONSTANT           1 2
0004    | ADD
```

### SUB

```
SUB
```

Numeric subtraction (`a - b`), or the `-` operator overload.

<!---
Stack: `..., a, b -> ..., a - b`
-->

{{< stack before="...,a,b" after="...,a - b" >}}

#### Example

```
// 5 - 3
0000    1 CONSTANT           0 5
0002    | CONSTANT           1 3
0004    | SUB
```

### MUL

```
MUL
```

Numeric multiplication (`a * b`), or the `*` operator overload.

<!---
Stack: `..., a, b -> ..., a * b`
-->

{{< stack before="...,a,b" after="...,a * b" >}}

#### Example

```
// 4 * 3
0000    1 CONSTANT           0 4
0002    | CONSTANT           1 3
0004    | MUL
```

### DIV

```
DIV
```

Numeric division (`a / b`), or the `/` operator overload. Numbers are IEEE-754 doubles, so divion by zero follows floating point rules and does not raise an error.

<!--
Stack: `..., a, b -> ..., a / b`
-->

{{< stack before="...,a,b" after="...,a / b" >}}

#### Example

```
// 8 / 2
0000    1 CONSTANT           0 8
0002    | CONSTANT           1 2
0004    | DIV
```

### MOD

```
MOD
```

Floating point remainder (`fmod(a, b)`), or the `%` operator overload.

<!---
Stack: `..., a, b -> ..., a % b`
-->

{{< stack before="...,a,b" after="...,a % b" >}}

#### Example

```
// 7 % 3
0000    1 CONSTANT           0 7
0002    | CONSTANT           1 3
0004    | MOD
```

### POW

```
POW
```

Exponentiation (`pow(a, b)`), or the `**` operator overload.

<!---
Stack: `..., a, b -> ..., a ** b`
-->

{{< stack before="...,a,b" after="...,a ** b" >}}

#### Example

```
// 2 ** 8
0000    1 CONSTANT           0 2
0002    | CONSTANT           1 8
0004    | POW
```

### NEG

```
NEG
```

Arithmetic negation of the top value. For non-numbers the unary minus overloads (`MM_MINUS`) is called with the operand and `nil` as its two arguments.

<!---
Stack: `..., a -> ..., -a`
-->
{{< stack before="...,a,b" after="...,-a" >}}

Errors: operand type not supported by unary `-`.

#### Example

```
// -x
0000    1 GETLOCAL           1
0002    | NEG
```

---

### Comparison Operations

### ISEQ

```
ISEQ
```

Equality test. When either operand is an instance or userdata, the `==` operator overload is used if defined; otherwise (and for every other type) structural equality as defined is used. Never raises a type error.

<!---
Stack: `..., a, b -> ..., (a == b)`
-->

{{< stack before="...,a,b" after="...,(a == b)" >}}

#### Example

```
// a == b
0000    1 GETLOCAL           1
0002    | GETLOCAL           2
0004    | ISEQ
```

### ISLT

```
ISLT
```

Less-than test (`a < b`). Numbers compare directly; otherwise the `<` overload is called.

<!---
Stack: `..., a, b -> ..., (a < b)`
-->

{{< stack before="...,a,b" after="...,(a < b)" >}}

Errors: operand types not supported by `<`.

#### Example

```
// a < b
0000    1 GETLOCAL           1
0002    | GETLOCAL           2
0004    | ISLT
```

### ISLE

```
ISLE
```

Less-or-equal test (`a <= b`), or the `<=` overload.

<!---
Stack: `..., a, b -> ..., (a <= b)`
-->

{{< stack before="...,a,b" after="...,(a <= b)" >}}

#### Example

```
// a <= b
0000    1 GETLOCAL           1
0002    | GETLOCAL           2
0004    | ISLE
```

### ISGT

```
ISGT
```

Greater-than test (`a > b`), or the `>` overload.

<!---
Stack: `..., a, b -> ..., (a > b)`
-->

{{< stack before="...,a,b" after="...,(a > b)" >}}

#### Example

```
// a > b
0000    1 GETLOCAL           1
0002    | GETLOCAL           2
0004    | ISGT
```

### ISGE

```
ISGE
```

Greater-or-equal test (`a >= b`), or the `>=` overload.

<!---
Stack: `..., a, b -> ..., (a >= b)`
-->

{{< stack before="...,a,b" after="...,(a >= b)" >}}

#### Example

```
// a >= b
0000    1 GETLOCAL           1
0002    | GETLOCAL           2
0004    | ISGE
```

---

### Control Flow

### JMP

```
JMP J
```

Unconditional forward jump: `ip += J`, where `ip` already points past the instruction.

Stack: unchanged

#### Example

```
// skip over the else-branch
0010    5 JMP                  10 -> 23    // 10 + 3 + 10
```

### JMPFALSE

```
JMPFALSE J
```

Jumps forward by `J` if the top of the stack is _falsey_. The value is **not** popped, in either case. The compiler emits an explicit `POP` on both the fall-through and the jump path, and relies on the retained value to implement short-circuit `and/or` expressions.

<!---
Stack: `..., v -> ..., v`
-->

{{< stack before="...,v" after="...,v" >}}

#### Example

```
// if x { y = 1 }
0000    1 GETLOCAL           1        // x
0002    | JMPFALSE           9 -> 14 ; 2 + 3 + 9
0005    | POP                         // condition true: discard it
0006    | CONSTANT           0 1
0008    | SETLOCAL           2        // y = 1
0010    | POP
0011    | JMP                1 -> 15  // skip the false-path cleanup
0014    | POP                         // condition false: discard it
0015    | ...
```

The `JMPFALSE` at offset 2 lands on the cleanup `POP` at offset 14; the true path skips it with the `JMP` at offset 11 (target `11 + 3 + 1 = 15`).

### JMPNIL

```
JMPNIL J
```

Used to terminate iterative `for const x in obj { ... }` loops. It tests the value just produced by `FORITER`:

- **`nil`** (iterator exhausted): the value is popped and execution jumps forward by `J`, leaving the loop
- **anything else**: the value is left on the stack, where it becomes the loop variable, and execution falls through into the loop body

Stack (jump taken): `..., nil  ->  ...`
{{< stack before="...,nil" after="..." >}}

Stack (fallthrough): `..., v  ->  ..., v`
{{< stack before="...,v" after="...,v" >}}

#### Example

```
// for const x in xs { ... }   (iterator in hidden local slot 3)
0000    1 GETLOCAL           1        // xs
0002    | SETLOCAL           2        // hidden sequence local
0004    | GETITER            2        // push iterator
0006    | SETLOCAL           3        // hidden iterator local
0008    | FORITER            3        // call iterator, push next value
0010    | JMPNIL             N -> end // nil: pop and leave the loop
0013    | ...                         // loop body, x is on the stack
        | LOOP               ... -> 8 // back to FORITER
```

### LOOP

Unconditional **backward** jump: `ip -= J`, where `ip` already points past the instruction. Emitted at the end of `while` and `for` bodies. In listings the target is `ofs + 3 - J`.

Stack: unchanged

#### Example

```
// while x { ... }   (back-edge)
0020    4 LOOP               20 -> 3     ; 20 + 3 - 20
```

### JMPCMP

```
JMPCMP J
```

Used by `switch` statements. Pops the top value (the case value) and compares it to the value below it (the switch value):

- **not equal**: jumps forward by `J`; the switch value stays on the stack so the next case can be tested
- **equal**: pops the switch value too and falls through into the case body

Stack (no match, jump taken): `..., sw, case  ->  ..., sw`
{{< stack before="...,sw,case" after="...,sw" >}}

Stack (match, fallthrough): `..., sw, case  ->  ...`
{{< stack before="...,sw,case" after="..." >}}

#### Example

```
// switch x case 1 { ... } case ...
0000    1 GETLOCAL            1        // x
0002    | CONSTANT            0 1
0004    | JMPCMP              9 -> 16 // skip case body if x != 1
```

### MULTICASE

```
MULTICASE N
```

Supports `case a, b, c` clauses with several values. The stack holds the switch value followed by `N + 1` candidate case values, the last one pushed on top. The instruction pops candidates one at a time and compares each to the switch value:

- on the first match, the remaining candidates are discarded and the **mismatching** value is pushed back;
- if none match, all candidates are discarded and the candidate that was pushed **first** is pushed back.

In both cases, the switch value is untouched and exactly one candidate sits above it, ready for a following `JMPCMP`.

<!--
Stack: `..., sw, c0, ..., cN  ->  ..., sw, c`
-->

{{< stack before="...,sw,c0,...,cN" after="...,sw,c" >}}

#### Example

```
// case 1, 2, 3 {
0000    1 CONSTANT           0 1
0002    | CONSTANT           1 2
0004    | CONSTANT           2 3
0006    | MULTICASE          2
```

---

### Collection Operations

### LIST

```
LIST
```

Pushes a new, empty list.

<!---
Stack: `... -> ..., []`
-->

{{< stack before="..." after="...,[]" >}}

#### Example

```
// [1, 2]
0000    1 LIST
0001    | CONSTANT           0 1
0003    | LISTITEM
0004    | CONSTANT           1 2
0006    | LISTITEM
```

### MAP

```
MAP
```

Pushes a new, empty map.

<!---
Stack: `...  ->  ..., {}`
-->

{{< stack before="..." after="...,{}" >}}

#### Example

```
// {a = 1}
0000    1 MAP
0001    | CONSTANT           0 "a"
0003    | CONSTANT           1 1
0005    | MAPFIELD
```

### LISTITEM

```
LISTITEM
```

Appends the top value to the list below it, and pops the value. The list remains on the stack, so items can be appended in sequence.

<!---
Stack: `..., list, v  ->  ..., list`
-->

{{< stack before="...,list" after="...,list" >}}

#### Example

```
0001    1 CONSTANT           0 42
0003    | LISTITEM
```

### MAPFIELD

```
MAPFIELD
```

Stores a key/value pair into the map below them and pops both. The map remains on the stack.

<!---
Stack: `..., map, key, value  ->  ..., map`
-->

{{< stack before="...,map,key,value" after="...,map" >}}

#### Example

```
0001    1 CONSTANT           0 "k"  // key
0003    | CONSTANT           1 "v"  // value
0005    | MAPFIELD
```

### RANGE

```
RANGE
```

Builds a range object from three numbers: start, end and step.

<!---
Stack: `..., start, end, step  ->  ..., range`
-->

{{< stack before="...,start,end,step" after="...,range" >}}

Errors: any of the three values is not a number.

#### Example

```
// 0..10 (step 1)
0000    1 CONSTANT           0 0
0002    | CONSTANT           1 10
0004    | CONSTANT           2 1
0006    | RANGE
```

### UNPACK

```
UNPACK N
```

Destructuring assignment. Pops a list and pushes all of its elements, in order. The list must contain exactly `N` elements.

<!---
Stack: `..., list  ->  ..., e0, ..., e(N-1)`
-->

{{< stack before="...,list" after="...,e0,...,e(N-1)" >}}

Errors: the value is not a list; the list has more (`MAXUNPACK`) or fewer (`MINUNPACK`) than `N` elements.

#### Example

```
// var a, b = pair
0000    1 GETLOCAL           1
0002    | UNPACK             2
```

### UNPACKREST

```
UNPACKREST N P
```

Destructuring with a rest variable. `N` is the total number of targets (including the rest target) and `P` the index of the rest target. The list is popped and its elements pushed in order, except that elements `P .. len - (N - P - 1) - 1)` are collected into a new list pushed at position `P`.

<!---
Stack: `..., list  ->  ..., e0, ..., rest, ..., e(N-1)`
-->

{{< stack before="...,list" after="...,e0,rest,...,e(N-1)" >}}

Errors: the value is not a list; the list has fewer than `N` elements (`MINUNPACK`).

#### Example

```
// var first, ...rest = items   (N = 2, P = 1)
0000    1 GETLOCAL           1
0002    | UNPACKREST          2 1
```

### LISTEXTEND

```
LISTEXTEND
```

Appends every element of the top value to the list below it, then pops the top value. Supported sources are lists, range and strings (one-character strings).

<!---
Stack: `..., list, src  ->  ..., list`
-->

{{< stack before="...,list,src" after="...,list" >}}

Errors: `src` is not iterable by this instruction.

#### Example

```
// [1, ...xs]
0000    1 LIST
0001    | CONSTANT           0 1
0003    | LISTITEM
0004    | GETLOCAL           1      // xs
0006    | LISTEXTEND
```

### SPREAD

```
SPREAD J N
```

Expands a list into call arguments (`f(a, ...xs)`). The top of the stack must be a list; it is replaced by its elements. Because the final argument count is only known at runtime, the VM **patches the argument-count operand of the call instruction that follows**: `J` is the distance, measured from the `SPREAD` instruction, to the operand byte of that `CALL`/`INVOKE`, and `N` is the argument count the compiler assumed (counting the list as one argument). The byte at that position is overwritten with `N + len - 1`.

<!---
Stack: `..., list  ->  ..., e0, ..., e(len-1)`
-->

{{< stack before="...,list" after="...,e0,...,e(len-1)" >}}

Errors: the value is not a list; the resulting argument count exceeds 255.

#### Example

```
// f(...xs)
0000    1 GETGLOBAL          0 f
0002    | GETLOCAL           1      ; xs
0004    | SPREAD             1 -> 9 (1 args)   ; patches the CALL operand
0008    | CALL               1                 ; operand rewritten to len(xs)
```

---

### Object Access

Attribute and index access go through the meta-method layer, so the exact behavior depends on the receiver type: instance fields, getters and setters, `getattr`/`setattr`, module exports, list/string/map indexing, and so on. The `PUSH*` variants keep the container on the stack, which the compiler uses for compound assignments, such as `obj += 1`.

### GETATTR

```
GETATTR K
```

Replaces the object on top of the stack with its attribute named by string constant `K`.

<!---
Stack: `..., obj  ->  ..., obj.K`
-->

{{< stack before="...,obj" after="...,obj.K" >}}

Errors: no such attribute.

#### Example

```
// p.x
0000    1 GETLOCAL           1
0002    | GETATTR            0 x
```

### PUSHATTR

```
PUSHATTR K
```

Like `GETATTR`, but leaves the object on the stack and pushes the attribute above it.

<!---
Stack: `..., obj  ->  ..., obj, obj.K`
-->

{{< stack before="...,obj" after="...,obj,obj.K" >}}

#### Example

```
// p.x += 1
0000    1 GETLOCAL           1
0002    | PUSHATTR           0 x
0004    | CONSTANT           1 1
0006    | ADD
0007    | SETATTR            0 x
```

### SETATTR

```
SETATTR K
```

Assigns the value on top of the stack to attribute `K` of the object below it. Setters and `setattr` are honoured. The result of the expression (the value returned by the meta-method) replaces both operands, so an assignment can be used as expression.

<!----
Stack: `..., obj, v  ->  ..., v`
-->

{{< stack before="...,obj,v" after="...,v" >}}

#### Example

```
// p.x = 5
0000    1 GETLOCAL           1
0002    | CONSTANT           1 5
0004    | SETATTR            0 x
0006    | POP
```

### GETIDX

```
GETIDX
```

Subscript read: replaces the object and index with the indexed element.

<!----
Stack: `..., obj, idx  ->  ..., obj[idx]`
-->

{{< stack before="...,obj,idx" after="...,obj[idx]" >}}

Errors: invalid index type or out of range.

#### Example

```
// xs[0]
0000    1 GETLOCAL           1
0002    | CONSTANT           0 0
0004    | GETIDX
```

### PUSHIDX

```
PUSHIDX
```

Like `GETIDX`, but leaves the object and index on the stack and pushes the element above them. Used for compound index assignment.

<!----
Stack: `..., obj, idx  ->  ..., obj, idx, obj[idx]`
-->

{{< stack before="...,obj,idx" after="...,obj,idx,obj[idx]" >}}

#### Example

```
// xs[0] += 1
0000    1 GETLOCAL           1
0002    | CONSTANT           0 0
0004    | PUSHIDX
0005    | CONSTANT           1 1
0007    | ADD
0008    | SETIDX
```

### SETIDX

```
SETIDX
```

Subscript write. The result of the store replaces all three operands.

<!---
Stack: `..., obj, idx, v  ->  ..., v`
-->

{{< stack before="...,obj,idx,v" after="...,v" >}}

#### Example

```
// xs[0] = 9
0000    1 GETLOCAL           1
0002    | CONSTANT           0 0
0004    | CONSTANT           1 9
0006    | SETIDX
0007    | POP
```

### GETSUPER

```
GETSUPER K
```

Looks up method `K` on a superclass and binds it to the receiver, producing a bound method value. The superclass is on top of the stack and is consumed; the receiver below it is replaced by the bound method.

<!---
Stack: `..., self, super  ->  ..., bound`
-->

{{< stack before="...,self,super" after="...,bound" >}}

Errors: the superclass has no such method.

#### Example

```
// var f = super.speak
0000    1 GETLOCAL           0      // self
0002    | GETUPVAL           0      // super
0004    | GETSUPER           0 speak
```

---

### Global and Module Access

### GETGLOBAL

```
GETGLOBAL K
```

Pushes the value of the global variable named by string constant `K`. Undefined globals evaluate to `nil` rather than raising an error. This is because globals are resolved by the compiler **before** executing the module environment.

<!---
Stack: `...  ->  ..., G[K]`
-->

{{< stack before="..." after="...,G[K]" >}}

#### Example

```
0000    1 GETGLOBAL          0 print
```

### GETMODULE

```
GETMODULE S
```

Pushes module-level variable number `S` of the running function's module.

<!--
Stack: `...  ->  ..., M[S]`
-->

{{< stack before="..." after="...,M[S]" >}}

#### Example

```
0000    1 GETMODULE            3
```

### SETMODULE

```
SETMODULE S
```

Stores the top of the stack into module variable `S`. The value is **not** popped.

<!----
Stack: `..., v  ->  ..., v`  (and `M[S] = v`)
-->

{{< stack before="...,v" after="...,v" >}}

#### Example

```
// top-level: count = 0
0000    1 CONSTANT           0 0
0002    | SETMODULE            3
0004    | POP
```

### DEFMODULE

```
DEFMODULE K
```

Publishes the value on top of the stack as an **export** of the current module under the name given by string constant `K`. The value is **not** popped. Emitted for `export` declarations.

<!---
Stack: `..., v  ->  ..., v`  (and `E[K] = v`)
-->

{{< stack before="...,v" after="...,v" >}}

#### Example

```
// export var version = "1.0"
0000    1 CONSTANT           0 "1.0"
0002    | SETMODULE            0
0004    | DEFMODULE          1 version
0006    | POP
```

---

### Closures and Upvalues

### CLOSURE

```
CLOSURE K
```

Creates a closure from the function prototype stored in constant `K`. Upvalues are captured immediately according to the prototype's descriptor list: each descriptor either refers to a local slot of the _enclosing_ function (flag `0x0100` set; the upvalue is opened on that stack slot) or to one of the enclosing function's own upvalues. The descriptors are not encoded in the bytecode stream (see *Instruction Encoding*); the listing tool prints them under the instruction.

<!----
Stack: `...  ->  ..., closure`
-->

{{< stack before="..." after="...,closure" >}}

#### Example

```
// function inc() { n += 1 }   where n is a local of the enclosing function
0000    1 CLOSURE            0 <function inc>
        |                     local 1
```

### CLOSEUPVAL

```
CLOSEUPVAL
```

Closes any open upvalue that refers to the stack slot at the top of the stack (copying the value into the upvalue object so it survives after the slot is gone), then pops that slot. Emitted when a block ends and one of its locals has been captured by a closure.

<!---
Stack: `..., v  ->  ...`
-->

{{< stack before="...,v" after="..." >}}

#### Example

```
// { var x = 1; fn = function() { return x } }
0000    1 CONSTANT           0 1
0002    | CLOSURE            1 <function>
        |                     local 1
0004    | SETLOCAL           2
0006    | POP
0007    | CLOSEUPVAL
```

### GETUPVAL

```
GETUPVAL S
```

Pushes the current value of upvalue `S` of the running closure.

<!---
Stack: `...  ->  ..., U[S]`
--->

{{< stack before="..." after="...,U[S]" >}}

#### Example

```
// return n   (n captured)
0000    1 GETUPVAL           0
0002    | RETURN
```

### SETUPVAL

```
SETUPVAL S
```

Stores the top of the stack into upvalue `S`. The value is not popped.

<!--
Stack: `..., v  ->  ..., v`  (and `U[S] = v`)
--->

{{< stack before="...,v" after="...v" >}}

#### Example

```
// n = 3   (n captured)
0000    1 CONSTANT           0 3
0002    | SETUPVAL           0
0004    | POP
```

---

### Logical and Type Operations

### NOT

```
NOT
```

Logical negation. The result is `true` if the operand is falsey, otherwise `false`. Never calls meta-methods.

<!---
Stack: `..., v  ->  ..., (not v)`
-->

{{< stack before="...,v" after="...,(not v)" >}}

#### Example

```
// !x
0000    1 GETLOCAL           1
0002    | NOT
```

### IS

```
IS
```

Type test (`obj is Class`). Pushes `true` if the class of the left value is the right-hand class or inherits it. Values with no associated class produce `false`.

<!---
Stack: `..., v, cls  ->  ..., (v is cls)`
-->

{{< stack before="...,v,cls" after="...,(v is cls)" >}}

Errors: the right operand is not a class.

#### Example

```
// d is Animal
0000    1 GETLOCAL           1
0002    | GETGLOBAL          0 Animal
0004    | IS
```

### IN

```
IN
```

Membership test (`value in container`). Calls the container's `contains` meta-method (built-in for lists, maps, strings and ranges) with the value as argument. The result of that call is the result of the expression.

<!---
Stack: `..., value, container  ->  ..., result`
-->

{{< stack before="...,value,container" after="...,result" >}}

Errors: the container does not support `contains`.

#### Example

```
// 3 in xs
0000    1 CONSTANT           0 3
0002    | GETLOCAL           1
0004    | IN
```

### ISTYPE

```
ISTYPE
```

Verification-only instruction that checks that the value just _below_ the top of the stack is a class and raises an error otherwise. It does not modify the stack.

Stack: unchanged

Errors: the value is not a class.

#### Example

```
0000    1 GETGLOBAL          0 Foo
0002    | GETLOCAL           1
0004    | ISTYPE
```

---

### Bitwise Operations

Bitwise instructions convert both operands to unsigned 32-bit integers, operate on them, and convert the result back to a number. As with arithmetic, non-numeric operands fall back to the matching meta-method and otherwise raise an operand type error.

### BAND

```
BAND
```

Bitwise AND (`a & b`).

<!---
Stack: `..., a, b  ->  ..., a & b`
-->

{{< stack before="...,a,b" after="...,a & b" >}}

#### Example

```
// 6 & 3
0000    1 CONSTANT           0 6
0002    | CONSTANT           1 3
0004    | BAND
```

### BOR

```
BOR
```

Bitwise OR (`a | b`).

<!---
Stack: `..., a, b  ->  ..., a | b`
-->

{{< stack before="...,a,b" after="...,a | b" >}}

#### Example

```
// 4 | 1
0000    1 CONSTANT           0 4
0002    | CONSTANT           1 1
0004    | BOR
```

### BXOR

```
BXOR
```

Bitwise exclusive OR (XOR) (`a ^ b`).

<!---
Stack: `..., a, b  ->  ..., a ^ b`
-->

{{< stack before="...,a,b" after="...,a ^ b" >}}

#### Example

```
// 5 ^ 1
0000    1 CONSTANT           0 5
0002    | CONSTANT           1 1
0004    | BXOR
```

### BNOT

```
BNOT
```

Bitwise complement of the top value (`~a`, on 32 bits). For non-numbers the `~` overload is called.

<!---
Stack: `..., a  ->  ..., ~a`
-->

{{< stack before="...,a" after="...,~a" >}}

#### Example

```
// ~x
0000    1 GETLOCAL           1
0002    | BNOT
```

### LSHIFT

```
LSHIFT
```

Left shift (`a << b`), on 32 bits.

<!---
Stack: `..., a, b  ->  ..., a << b`
-->

{{< stack before="...a,b" after="...,a << b" >}}

#### Example

```
// 1 << 4
0000    1 CONSTANT           0 1
0002    | CONSTANT           1 4
0004    | LSHIFT
```

### RSHIFT

Right shift (`a >> b`), on 32 bits, logical (zero-filling).

<!---
Stack: `..., a, b  ->  ..., a >> b`
-->

{{< stack before="...a,b" after="...,a >> b" >}}

#### Example
 
```
// 16 >> 2
0000    1 CONSTANT           0 16
0002    | CONSTANT           1 2
0004    | RSHIFT
```

---

### Iteration

`for const x in seq` are compiled with two hidden locals: the sequence and the iterator. `GETITER` produces the iterator once before the loop; `FORITER` is executed at the top of every iteration to fetch the next value.

### GETITER

```
GETITER S
```

Reads the sequence stored in local `S` and pushes its iterator. If the value is already a function it is used as the iterator directly; otherwise its `iter` meta-method is called and the result is pushed.

<!--
Stack: `...  ->  ..., iterator`
-->

{{< stack before="..." after="...,iterator" >}}

Errors: the value is not iterable.

#### Example

```
// for const x in xs { ... }   (xs in slot 3 hidden local)
0000    1 GETLOCAL           1
0002    | SETLOCAL           3
0004    | GETITER            3
```

### FORITER

```
FORITER S
```

Calls the iterator held in local `S` with no arguments and pushes its result. The result is then tested by `JMPNIL`, which exits the loop when the iterator returns `nil`.

<!---
Stack: `...  ->  ..., next`
-->

{{< stack before="..." after="...,next" >}}

#### Example
 
```
0008    2 FORITER            4
0010    | JMPNIL             N -> end
```

---

### Classes

### CLASS

```
CLASS K
```

Creates a new, empty class named by string constant `K` and pushes it.

<!---
Stack: `...  ->  ..., cls`
-->

{{< stack before="..." after="...,cls" >}}

#### Example

```
// class Point { ... }
0000    1 CLASS              0 Point
```

### METHOD

```
METHOD K F
```

Adds a method to a class. The method value is on top of the stack and the class directly below it. `K` is the method name (string constant) and `F` the flag byte. The method is popped; the class stays. If the method is named by the `new` constructor name, it is also installed as the class' constructor (used by `NEW`).

<!---
Stack: `..., cls, fn  ->  ..., cls`
-->

{{< stack before="...,cls,fn" after="...,cls" >}}

#### Example

```
// class Point { new(x, y) {...} static origin() {...} }
0000    1 CLASS              0 Point
0002    | CLOSURE            1 <function new>
0004    | METHOD             2 new 0
0007    | CLOSURE            3 <function origin>
0009    | METHOD             4 origin 1
```

### INHERIT

```
INHERIT
```

Makes the class on top of the stack a subclass of the class below it: records the superclass, inherits its construtor, and copies the superclass' methods into the subclass' method table. The subclass is then popped.

<!---
Stack: `..., super, cls  ->  ..., super`
-->

{{< stack before="...,super,cls" after="...,super" >}}

Errors: the superclass value is not a class; the superclass is a built-in class; a class inherits from itself.

#### Example

```
// class Dog : Animal { ... }
0000    1 CLASS              0 Dog
0002    | GETGLOBAL          1 Animal
0004    | INHERIT
```

> In real output the compiler arranges the stack so that the superclass is below the class being defined (e.g. by pushing it before or re-pushing the class).

---

### IMPORTS

An import is compiled as a short sequence: of of `IMPORTNAME`, `IMPORTSTR` or `IMPORTFMT` loads and runs the module (if it was not loaded yet) and records it as the VM's _last module_; then `IMPORTALIAS` and/or `IMPORTVAR` read from it; finally `IMPORTEND` restores the _last module_ to the importing module.

### IMPORTNAME

```
IMPORTNAME K
```

Import a module by **logical name** (a built-in or search-path module such as `math`), given by string constant `K`. The module becomes the current _last module_.

Stack: unchanged

#### Example

```
// import math
0000    1 IMPORTNAME         0 math
```

### IMPORTSTR

```
IMPORTSTR K
```

Imports a module by **path**, resolved relative to the importing module's file. `K` is a string constant holding the path.

Stack: unchanged

#### Example

```
// import "lib/util.tea"
0000    1 IMPORTSTR          0 "lib/util.tea"
```

### IMPORTFMT

```
IMPORTFMT
```

Same as `IMPORTSTR`, but the path is an interpolated string computed at runtime. The string is taken from the top of the stack and popped.

<!---
Stack: `..., path  ->  ...`
-->

{{< stack before="...,path" after="..." >}}

#### Example

```
// import "lib/{name}.tea"
0000    1 CONSTANT           0 "lib/{...}.tea"
0002    | ...                       // build the formatted path
0006    | IMPORTFMT
```

### IMPORTALIAS

```
IMPORTALIAS
```

Pushes the last imported module itself, for `import m as alias`/`import m` forms that bind the whole module.

<!---
Stack: `...  ->  ..., module`
-->

{{< stack before="..." after="...,module" >}}

#### Example

```
// import math
0000    1 IMPORTNAME         0 math
0002    | IMPORTALIAS
0003    | SETMODULE            0
0005    | POP
0006    | IMPORTEND
```

### IMPORTVAR

```
IMPORTVAR K
```

Pushes the export name by string constant `K` from the last imported module. For `from m import a, b` this is emitted once per name.

<!--
Stack: `...  ->  ..., export`
--->

{{< stack before="..." after="...,export" >}}

Errors: the module has no such export.

#### Example

```
// from math import sqrt
0000    1 IMPORTNAME         0 math
0002    | IMPORTVAR          1 sqrt
0004    | SETMODULE            1
0006    | POP
0007    | IMPORTEND
```

### IMPORTEND

```
IMPORTEND
```

Ends an import statement by resetting the _last module_ to the module that is currently executing.

Stack: unchanged

#### Example

```
0007    1 IMPORTEND
```

---

### Special Instructions

### DEFOPT

```
DEFOPT N O
```

Emitted in the prologue of a function with optional parameters. `N` is the number of required parameters and `O` the number of optional ones. At entry the stack holds the arguments the caller actually supplied, followed by the `O` default values evaluated by the compiler (one per optional parameter). `DEFOPT` re-arranges them so that the supplied optional arguments are kept in place and only the defaults for the **missing** parameters are retained, leaving exactly `N + O` parameter slots.

<!--
Stack: `..., supplied..., defaults(O)  ->  ..., supplied..., remaining defaults`
--->

{{< stack before="...,supplied...,defaults(O)" after="...,supplied...,remaining defaults" >}}

#### Example

```
// function f(a, b = 10) {...}    N = 1, O = 1
0000    1 CONSTANT           0 10  ; default for b
0002    | DEFOPT             1 1
```

### END

```
END
```

Terminates a function's bytecode. It is a no-op used as a placeholder by the compiler and **never** appears in the final bytecode.

Stack: unchanged

#### Example

```
0000    | END
```
