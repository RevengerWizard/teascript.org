---
title: Overview
number: "1."
weight: 1200
---

This part of the documentation describes the Teascript bytecode. It's the compact binary form into which Teascript source code is compiled into and which the VM (virtual machine) executes. It is aimed at people who need to know what the compiler produces and what the VM consumes; authors of tools such as disassemblers, verifiers and bytecode generators, embedders who want to cache compiled code, and any possible contributors working on the interpreter or the VM itself.

The part is organized in three chapters as follows:

| Chapter | Describes | Read it when you need to... |
| --- | --- | --- |
| **Overview** | Goals, versioning rules and overall shape of a compiled _chunk_ | understand what a bytecode file is and how to produce and load one |
| **Binary Encoding** | The byte-level layout of a serialized chunk: header, constant pool, upvalue descriptors and function prototypes | read or write bytecode files directly |
| **Instruction Set** | Every VM instruction: operands, stack effect, semantics and examples | read disassembly, or generate or verify bytecode |

Two different "encodings" are described, and it helps to keep them apart:

- The **instruction encoding** is how a single VM instruction is laid out inside a function's code array. It is the same in memory and on disk. It is covered by _Instruction Set_
- The **binary encoding** (or _dump format_) is how a whole compiled program, with its functions, constants and metadata, is serialized to a stream of bytes. It is covered by _Binary Encoding_. The instruction arrays are embedded in it verbatim

## Design Goals

The bytecode and its dump format are shaped by a handful of goals. Knowing them makes many of the encoding choices in the following chapters easier to follow:

#### A small, simple Virtual Machine
Teascript is executed by a stack based VM. Instructions carry at most three operand bytes and operate on an implicit evaluation stack, so the dispatch loop stays short and operands never need decoding beyond reading a byte or a 16-bit offset.

