---
title: Source Layout
number: "2."
weight: 1800
---

The reference implementation of Teascript is written in C and lives in a single flat source directory `/src`. This chapter is a map of that directory. What each file contains, how the files group into layers, and the conventions that make a file's role recognizable from its name, its first lines and the identifiers if defines.

Subsequent chapters of this part describe the components in detail; this one only tells you where to look.

## Source Tree Overview

```
src/
├── lib_base.c           ← Teascript base classes and functions
├── lib_buffer.c         ← Buffer class
├── lib_debug.c          ← Teascript debug module
├── lib_io.c             ← Teascript io module
├── lib_list.c           ← Teascript List class
├── lib_map.c            ← Teascript Map class
├── lib_math.c           ← Teascript math module
├── lib_os.c             ← Teascript os module
├── lib_random.c         ← Teascript random module
├── lib_range.c          ← Teascript Range class
├── lib_string.c         ← Teascript String class
├── lib_sys.c            ← Teascript sys module
├── lib_time.c           ← Teascript time module
├── lib_utf8.c           ← Teascript UTF-8 module
├── onetea.c             ← Teascript core, libraries and interpreter in a single file
├── tea.c                ← Teascript standalone interpreter
├── tea_api.c            ← Public Teascript C API
├── tea_arch.h           ← Target architecture selection
├── tea_assert.c         ← Internal assertions
├── tea_bc.c/h           ← Bytecode instructions
├── tea_bcdump.h         ← Bytecode dump definitions
├── tea_bcread.c         ← Teascript bytecode reader
├── tea_bcwrite.c        ← Teascript bytecode writer
├── tea_buf.c/h          ← Buffer handling
├── tea_char.c/h         ← Character types
├── tea_debug.c          ← Debugging and introspection
├── tea_debug.h          ← Teascript debug functions
├── tea_def.h            ← Teascript common internal definitions
├── tea_err.c/h          ← Error handling
├── tea_errmsg.h         ← VM error messages
├── tea_func.c/h         ← Function handling (prototypes, functions and upvalues)
├── tea_gc.c/h           ← Garbage collector
├── tea.h                ← Teascript C API
├── tea_import.c/h       ← Import loader
├── tea_lex.c/h          ← Lexical analyzer
├── tea_lib.c/h          ← Library function support
├── tea_list.c/h         ← List handling
├── tea_load.c           ← Load and dump code from strings and files
├── tea_map.c/h          ← Map handling
├── tea_meta.c/h         ← Method handling
├── tea_obj.c            ← Teascript values and objects
├── tea_obj.h            ← Teascript VM tags, values and objects
├── tea_parse.c/h        ← Teascript parser (source code -> bytecode)
├── tea_prng.c/h         ← Pseudo-random number generation
├── tea_state.c          ← Teascript global state
├── tea_state.h          ← State and stack handling
├── tea_str.c/h          ← String handling
├── tea_strfmt.c/h       ← String formatting
├── tea_strfmt_num.c     ← String formatting for floating-point numbers
├── tea_strscan.c/h      ← String scanning
├── tea_tab.c/h          ← Hash table handling
├── tea_udata.c/h        ← Userdata handling
├── tea_vm.c/h           ← Teascript virtual machine
├── teaconf.h            ← Configuration header
└── tealib.h             ← Standard library header
```

A name written `x.c/h` stands for two files, `x.c` and `x.h`. The tree contains C sources only; the bytecode tool behind `tea -b` for example is written in Teascript (see The tea Program) and is not part of it.

### File Groups

The files fall into the following groups. Files within a group depend on each other closely; dependencies between groups mostly go from the top of this table to the bottom.

### Public Interface

`tea.h` is the only header an embedder needs for the language and API proper. It declares the opaque `tea_State`, the status codes, the value types and the API functions, all marked with `TEA_API`. `tealib.h` is the standard library header, and `teaconf.h` holds the configuration macros that they include. `tea_api` implements the functions declared in `tea.h`, which makes it the boundary between the stable interface and the internal representation.

