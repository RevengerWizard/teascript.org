---
title: Binary Encoding
number: "2."
weight: 1300
---

This chapter specifies the byte-level layout of a serialized Teascript chunk, the _dump format_ produced by `tea_dump` and consumed by the bytecode loader. It describes version **0** of the format. For purpose of the format, its design goals and its compatibility rules, see _Overview_. For the encoding of the individual VM instructions embedded in a dump, see _Instruction Set_.

A dump is a flat byte stream:

```
Chunk         := Header  ModuleSection  Prototype+  Footer
Header        := 0x1B 0x54 0x65 0x61  version:u8  flags:u8
ModuleSection := nvars:uleb128  ( len:uleb128  name:byte[len] ) * nvars
Prototype     := size:uleb128  body:byte[size]
Footer        := 0x00
```

There is no padding or alignment anywhere in the stream; every field starts at the byte after the previous one.

## Primitive Types

The notation below is used throughout the chapter:

| Notation | Size | Description |
| --- | --- | --- |
| `u8` | 1 byte | Unsigned byte |
| `uleb128` | 1 to 5 bytes | Unsigned 32-bit integer in LEB128 form (see below) |
| `uleb128_33` | 1 to 5 bytes | 33-bit ULEB128 whose lowest bit is a marker, used for number constants |
| `byte[n]` | n bytes | Raw bytes, no terminator |
| `u16` | 2 bytes | Unsigned 16-bit integer in the **byte order of the producer** (see the `BE` flag) |

### ULEB128

Unsigned integers are written 7 bits at a time, least significant group first. Every byte except the last has its top bit (`0x80`) set mean "more bytes follow".

```
value 0x00000000   ->  00
value 0x0000007F   ->  7F
value 0x00000080   ->  80 01
value 0x00003FFF   ->  FF 7F
value 0x3FF00000   ->  80 80 C0 FF 03
```

The writer always emits the shortest form. Values are limited to 32 bits, so a ULEB128 is at most five bytes long.

### `uleb128_33`

Number constants need the full 32 bits of the low word of a double _plus_ a marker bit, which does not fit a 32-bit ULEB128. The value `(lo << 1) | 1` is therefore written as a 33-bit unsigned LEB128. The reader discards the lowest bit of the first byte and reassembles the remaining 32 bits. In practice, this means:

- the first byte of a `uleb128_33` always has its 0 set when written by the compiler;
- it is between 1 and 5 bytes long;
- it decodes to a plain 32-bit value;

### Byte Order

Only two kinds of data in a dump depend on the byte order of the machine that wrote it: the **upvalue descriptors** (`u16`) and the **line information**. Everything else is a byte sequence or a ULEB128, and is byte-order neutral.

The producer's byte order is recorded in the `BE` header flag. When the flag does not match the loading machine, the reader swaps the two kinds of data above.

## File Header

The header is size bytes long.

```
 offset  size  field
 ------  ----  ---------------------------------
   0      1    0x1B   signature byte 1  (ESC)
   1      1    0x54   signature byte 2  ('T')
   2      1    0x65   signature byte 3  ('e')
   3      1    0x61   signature byte 4  ('a')
   4      1    version   format version (currently 0)
   5      1    flags     bit set, see below
```

The four signature bytes always spell `ESC T e a` (`"\033Tea"`). The leading `ESC` byte is how the loader tells a bytecode chunk from source text, which can never start it.

### Flags

| Bit | Mask | Name | Meaning when set |
| --- | --- | --- | --- |
| 0 | `0x01` | `BE` | The dump was written on a **big-endian** machine |
| 1 | `0x02` | `STRIP` | Debug information was **stripped** |

All other bits are reserved and must be zero.

The `STRIP` flag changes the layout of the prototypes that follow: a stripped dump contains neither the debug-info fields in the prototype header nor the line information block (see _Function Prototypes_). The flag applies to the whole dump; stripped and unstripped prototypes cannot be mixed.

