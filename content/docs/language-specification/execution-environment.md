---
title: Execution Environment
number: "11."
weight: 1100
---

The _execution environment_ is everything that a program can use without declaring or importing it. This chapter defines the part of it that belongs to the language, the global environment, the set of names that every module can refer to.

Standard modules are brought into a program with `import` (see [Module System](../module-system)) and are not part of the global environment.

## The Global Environment

The **global environment** is a set of predefined names, each with a value, that is shared by **every module** of a program. It is established before the program starts and contains functions and classes of the base library, described below.

### Rules of Global Names

- Globals are **read-only**. A program can read a global but cannot assign to it, and cannot create, remove or replace one. An assignment, compound assignment or multiple assignment whose target resolves to a global is a compile-time error (see [Assignment](../expressions#assignment)).
- Globals are resolved at **compile-time**, as the last step of name lookup. A name is a global only if no local, captured or module variable has that name (see [Name Resolution Rules](../declarations#name-resolution-rules)). A name that is not a variable and not a global is a compile-time error.
- Globals can be **shadowed**. Declaring a variable with the same name as a global, at any scope, hides the global within that scope. `var print = 1` makes `print` mean `1` in the declaring scope, without any effect on other modules. See [Redeclaration and shadowing](../declarations#redeclaration-and-shadowing).
- Globals are **not** reserved words. They can be used as attribute names and as the names of parameters and variables.

The values of globals are ordinary values, so a global function can be passed to other functions, stored in a list, and so on.

### Predefined Functions

### Predefined Classes