The standalone interpreter `tea.c` is written against this interface; it is the reference example of an embedding application.

### Internal Headers

Every internal source file ultimately includes `tea_def.h`, which defines common types and attribute macros (`TEA_FUNC`, `TEA_DATA`, `TEA_FASTCALL`, `TEA_NOINLINE`, `TEA_AINLINE`, `TEA_LIKELY` and the like). `tea_obj.h` defines the tagged value, every object structure, the call-info record and the interpreter state itself (`struct tea_State`), so most other headers include it, directly or through a neighbour. Because the state structure is defined there, `tea_state.h` is limited to the functions that manage it and its stacks.

`tea_arch.h` selects the target and defines the various target architecture macros, such as `TEA_TARGET_POSIX` and `TEA_TARGET_WINDOWS` macros; code that depends on the platform tests those macros.

### Single-file Build

`onetea.c` brings the core, the standard library and the interpreter together in one source file, so that the implementation can be compiled as a single translation unit.

## Conventions

### File Preamble

Each source file opens with a comment naming the file and its purpose:

```c
/*
** tea_vm.c
** Teascript virtual machine
*/
```

Core `.c` files then define two macros before including any header. A macro named after the file (`tea_vm_c`, `tea_gc_c`, `tea_err_c`, ...) and `TEA_CORE`. The first lets a header tell which translation unit is including it; `TEA_CORE` distinguishes code that belongs to the implementation from client code such as `tea.c`.

Headers use an include guard of the form `_TEA_<NAME>_H`.

### Naming

| Kind | Convention | Examples |
| --- | --- | --- |
| Public API function | `tea_<verb>_<noun>`, declared with `TEA_API` | `tea_push_string`, `tea_load_file` |
| Public constant or type | `TEA_` or `tea_` prefix | `TEA_OK`, `TEA_TYPE_LIST`, `tea_State` |
| Internal function shared between files | `tea_<module>_<name>`, declared with `TEA_FUNC` | `tea_vm_call`, `tea_gc_collect`, `tea_func_closeuv` |
| File-local function | `<module>_<name>`, `static` | `vm_call`, `gc_markobj`, `func_newuv` |
| Internal object type | `GC<name>`; `GCobj` is the union of all of them | `GCstr`, `GCfunc`, `GCmodule` |
| Value accessors | `<name>V` to read, `set<name>V` to write, `tvis<name>` to test, `gco2<name>` to cast | `strV`, `setlistV`, `tvisnum`, `gco2class` |
| Bytecode, token, call-state and special-method identifiers | `BC_`, `TK_`, `CIST_`, `MM_` prefixes | `BC_CALL`, `TK_name`, `CIST_REENTRY`, `MM_PLUS` |

A module's name is part of the file name after `tea_` (`vm`, `gc`, `err`, `str`, ...), and the same word prefixes its functions. The library files use their own prefix per file (`lib_` in the file name).

### Generated Tables

Several tables are written once as X-macros and expanded whenever a parallel list is needed, so that they cannot drift apart:

| Table | Defined in | Expanded for |
| --- | --- | --- |
| `BCDEF` | `tea_bc.h` | The opcode enumeration, opcode names, and the computed-goto dispatch table of `tea_vm.c` |
| `TKDEF` | `tea_lex.h` | Token enumeration and token names; keywords come first, which is how the lexer recognizes reserved words |
| `MMDEF` | `tea_obj.h` | The special-method identifiers (`MM_*`) and their names |
| `ERRDEF` | `tea_errmsg.h` | The error message texts (`tea_err.c` concatenates them into one string) and, by the same list, the `TEA_ERR_*` identifiers |

`tea_errmsg.h` has no include guard on purpose, since it is included more than once, each time with a different definition of `ERRDEF`.