#### Compact code
Instructions are byte-granular: an opcode byte plus 0 to 3 operand bytes, with jump distances in 16 bits and everything else in 8. Numbers in the dump format (lengths, counts, line information) use variable-length [ULEB128](https://en.wikipedia.org/wiki/LEB128#Unsigned_LEB128) integers, so small values cost one byte.

#### Fast Loading
The code array of every function is stored as raw bytes and copied into its final location with a single block copy. A function prototype and all of its arrays (code, constants, upvalue descriptors, line information) are allocated as one block, and every prototype in a dump carries its own byte size, so the loader can validate it as soon as it has been read.

#### Streamable
A dump is consumed through a reader callback that may deliver the data in chunks of any size, and it is produced through a writer callback that receives it piece by piece. Functions are emitted children first, so a loader can build the program bottom-up using a simple stack, without seeking and without forward references.

#### Portable
Dumps do not depend on the pointer size of the machine. Multi-byte values that are not ULEB128 (upvalue descriptors and line information) are stored in the byte order of the producer and flagged as such in the header, so the loader can swap them when the byte orders of the host differ. The code array itself is a byte sequence and is therefore byte-order neutral.

#### Optionally Lean
Debug information (line numbers) can be left out of a dump. The header records whether this was done, and the rest of the format adapts accordingly.

It is to note that much of the overall approach (ULEB128 integers, children-first prototype streaming, header flags for byte order and stripping) follow and in part resemble the one used by LuaJIT's bytecode dumps, adapted to Teascript's byte-oriented instruction set.

## Versioning and Compatibility

Every dump begins with a four byte signature followed by a **format version** and a flag byte (see _Bynary Encoding_). The current version is **0**.

The loader applies the following rules:

- A dump whose signature or version does not match is rejected as a _bad format_ error before anything else is read. There is no attempt to load dumps of another version.
- **Bytecode is not guaranteed to be compatible across Teascript versions**. A dump should be loaded only by the Teascript build that produces it, or by a build with the same bytecode version.
- A dump is rejected as _corrupt_ if any of its internal size fields are inconsistent, if it ends prematurely, or if function constants do not resolve (see _Binary Encoding_).
- The loader refuses to load text or binary chunks that the caller did not ask for (see _Load Modes_ below).

### What Requires a Version Change

The version number covers the dump layout _and_ the meaning of the instruction stream. It must be incremented whenever any of the following changes:

- The layout of the header, module section, prototype header or any constant encoding.
- The **opcode numbering**. Opcodes are numbered by their position in the `BCDEF` table in `tea_bc.h`, so adding, removing or reordering instructions changes the meaning of existing dumps.
- The **operand layout or semantics** of any instruction.
- The meaning of the prototype `flags` bits or of the upvalue descriptor bits.

> WARNING: A dump does not store an opcode table or a checksum of it. Changing the instruction set without bumping the version produces dumps that load successfully and then misbehave when executed.

### What Does Not Matter

- **Host byte order**. A dump produced on a big-endian machine can be loaded on a little-endian machine and vice versa; the loader converts the affected arrays.
- **Pointer size and word size**. Numbers are stored as their IEEE-754 double bit pattern slit in two 32-bit words, and all lengths are limited to 32 bits.
- **Stripping**. Stripped and unstripped dumps share the same version; the header flag distinguishes them. A stripped dump loads and runs identically but has no line information for error messages.

### Limits

Several limits come directly from the field widths of the format:

| Item | Limit | Reason |
| --- | --- | --- |
| Parameters, optional parameters per function | 255 each | 1-byte header fields |
| Stack slots per function | 255 | 1-byte `max_slots` |
| Constants addressable by an instruction | 256 | 8-bit constant operand (`K`) |
| Local, upvalue and module variable index | 256 | 8-bit slot operand (`S`) |
| Call arguments | 255 | 8-bit count operand (`N`) |
| Size of any ULEB128 field | 32 bits | The reader uses 32-bit integers |

## The Chunk Format

Teascript calls any unit of loadable code as **chunk**. A chunk is either Teascript source text or a bytecode dump; the loader tells the two apart by the first byte of the stream, which is `0x1B` (ESC) for bytecode. Loading a chunk always gives a function that can be called, and is always bound to a _module_ (see below).

### Anatomy of a Bytecode Chunk

A serialized bytecode chunk has four parts, always in this order:

```
+---------------------------------------------+
| Header            signature, version, flags |
+---------------------------------------------+
| Module section    names of module variables |
+---------------------------------------------+
| Prototype  P1     size + body   (child)     |
| Prototype  P2     size + body   (child)     |
|   ...                                       |
| Prototype  Pn     size + body   (main)      |
+---------------------------------------------+
| Footer            a single 0x00 byte        |
+---------------------------------------------+
```

- The **header** identifies the stream and describes how the rest is encoded (byte order, stripped or not).
- The **module section** lists the names of the module-level variables. Instructions such as `GETMODULE` and `SETMODULE` address these variables by position, so the list is what gives those slot numbers a meaning.
- The **prototype stream** carries every function of the program, one _function prototype_ each, in dependency order: a function always appears after all of the functions nested inside it. The last prototype is the **main function** of the chunk, which contains the top-level code of the module. Prototypes are size-prefixed.
- The **footer** is a zero byte. Since no prototype can have a size of zero, it doubles as the end-of-stream marker.

### Function Prototypes

A _function prototype_ is the compiled, immutable form of one function (or of the top-level code. It consists of:

- a **name** and a small fixed header: parameter counts, flags, stack size and number of upvalues;
- the **instruction array**, the bytecode described in _Instruction Set_;
- a table of **upvalue descriptors** that tell the VM what each closure created from this prototype captures;
- a **constant pool** of numbers, strings and the prototypes of nested functions;
- optionally, **line information** that maps instructions to source lines

At runtime, a prototype is wrapped in a _closure_ by the `CLOSURE` instruction (or, for the main function, by the loader) together with its captured upvalues. The prototype itself is shared by all closures created from it.

Nested functions appear in the parent's constant pool as references to their prototypes and are instantiated with `CLOSURE K`. Because the nested prototype is serialized before the parent, the dump contains no function references at all; the loader resolves them implicitly (see _Binary Encoding_).

### Modules

Every chunk is loaded into a **module**, which owns the module-level variables and, when the chunk is run, the exports published with `DEFMODULE`. The module is identified by the _chunk name_ given to the loader; it is not stored in the dump. What the dump does store is the module's variable names, in slot order. When a dump is loaded, the module's variable table is **replaced** by one in the dump, and every variable starts as `nil`.

Chunk names beginning with `<`, `?` or `=` denote synthetic sources (for example `=<stdin>` or `?<eval>`); for them the module path defaults to `.`. For any other name, the module path is derived from the directory of the name, and relative imports are resolved against it.

### Producing and Loading Chunks

The C API exposes bytecode through a pair of functions that mirror each other: a _writer_ callback consumes the dump and a _reader_ callback supplies it.

**Dumping**. `tea_dump(T, writer, data)` serializes the function at the top of the stack, together with its module. The value must be a Teascript function; for anything else the call fails with `TEA_ERROR_SYNTAX`. The writer is invoked several times (once for the header, once for the module section, once per prototype and once for the footer) and may abort the dump by returning non-zero status, which is then returned by `tea_dump`.

```c
static int writer(tea_State* T, void* ud, const void* p, size_t sz)
{
    UNUSED(T);
    return fwrite(p, 1, sz, (FILE*)ud) == sz ? TEA_OK : TEA_ERROR_FILE;
}

/* The function to dump is on top of the stack */
FILE* fp = fopen("program.tbc", "wb");
int status = tea_dump(T, writer, fp);
fclose(fp);
```

> `tea_dump` currently always produces _unstripped_ dumps. The _stripped_ variant is fully supported by the format and by the loader, but is not yet reachable through the public API.

**Loading**. All of `tea_load`, `tea_loadx`, `tea_load_file`, `tea_load_filex`, `tea_load_buffer` and `tea_load_bufferx` accept either source or bytecode. On success the loaded function is pushed on the stack, ready to be called; on failure an error status is returned. The `x` variants take a **mode string** that restricts which kind of chunk is acceptable:

| Mode | Accepts |
|------|---------|
| `"t"` | text (source) chunks only |
| `"b"` | binary (bytecode) chunks only |
| `"bt"` or `NULL` | either |

A chunk of a kind the mode does not allow is rejected with a syntax error. `tea_eval`, which compiles and runs a string, always uses mode `"t"`.

```c
/* Load a previously dumped chunk; refuse source text */
int status = tea_load_filex(T, "program.tbc", NULL, "b");
if(status == TEA_OK)
    tea_call(T, 0);
```

### Loading Errors

Bytecode that cannot be loaded is reported through the usual syntax error mechanism, with the chunk name as prefix. Three conditions are distinguished:

| Condition | Meaning |
| --- | --- |
| _Bad mode_ | The chunk kind (text or binary) is not permitted by the mode string |
| _Bad format_ | The signature, or the version byte, is wrong |
| _Corrupt_ | The stream is truncated, a size field is inconsistent, or the prototype stack does not balance |

## From Source to Execution

The pieces described in this part fit together in the following life cycle of a program:

```
 source text                                   bytecode file
     |                                          (dump format)
     v                                               ^   |
  [ parser / compiler ]                    tea_dump  |   |  tea_load*
     |                                               |   v
     +------------>  function prototypes  <-----------[ bytecode reader ]
                     (code, constants,
                      upvalue descriptors)
                            |
                            v
                  main function wrapped in a closure
                            |
                            v
                  [ VM dispatch loop ]  <-- instruction set
```

1. **Compilation**. The parser translates source text into one prototype per function, plus one for the top-level code of the module. This is where opcodes, constants, upvalue descriptors and the module variable table are produced.
2. **Serialization (optional)**. `tea_dump` writes the prototypes in the dump format. The result can be stored and later loaded without running the compiler (and parser) again.
3. **Loading**. Both paths, compiling source and reading a dump, end the same way; the main prototype is wrapped in a closure and left on the stack as a callable function. From this point on, the VM cannot tell which path was taken.
4. **Execution**. Calling the function pushes a frame and starts the dispatch loop, which fetches one opcode at a time and executes it against the evaluation stack. Calling another Teascript function pushes a new frame; `RETURN` pops it. Nested functions are created on demand by `CLOSURE`, each time capturing upvalues according to the descriptors in the prototype.

Because step 3 is shared, a bytecode chunk is not a different kind of program, only a different model of delivering the same prototypes. Everything the VM needs at runtime is either in those prototypes or in the module they are bound to.

### The Execution Model in Brief

A few facts about the VM are needed to read any listing, and they are assumed by the _Instruction Set_ chapter:

- **Stack machine**. Instruction take their inputs from the top of an evaluation stack and leave their results there. Operands in the instruction stream select _which_ slot, constant or name an instruction works on; they rarely carry values themselves.
- **Frames**. Each call has a frame whose slot `0` holds the callee (or the receiver of a method call). Parameters occupy the following slots, then other locals and temporaries. Local variables are addressed by their slot number relative to the frame.
- **Three kinds of variables**. _Locals_ live in the current stack frame; _upvalues_ are locals of enclosing functions captured by closures; _module variables_ belong to the module environment and are visible to every function in it. Globals are a fourth, name-addressed namespace only consulted by `GETGLOBAL`.
- **Constants**. Numbers, strings and nested functions are referenced by index into the prototype's constant pool. The same pool supplies the names used by attribute, method, class and import instructions.
- **Jumps**. Control flow uses relative jumps in the code array, forward for `JMP` and its conditional variants, backward for `LOOP`.

## Inspecting Bytecode

The examples throughout the _Instruction Set_ chapter are written in the format of Teascript's bytecode listing tool. Each line shows one instruction:

```
0004    3 GETLOCAL           1
```

from left to right: the **byte offset** of the instruction within the function's code array, the **source line** (a `|` means "same line as the previous instruction"), the **mnemonic**, and the **operands**. Constant operands are followed by the value of the constant they refer to, and jump instructions show their target offset. The offsets are byte offsets, not instruction numbers, since instructions are one to four bytes long.

When examining a dump produced by someone else, the following checks are usually enough to establish that it is what you expect:
 
- The first six bytes are `1B 54 65 61` (the string `"\033Tea"`), a version byte matching your build, and a flags byte. Bit 1 tells you whether line numbers will be available.
- The last byte of the file is `00`.
- Reading the prototype sizes from the start of the prototype stream, you can hop from record to record: each size prefix tells you how far the next one is. The last record is the main function.

<!--

## Using This Part
 
The remaining chapters are reference material and are meant to be consulted rather than read straight through. Some suggested routes:
 
- **Writing a disassembler or verifier.** Read *Binary Encoding* first to parse the file, then *Instruction Set* for the instruction lengths (the *Instruction Encoding* section and the byte counts in the stack effect table are enough to walk a code array) and for the operand types to validate.
- **Generating bytecode.** Start with *Instruction Set*, in particular *Operand Types and Notation* and the stack effects, then use *Binary Encoding* to wrap the result into a loadable chunk. Compute `max_slots` conservatively from the stack effects and make sure every function ends with `RETURN` and `END`.
- **Caching compiled code in an embedding application.** The *Overview* is enough: dump with `tea_dump`, store the bytes alongside the Teascript version that produced them, and load with mode `"b"`. Recompile from source when the version differs.
- **Debugging the VM or the compiler.** Use the listing format above together with the stack effect table in *Instruction Set* to follow the evaluation stack instruction by instruction.
> **Stability.** The details in this part describe bytecode format version **0**. The bytecode is an implementation detail of Teascript, shared between the compiler, the VM and the dump format, and it can change between releases. Treat anything built directly on it as tied to a specific Teascript version, and consult the *Versioning and Compatibility* section before upgrading.

-->