The loader validates the signature and the version. A mismatch is reported as a _bad format_ error and nothing else is read.

### Module Variable Table

Immediately after the header comes, the **module section**, which carries the names of the module-level variables of the chunk's module.

```
nvars  : uleb128
repeat nvars times:
    len  : uleb128
    name : byte[len]
```

The position of a name in this list is the _slot number_ used by `GETMODULE`, `SETMODULE` and related instructions. When the dump is loaded, the module's variable table is replaced with one of `nvars` entries named as listed, each initialised to `nil`. The module section is not size-prefixed and is not terminated.

## Type Tags

Constants in the constant pool begin with a **type tag**, a ULEB128 value that says what kind of constant follows and, for strings, how long they are.

| Tag | Name | Meaning |
| --- | --- | --- |
| `0` | `KGC_NUM` | A number (IEEE-754 double) |
| `1` | `KGC_FUNC` | A nested function prototype |
| `2`, `3`, `4` | Reserved. Never written; their behaviour when read is unspecified |
| `>= 5` | `KGC_STR` | A string of length `tag - 5` |

Strings fold their length into the tag: the tag for a string of `n` bytes is `5 + n`. A 3-byte string has tag `8`, the empty string has tag `5`. Together with ULEB128 encoding this makes short strings (up to 122 bytes) cost a single tag byte plus their characters.

The tags are an internal property of the dump format. They are unrelated to the in-memory type tags of Teascript values or objects, and they are not opcodes.

## Constant Pool

Every prototype has a constant pool, a table whose entries are referenced by 8-bit indexes (`K` operands) from the instruction stream. A constant is number, a string or a nested function prototype. Booleans and `nil` are _never_ stored directly; they have dedicated instructions (`KTRUE`, `KFALSE`, `KNIL`) that materialize their values at runtime.

The pool is stored as `sizek` consecutive entries in index order, entry 0 first. Each entry is a type tag followed by tag-specific data.

### Strings

```
tag  : uleb128     (5 + len)
data : byte[len]
```

The bytes are the raw contents of the string. There is no terminator and no encoding is imposed; strings are length-delimited byte sequences. Names used by instructions (global, attribute, method and class names) are strings constants.

### Numbers

```
tag  : uleb128     (0)
lo   : uleb128_33  (low 32 bits of the double, shifted left by one, with marker bit)
hi   : uleb128     (high 32 bits of the double)
```

The 64-bit IEEE-754 representation of the number is split into a low word and a high word. The low word is written as `(lo << 1) | 1` in 33-bit LEB128, the high word as a plain ULEB128. Splitting by _word_ rather than by _byte_ keeps the encoding independent of host byte order.

xample, the number `1.0` (`0x3FF0000000000000`):

```
00                tag      KGC_NUM
01                lo       (0 << 1) | 1
80 80 C0 FF 03    hi       0x3FF00000
```

A number constant takes between 3 and 11 bytes (the tag, up to five for `lo`, up to five for `hi`).

### Nested Functions

```
tag  : uleb128     (1)
```

A function constant consists of the tag **only**. The prototype itself is not nested inside the constant pool; it has already been written as a separate prototype earlier in the stream, and the reader attaches it at this position by taking it from its stack of loaded prototypes (see _Function Prototypes_, _Prototype Order_).

A prototype can contain function constants only if its `CHILD` flag is set.

## Upvalue Descriptors

A closure's upvalues are captured when the `CLOSURE` instruction runs. What each upvalue refers to is described by an array of **upvalue descriptors** stored in the _child_ prototype (the function that owns the upvalues), not in the instruction stream of the parent.

```
count : u8                 (header field `sizeuv`)
uv    : u16[count]         (descriptor array, in the producer's byte order)
```

Each descriptor is a 16-bit value:

