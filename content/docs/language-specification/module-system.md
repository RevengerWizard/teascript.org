---
title: Module System
number: "9."
weight: 900
---

A Teascript program is made of _modules_. A module is one unit of source code (usually a file) together with its top-level variables and its **exports**, the values that it makes available to other modules. A module is executed **once**, the first time it is imported, and the result is shared by every later import.

This chapter defines the forms of `import`, `from` and `export`, the way an imported module is located, the treatment of circular imports, and the caching of modules. The module value itself is described in [Type System](../type-system#module), and the declaration of the names that imports introduce in [Declarations](../declarations). The locations of the library directories and the loading of native extension modules are implementation-defined and are described in the Implementation part of this documentation.

## Import Semantics

### Statements

```
import_statement ::= 'import' logical_import ( ',' logical_import )*
                   | 'import' path_import ( ',' path_import )*
 
logical_import  ::= <name> ( 'as' <name> )?
path_import     ::= path ( 'as' <name> )?
 
from_statement  ::= 'from' module_ref 'import' import_item ( ',' import_item )*
import_item     ::= <name> ( 'as' <name> )?
module_ref      ::= <name> | path
 
path            ::= <string> | interpolated_string
 
export_statement ::= 'export' ( variable_declaration | function_declaration | class_declaration )
                   | 'export' '{' <name> ( ',' <name> )* '}'
```

There are two way to name the module to import:

- A **logical name**, written as an indentifier: `import math`. The name refers to a module of the language's libraries and is resolved as described in [Search Path Resolution](#search-path-resolution).
- A **path**, written as a string: `import "util"`. The path is interpreted relative to the directory of the module that contains the statement. A path may be an interpolated string (see [String Literals](../lexical-structure#string-literals)), in which case it is built when the statement is executed.

### Execution

`import` and `from` are statements that are executed when control reaches them, like any other statement; they may appear at the top level of a module, inside a block, or in a function. Executing one proceeds in this order, for each module named in it:

1. The module is located and, unless it has already been loaded. When loading, its source is compiled and its top-level code is executed (see [Module Caching](#module-caching)).
2. The requested names are bound to variables of the importing scope.

A syntax error in the module raises an error at the import statement, and so does any runtime error in its top-level code; see [Error Model](../error-model). A module that cannot be found is a runtime error that names it.

### Forms and Binds

| Statement | Binds |
| --- | --- |
| `import name` | the variable `name`, holding the **module** |
| `import name as alias` | the variable `alias`, holding the module |
| `import "path" as alias` | the variable `alias`, holding the module |
| `import "path"` | nothing: the module is loaded and executed, and no name is introduced |
| `from module import a, b as c` | the variables `a` and `c`, holding the **values** exported by the module as `a` and `b` |

Several modules may be imported by one statement, separated by commas `import math, os as system`. The `from` forms accepts a logical name or a path after `from`.

The bound names are ordinary variables, declared in the scope of the statement, and the rules of [Declarations](../declarations) apply: it is a compile-time error to bind a name that is already declared in the same scope. They are mutable; assigning to one changes only that variable.

#### Accessing a Module

A variable that holds a module gives access to its exports by name: `math.sqrt` reads the export `sqrt`, and `math.sqrt(2)` calls it. Only exported names are accessible; a name that is not exported is a runtime error.

```tea
import math
import "util/strings" as strings

print(math.sqrt(16))
print(strings.trim("  x  "))
```

#### from import

The listed names must be exports of the module, otherwise a runtime error is raised. The imported value is **copied** into the new variable when the statement executes. Later changes made by the module to its own variables are not seen, and reassigning the imported variable does not affect the module. When the value is an object (a list, a map, an instance), both sides refer to the **same object**, as everywhere in the language.

### Exports

A module chooses what it exports with `export`, which is permitted only in the main body of a module (not inside a function):

- `export` before a declaration `export var x = 1`, `export function f() { }`, `export class C { }` declares the name as usual and exports it under the same name. The prefix is effective only for declarations at the top level of the module, since only top-level variables are exported.
- `export {a, b}` exports module-level variables that have **already been declared**; each name must be a variable of the module, which includes names introduced by imports, so a module can re-export what it imported. Naming anything else is a compile-time error.

The value is stored in the module's exports when the `export` is executed, and it is not updated by later assignments to the variable. A name exported twice keeps the last value. The exports of a module therefore grows as its top-level code runs.

## Search Path Resolution

### Logical Names

For `import name` and `from name import ...`, the module is looked up as follows, and the first step that succeeds decides:

1. If a module with this name **has already been loaded**, it is used
2. If `name` is the name of a **built-in module**, that module is created and used. The built-in modules are described with the standard modules of the language
3. Otherwise the module is searched for in the **library directories**, in this order: `script`, `lib`, `package`. In each directory the candidates of the [candidate table](#candidates) are tried with `name` as the base name. The locations of these directories are implementation-defined.
4. If nothing is found, a runtime error is raised

A logical name is **never** resolved relative to the importing module. To import a file that is part of the program, use a path.

### Paths

For `import "path"` and `from "path" import ...` the base name is `path`, and the search directory is the **directory of the importing module**; a path is always interpreted relative to that directory, and may contain subdirectories and `..` (`"../shared/util"`).

The resolution of a path import has the following steps:

1. If the module `sys` has been loaded and its variable `loaders` is a list, the **custom loaders** are tried. Each element of the list that is a function is called, in order, with the path as a string. A loader returns `nil` to decline; the first value that is not `nil` that a loader returns is taken to be the imported module, and no further step is performed.
2. The candidates of the [candidate table](#candidates) are tried with `path` as the base name.
3. If no candidate exists, a runtime error is raised that names the path.

Custom loaders are consulted for paths only, never for logical names.

### Candidates

For a given base name and directory, the following candidate files are tried **in this order**, and the first that exists and is readable is used:

| Order | Candidate | Contents |
| :---: | --- | --- |
| 1 | `base.tea` | Teascript source |
| 2 | `base.tbc` | precompiled Teascript code |
| 3 | `base` with the platform's shared-library prefix | a native extension module |
| 4 | `base/init.tea` | Teascript source: a _package_, a directory that is imported by its name |

A source module and package of the same name therefore resolves to the source file. Native extension modules can only be loaded through a logical name; a path import that resolves to a shared library is an error.

The candidate that is found is turned into a **canonical absolute path** (relative components are resolved, and on systems that have symbolic links these are followed). The canonical path identifies the module in the cache.

## Circular Imports

Circular imports are **permitted**. A module is entered into the module cache **before** its top-level code starts to run (see [Module Caching](#module-caching)), so if module `a` imports module `b` and `b`, while running, imports `a`, the second import finds `a` already in the cache and returns it immediately. Neither import loops, and no error is raised.

The module that `b` obtains is **partially initialized**. Only the code of `a` that precedes its `import "b"` has run, so only the exports that `a` has defined up to that point exist. Consequently:

- `import "a" as a` in `b` always succeeds, and `a.name` can be used later, once `a` has finished, because the module value is shared and its exports are completed as `a` continues.
- `from "a" import name` in `b` succeeds only if `a` has **already executed** the export of `name` when it imported `b`; otherwise it is a runtime error for a missing export.

A program that has to be loadable in either order should place its `export` statement before its imports, or import the module as a whole and use the names at call time rather than at load time:

```tea
// a.tea
export function ping(n) { return n }      // exported before the import below
import "b" as b
```

```teascript
// b.tea
from "a" import ping                      // works: a has already exported ping
```

## Module Caching

Every module is loaded **at most once** for the lifetime of the program. The **module cache** maps a module's identity to the module value:

| Module | Identity |
| --- | --- |
| built-in or native extension module | its name |
| module loaded from a file | the canonical absolute path of the file |

When an import resolves to a module that is in the cache, the cached module is used and its code is not run again. Because file modules are identified by their canonical path, two imports that reach the same file by different spellings `"util"`, `"./util"`, `"../src/util"` yield the **same module value**, and a module imported from several places is shared by all of them: they see the same variables, the same exports, and the same objects.

A module that is loaded for the first time is processed in this order:

1. A new module is created and entered into the cache under its identity.
2. The module's directory is recorded, to be used for its own path imports.
3. The source is compiled; a syntax error is raised as an error.
4. The top-level code is executed.

Two points follow from this order:

- **The module is cached before it runs**, which makes circular imports possible.
- **A module whose loading fails stays in the cache.** If the compilation or the top-level code raises an error, the module is not removed. A later import of the same module returns the module as it was left, **without running its code again and without an error**; its exports are those that had been defined when the error occurred. A program that catches the error of a failed import (see [Protected Execution](../error-model#protected-execution)) should therefore not import the module again expecting a second attempt.
No import form reloads a module.
