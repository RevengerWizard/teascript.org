---
title: Modularity
weight: 150
toc: true
---

Once you start writing programs that are more than little toys, you quickly run into two problems:

1. You want to break them down into multiple smaller files to make it easier to find your way around them.
2. You want to reuse pieces of them across different programs.

To address those, Teascript has a simple module system. A file containing Teascript code defines a *module*. A module can use the code defined in another module by *importing* it. You can break big programs into smaller modules that you import, and you can reuse code by having multiple programs share the use of a single module.

Teascript does not have a single global scope. Instead, each module has its own top-level scope independent of all other modules. This means, for example, that two modules can define a top-level variable with the same name without causing a name collision. Each module is, well, modular.

## Importing, briefly

When you run Teascript and give it a file name to execute, the contents of that file define the "main" module that execution starts at. To load and execute other modules, you use an import statement:

```tea
from "beverages" import Coffee, Tea
```

This finds a module named "beverages" and executes its source code. Then, it looks up two top-level variables, `Coffee` and `Tea` in *that* module and creates new variables in *this* module with their values.

This statement can appear anywhere a variable declaration is allowed, even inside blocks:

```tea
if(thirsty)
{
    from "beverages" import Coffee, Tea
}
```

If you need to import a variable under a different name, you can use `from "..." import Name as OtherName`. This looks up the top-level variable `Name` in *that* module, but declares a variable called `OtherName` in *this* module with its value.

```tea
from "liquids" import Water  // Water is now taken
from "beverages" import Coffee, Water as H2O, Tea
```

If you want to load a module, but not bind any variables from it, you can omit the `import` clause:

```tea
import "some_imperative_code"
```

That's the basic idea. Now let's break it down into each of the steps it performs:

1. Locate the source code for the module.
2. Bind new variables in the importing module to values defined in the imported module.

We'll go through each step:

## Binding variables

Once the module is done executing, the last step is to actually *import* some data from it. Any module can define "top-level" variables. These are simply variables declared outside of any method or function.

These are visible to anything inside the module, but they can also be *exported* and used by other modules. When Teascript executes an import like:

```tea
from "beverages" import Coffee, Tea
```

First it runs the "beverages" module. Then it goes through each of the variable names in the `import` clause. For each one, it looks for a top-level variable with that name in the imported module. If a variable with that name can't be found in the imported module, it's a runtime error.

Otherwise, it gets the current value of the variable and defines a new variable in the importing module with the same name and value. It's worth noting that the importing module gets its *own* variable whose value is a snapshot of the value of the imported variable at the time it was imported. If either module later assigns to that variable, the other won't see it. It's not a "live" connection.

In practice, most top-level variables are only assigned once anyway, so this rarely makes a difference.

## Shared imports

Earlier, I described a program's set of modules as a tree. Of course, it's only a *tree* of modules if there are no *shared imports*. But consider a program like:

```tea
// main.tea
import "a"
import "b"

// a.tea
import "shared"

// b.tea
import "shared"

// shared.tea
print("Shared!")
```

Here, "a" and "b" both want to use "shared". If "shared" defines some top-level state, we only want a single copy of that in memory. To handle this, a module's code is only executed the *first* time it is loaded. After that, importing the module again just looks up the previously loaded module.

Internally, Teascript maintains a map of every module it has previously loaded. When a module is imported, Teascript looks for it in that map first before it calls out to the embedder for its source.

In other words, in that list of steps above, there's an implicit zeroth step: "See if we already loaded the module and reuse it if we did". That means the above program only prints "Shared!" once.

## Cyclic imports

You can even have cycles in your imports, provided you're a bit careful with them. The loading process, in detail, is:

1. See if we have already created a module with the given name.
2. If so, use it.
3. Otherwise, create a new module with the name and store it in the module registry.
4. Create a fiber for it and execute its code.

Note the order of the last two steps. When a module is loaded, it is added to the registry *before* it is executed. This means if an import for that same module is reached while the module itself or one of its imports is executing, it will be found in the registry and the cycle is short-circuited.

For example:

```tea
// main.tea
import "a"

// a.tea
print("start a")
import "b"
print("end a")

// b.tea
print("start b")
import "a"
print("end b")
```

This program runs successfully and prints:

    start a
    start b
    end b
    end a

Where you have to be careful is binding variables. Consider:

```tea
// main.tea
import "a"

// a.tea
from "a" import B
var A = "a variable"

// b.tea
from "a" import A
var B = "b variable"
```

The import of "a" in b.tea will fail here. If you trace the execution, you get:

1. Execute `import "a"` in "main.tea". That suspends "main.tea".
2. Execute `import "b"` in "a.tea". That suspends "a.tea".
3. Execute `import "a"` in "b.tea". Since "a" is already in the module map, this does *not* suspend it.

Instead, we look for a variable named `A` in that module. But it hasn't been defined yet since "a.tea" is still sitting on the `from "b" import B` line before the declaration. To get this to work, you would need to move the variable declaration above the import:

```tea
// main.tea
import "a"

// a.tea
var A = "a variable"
from "b" import B

// b.tea
from "a" import A
var B = "b variable"
```

Now when we run it, we get:

1. Execute `import "a"` in "main.tea". That suspends "main.tea".
2. Define `A` in "a.tea".
2. Execute `import "b"` in "a.tea". That suspends "a.tea".
3. Execute `import "a"` in "b.tea". Since "a" is already in the module map, this does *not* suspend it. It looks up `A`, which has already been defined, and binds it.
4. Define `B` in "b.tea".
5. Complete "b.tea".
6. Look up `B` in "b.tea" and bind it in "a.tea".
7. Resume "a.tea".

This sounds super hairy, but that's because cyclic dependencies are hairy in general. The key point here is that Teascript *can* handle them in the rare cases where you need them.