```
 15            9  8  7             0
+---------------+--+---------------+
|   reserved    |L |     index     |
+---------------+--+---------------+
```

| Bits | Name | Description
| --- | --- | --- |
| 0 to 7 | `index` | Slot number: a local slot of the enclosing function, or an upvalue index of the enclosing function |
| 8 | `LOCAL` (`0x0100`) | When set, `index` is a **local slot** of the enclosing function and a new upvalue is opened on it. When clear, `index` is one of the enclosing function's **own upvalues**, which the new closure shares |
| 9 to 15 | | Unused, zero |

Descriptor _n_ describes upvalues _n_ of the function, i.e. the one addressed by `GETUPVAL n` and `SETUPVAL n`. The array contains `sizeuv` entries and takes `2 * sizeuv` bytes in the stream. It is written after the instruction array and before the constant pool. If the `BE` flag disagrees with the loading machine, the reader swaps each entry's two bytes.

Because `sizeuv` is a single byte, a function can have at most 255 upvalues.

## Function Prototypes

The remainder of the dump, up to the footer, is a sequence of prototypes. Each one is a self-contained, size-prefixed record.

```
size : uleb128          number of bytes in `body`
body : byte[size]
```

### Prototype Body

The body is composed of the following fields, in order:

```
name      : uleb128 len, byte[len]     function name (may be empty)
numparams : u8                         number of required parameters
numopts   : u8                         number of optional parameters
flags     : u8                         prototype flags (see below)
max_slots : u8                         maximum stack slots needed by a call
sizeuv    : u8                         number of upvalue descriptors
sizebc    : uleb128                    size of the instruction array, in bytes
sizek     : uleb128                    number of constants
// present only when the STRIP flag is clear
sizedbg   : uleb128                    size of the line information block, in bytes
  // present only when sizedbg != 0
  firstline : uleb128                  line number of the function's first line
  numline   : uleb128                  number of source lines spanned
// end of conditional part
code      : byte[sizebc]               instruction array
uv        : u16[sizeuv]                upvalue descriptors
constants : constant[sizek]            constant pool
lineinfo  : byte[sizedbg]              line information (only when sizedbg != 0)
```

All fields are mandatory, unless stated otherwise. A stripped dump has none of the three debug fields (`sizedbg`, `firstline`, `numline`) and no `lineinfo` block.

#### Header fields

| Field | Description |
| --- | --- |
| `name` | The function's name, used in diagnostics. The main function of a chunk and anonymous functions have names the compiler chooses; an empty name is valid |
| `numparams` | Number of required parameters. Used by `CALL` for argument-count checks |
| `numopts` | Number of optional arguments (those with default values, initialised by `DEFOPT`) |
| `flags` | Bit set; only the following bit is serialized |
| `max_slots` | Pre-computed stack size to reserve for a call frame of this function |
| `sizeuv` | Number of upvalue descriptors, see _Upvalue Descriptors_ |
| `sizebc` | Byte length of the instruction array. Because instructions are variable length, this is **not** an instruction count |
| `sizek` | Number of entries in the constant pool |

#### Prototype Flags

| Mask | Name | Meaning when set |
| --- | --- | --- |
| `PROTO_CHILD` | `CHILD` | The prototype has nested functions, i.e. at least one constant of type `KGC_FUNC` |

The writer stores only stores the `CHILD` bit; all other bits of the `flags` byte are written as zero. A reader should preserve the byte as read.

#### Instruction Array

The instruction array is written verbatim; `sizebc` bytes, exactly as the VM will execute them. Instructions are not decoded or re-encoded by the dump format, and the array is not transformed when the byte order differs (this should be fixed?).

#### Line Information

When present, the line information block holds line-number entries used to translate an instruction position into a source line for error messages and tracebacks. The width of each entry depends on `numline`, as can be seen from the loader's byte-swapping logic:

- when `numline < 256`, entries are 1 byte wise;
- when `numline < 65536`, entries are `u16`;
- otherwise, entries are `u32`

