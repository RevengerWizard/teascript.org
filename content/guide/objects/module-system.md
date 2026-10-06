---
title: The Module System
number: 8.
weight: 2300
---

As programs grow, keeping everything constrained into a single file may stop to being practical. Teascript lets you split code across files and share it between them through **modules**.

A module is simply a Teascript source file. When one file imports another, the imported file is run, and the importing file gets access to whatever that module chose to share.

## Exporting

Every variable declared at the top level of a Teascript module is actually **private** by default. Other files cannot actually see them, which means you are free to use helper variables and functions without worrying about name clashes or accidentally exposing internals.

To make something available to other modules, aka _public_, mark it with `export`. The simplest way is to put `export` in front of a chosen declaration:

```tea
// geometry.tea
const PI = 3.14159

export function area(radius)
{
    return PI * radius * radius
}

export var unit = "cm"
```

Here only `area` and `unit` are visible to importers, while `PI` stays private to the module. Any kind of declaration can be exported this way, including `var`, `const`, functions and classes.

Alternatively, you can declare everything normally and list the public names in one place with `export { ... }`:

```tea
// geometry.tea
const PI = 3.14159

function area(radius)
{
    return PI * radius * radius
}

var unit = "cm"

export { area, unit }
```

Both forms are actually equivalent, so pick whichever reads best. The list form has the advantage of showing a module's whole public surface at a glance. Granted, you can still use multiple such exports in the same file.

## Importing

There are two kinds of `import` statements, and the difference is what follows the keyword.

### Importing a File

When the import is followed by a **string**, Teascript treats it as a path to a file, relative to the current one. It uses the usual path syntax, but you just leave out the file extension.

```tea
import "geometry"
 
print(geometry.area(2))
```

The module is bound to a variable, and you reach its exported names through it. Notice how the path string itself uses `"geometry"`, and not `"geometry.tea"`. This is also one of the reason it is recommended to use `.tea` as the file extension of a Teascript file. Paths can point into folders, can have duplicates `/`, and can go up one level with `..`:

```tea
import "utils/strings"
import "../shared/config"
```

A file is only run the first one it is imported. If several files import the same modules, they all share the instance.

### Importing a Standard Module

When the import is followed by a plain **name**, Teascript looks for a module of that name that ships built-in with the language:

```tea
import math

print(math.sqrt(16))
```

Built-in modules such as `math`, `io` or `os` are looked up first. If there is no built-in with that name, the search continues through the other standard modules available to the interpreter.

You will see this form of import being used for everything in the [Standard Library](/guide/standard-library/core-functions).

### Importing Specific Names

Sometimes you only want a few things from a module and would rather not type the module name every time. The `from` from imports names directly into the current file:

```tea
from math import sqrt, floor
from "geometry" import area, unit
 
print(sqrt(16))
print(area(2), unit)
```

Both kinds of module naturally work with `from`: a plain name for standard modules, and a string for files. Only exported names can be imported, and asking for one that does not exist, or results private, will lead to an error.

## The Search Path

The two forms of `import` may appear similar. However, they look up to different places, and it is worth keeping the distinction in mind:

- `import "path"` looks **relative to the file doing the importing**. It never searches anywhere else.
- `import name` looks for built-in modules first, and then in the interpreter's module directories.

Those directories are three **search paths**:

| Path      | Contents                                                                 |
| --------- | ------------------------------------------------------------------------ |
| `lib`     | Standard modules that ship with the interpreter                          |
| `package` | Installed packages                                                       |
| `script`  | Modules used by the `tea` program itself, for options like dumping bytecode |

They are searched in that order, and the first match wins. As a user of the language, you will rarely need to think about them; if you wrote a module, import it by path; if it comes with Teascript, import it by name.

## Putting it Together

A small program split over three files shows the pieces working together:
 
```tea
// shapes/circle.tea
import math
 
const PI = math.pi
 
export function area(r) {
    return PI * r * r
}
```
 
```tea
// shapes/square.tea
export function area(side) {
    return side * side
}
```
 
```tea
// main.tea
import "shapes/circle"
import "shapes/square"
 
print(circle.area(1))
print(square.area(3))
```
 
```console
$ tea main.tea
3.1415926535898
9
```

Each file has its own private scope, so the two `area` functions will never collide; they are reached as `circle.tea` and `square.tea`.

## What's next

This chapter covered everything you need for scripts and applications written in Teascript. A few topics are deliberately left to the reference documentation:

- the exact order and rules of path resolution
- how module caching behaves, and what happens with circular imports
- writing modules in C that can be imported like any other, which is covered from the embedding side in [Part III](/guide/embedding/calling-c-from-teascript)
With modules in hand, you are ready for [Object-Oriented Programming](/guide/objects/object-oriented-programming).