When the byte orders differ, the loader swaps `u16` and `u32` entries; it treats the block as `sizebc - 1` entries. A function with no line information has `sizedbg = 0` and then carries no `firstline`/`numline`.

#### Prototype Order

Prototypes are written **children first**. When the writer serializes a prototype with the `CHILD` flag, it first writes every nested prototype, walking the constant pool from the **highest index to the lowest**, each of them recursively following the same rule. Only then, is the prototype itself written. As a consequence of this:

- the **last** prototype in the stream is the "main" function of the chunk
- every prototype appears after all prototypes nested in it
- the prototypes of one function's children appear in _descending_ constant index order

The reader exploits this order with a stack. Each prototype it reads is pushed on that stack. When it later meets a `KGC_FUNC` constant while reading a parent's constant pool, it pops the top of the stack and stores that prototype in the constant slot. Because the pool is read in ascending order and the children were written in descending order, the top of the stack is always the child the current constant refers to.

Example, a function `f` whose constants are `[ "a", <g>, "b", <h> ]` (functions `g` at index 1 and `h` at index 3) is written as:

```
prototype  h        (constant 3: highest index first)
prototype  g        (constant 1)
prototype  f        (its constants are "a", FUNC, "b", FUNC)
```

When the reader gets to `f`'s constant 1, the top of the stack is `g`; for constant 3 the top is then `h`.

### Reading and Validation

A conforming reader checks the following, and rejects the dump as _corrupt_ on any failure:

1. **Complete size**. After a prototype body has been read, the number of bytes consumed must equal the `size` prefix exactly
2. **Prototype stack**. A `KGC_FUNC` constant must find a prototype on the stack. At the end of the stream, exactly one prototype must remain: the main function.
3. **Truncation**. The stream may not end before the footer. The reader pulls data from its reader callback as needed and fails if the data runs out in the middle of a record.
4. **Trailing data**. After the footer, nothing may follow, other than optional end mark supplied by the caller.

A well-formed dump never contains a type tag in the reserved range `2` to `4`.

### Footer

The stream ends with a single `0x00` byte. The reader looks at the first byte of every prototype record, and a size of zero (which no real prototype can have, since its body is never empty) means _end of stream_.

## Complete Example

The following hand-assembled chunk contains one module variable `x` and one function named `main` that loads the constant `1` and returns it. It is a _stripped_ little-endian dump. The opcode values used (`CONSTANT` = `02`, `RETURN` = `0B`) are those of the `BCDEF` table at the time of writing. The compiler would of course emit its own code for a real program, and opcode numbers change whenever the instruction set does.

```
Offset  Bytes                      Meaning
------  -------------------------  ------------------------------------------
Header
0000    1B 54 65 61                signature  ESC 'T' 'e' 'a'
0004    00                         version 0
0005    02                         flags      STRIP, little endian
 
Module section
0006    01                         nvars = 1
0007    01 78                      name: len 1, "x"
 
Prototype main
0009    17                         size = 23 bytes follow
000A    04 6D 61 69 6E             name: len 4, "main"
000F    00                         numparams = 0
0010    00                         numopts   = 0
0011    00                         flags     = 0 (no children)
0012    02                         max_slots = 2
0013    00                         sizeuv    = 0
0014    04                         sizebc    = 4
0015    01                         sizek     = 1
                                   (stripped: no sizedbg / line info)
0016    02 00                      CONSTANT 0
0018    0B                         RETURN
                                   (no upvalue descriptors)
0010    00                         constant 0: tag KGC_NUM
001A    01                         lo word:  (0 << 1) | 1
001B    80 80 C0 FF 03             hi word:  0x3FF00000   -> 1.0
 
Footer
0020    00                         end of stream
```

The body of `main` runs from offset `000A` to `0019`, which is 22 bytes, matching its size prefix `17`.
