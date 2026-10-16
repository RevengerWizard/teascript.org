---
title: Declarations
number: "6."
weight: 605
---

A _declaration_ introduces a name for a variable and, usually, gives it an initial value. This chapter defines the variable declarations `var` and `const`, the scopes in which declared names are visible, and the rules by which a name in an expression is resolved to a variable. It also states the scoping rules that apply to the names introduced by function and class declarations; the rest of those two forms is described in the chapters on functions and on object system.

Names are resolved **at compile-time**. A program that uses a name that no declaration makes visible, or that declares a name twice in the same scope, is rejected before it is run. Statements are described in [Statements](statements.md) and the assignment operators in [Expressions](expressions.md).

## Declarations Overview

The following constructs declare a variable:

| Construct | Declared variable | Mutable |
| --- | --- | --- |
| `var name ...` | `name` | yes |
| `const name ...` | `name` | no |
| `function name(...) { ... }` | `name`, holding the function | yes |
| `class Name ... { ... }` | `Name`, holding the class | yes |
| a parameter of a function | the parameter | yes |
| `for var` / `for const` loop variables | the loop variables | `var`: yes, `const`: no |

A declaration may appear whenever a declaration is allowed. At the top level of a chunk and inside a block (see the grammar in [Statements](statements.md)). The bodies of `if`, loops and `switch` clauses are blocks, so they can contain declarations, and the declared names are local to the block.

A declaration takes effect **when execution reaches it**, not when its scope begins. **Assignment never declares**: `x = 1` always stores into an existing variable and is a compile time error if no variable `x` is visible.

## Variable Declaration

```
variable_declaration ::= ( 'var' | 'const' ) declarators

declarators ::= <name> '=' expression ( ',' <name> '=' expression )*     (* separate initializers *)
              | <name> ( ',' <name> )* ( '=' expression_list )?          (* name list *)
              | rest_list '=' expression                                 (* destructuring with rest *)

rest_list   ::= binding ( ',' binding )+     (* exactly one binding written with '...' *)
binding     ::= '...'? <name>
```

If the first name is directly followed by `=`, the declaration uses the first form, whatever follows; otherwise it is a name list, or, if one of the names is written with `...`, the rest form.

### var and const

`var` declares mutable variables and `const` declares **constants**. Both accept every form of declarator, and `const` makes **every** name of the declaration constant.

```tea
var count = 0
const limit = 100
```

### Initialization

#### Separate Initializers
`var a = 1, b = a + 1` declares and initializes the names one at a time, from left to right. The initializer of a name can use the names declared before it in the same declaration, but not the name being declared; see [Visibility during initialization](#visibility-during-initialization).

#### Name list without initializers
`var a, b, c` declares the variables and sets each to `nil`. A single `var x` therefore declares `x` with the value `nil`.

#### Name list with several expressions
`var a, b = e1, e2` requires exactly as many expressions as names, otherwise the program is rejected at compile time. The expressions are all evaluated, from left to right, **before any of the names are declared**, so none of the new names is visible in them: `var a, b = b, a` reads an outer `a` and an outer `b`.

#### Name list with one expression
`var a, b = e` evaluates `e`, which must produce a **list** with exactly as many elements as there are names; its elements are assigned to the names in order. A value that is not a list, or a list with too many or too few elements, is a runtime error. A single expression always unpacks when more than one name is declared.

### Destructuring with Rest

A declaration of at least two names, one of which is written `...name`, unpacks a list and collects the surplus elements into a new list:

```tea
var first, ...others = [1, 2, 3, 4]    // first is 1, others is [2, 3, 4]
var ...init, last = [1, 2, 3, 4]       // init is [1, 2, 3], last is 4
var head, ...middle, tail = [1, 2, 3]  // middle is [2]
```

- Exactly one name may carry `...`. A rest declaration needs at least one other name
- The value of the expression must be a list. It must contain at least as many elements as there are names, counting the rest name, so the rest list is never empty. Otherwise, a runtime error is raised
- The names before the rest name receive the first elements in order, the names after it receive the last elements in order, and the rest name receives a new list of the elements in between

### Constants

A constant cannot be the target of an assignment of any form: `=`, a compound assignment, or a multiple assignment. Doing so is a **compile-time error**. This also holds for closures that capture the constant.

The restriction is on the _variable_, not on the value: if a constant holds a list, a map or an instance, the object can still be modified, because a constant always refers to the same object but does not make it immutable.

```tea
const items = [1, 2]
items = []          // error: 'items' is a constant
items[0] = 5        // allowed: modifies the list, not the variable
```

A constant declared without an initializer holds `nil` and can never change. Function names and parameters are mutable, and can be re-assigned.

## Scope

The **scope** of a variable is the part of the program in which its name can be used. Scopes are determined by the structure of the source text.

### Kinds of Scope

| Scope | Created by | Variables declared there |
| --- | --- | --- |
| **Module scope** | the top level of a chunk, outside any block | _module variables_; they exist as long as the module and are visible to every function of the module declared after them |
| **Function scope** | a function: its parameters and the declarations at the top level of its body share one scope | locals of the function |
| **Block scope** | each block `{ ... }`, including the bodies of `if`, `switch` clauses and loops | locals of the enclosing function or chunk |
| **Loop scope** | the header of a `for` statement | the loop variables, see [Statements](statements.md) |

Notes:

- A variable declared inside a **block at the top level of a chunk** is a local, not a module variable. It is not visible outside the block, and it cannot be exported
- **Parameters and the top-level declarations of the function body are in the same scope** Declaring a name in the body that is already a parameter is therefore a redeclaration. A parameter's default value can use the parameters that precede it
- A new block scope is created each time the block is _executed_; a variable declared in a loop body is a new variable in every iteration

### Where a Variable is Visible

A variable is visible from the point at which its declaration is **complete** until the end of its scope. Uses of a name must appear **after** the declaration in the source text. There is no hoisting, and a function can only refer to the module variables, functions and classes that are declared **before** the function in the source:

```tea
function f() { return g() }    // error: 'g' is not declared yet
function g() { return 1 }
```

For mutually recursive functions, declare the variable first and assign it later:

```tea
var is_odd  // declared now, holds nil
function is_even(n) { return n == 0 or is_odd(n - 1) }
is_odd = function(n) { return n != 0 and is_even(n - 1) }
```

### Visibility During Initialization

While the initializer of a variable is being evaluated, the variable is _declared but not yet defined_. What an initializer sees depends on the kind of variable:

- A **local variable** is **not visible** in its own initializer, including inside functions created in it. Moreover, the search for the name among the locals of the current function **stops** at the variable being initialized, so an earlier local of the same function with the same name is not found either. The name is then looked up among the variables of enclosing functions, the module variables and the predefined globals; if none of them has it, the name is undefined. A local therefore cannot be recursive when it is initialized with a function expression
- A **module variable** is not visible in its own initializer in top-level code, but **is visible inside functions** defined in the initializer. This permits recursion through a function expression at module level
- The name of a **function declaration** and the name of a **class declaration** are visible inside their own body, so a declared function can call itself and a class can refer to itself in its methods

```tea
var x = 1               // module variable
{
    var x = x + 1       // the initializer reads the module variable; the new x is 2
}

function g()
{
    var y = 1
    {
        var y = y + 1   // error: undefined variable 'y' (the earlier local is not found)
    }
}

var fact = function(n) { return n <= 1 ? 1 : n * fact(n - 1) }   // ok at module level
```

### Redeclaration and Shadowing

Declaring a name that is already declared in the same scope is a compile-time error, whatever the two declarations are (variables, constants, functions, classes and parameters).

Shadowing is permitted. A declaration in an inner scope hides a variable of the same name from an outer scope, for as long as the inner scope lasts. A local can shadow a module variable, a parameter, or a variable of an enclosing function, and a module variable can shadow a predefined global.

```tea
var a = 1
var a = 2               // error: 'a' is already declared in this scope

function f(p)
{
    var p = 0           // error: 'p' is a parameter, which is in the same scope
    {
        var p = 0       // ok: an inner block may shadow the parameter
    }
}
```

### Lifetime

The storage of a local variable ends with its scope, except that a variable **captured by a closure** continues to exist for as long as any closure refers to it, and is shared by those closures; see the chapter on functions. A module variable exists for as long as its module.

## Name Resolution Rules

Each occurrence of a name in an expression is resolved once, **at compile time**, to exactly one variable. The lookup tries the following, in order, and uses the first match:

| Step | Looks in | Notes |
| :---: | --- | --- |
| 1 | The **locals** of the current function | Innermost scope first; this includes parameters |
| 2 | The locals of the **enclosing functions**, nearest first | The variable is captured by reference |
| 3 | The **module variables** of the current module | Only those declared earlier in the source |
| 4 | The **predefined globals** of the environment | Read-only |

If none matches, the program is rejected with a compile-time error _undefined variable_. A name is never looked up while the program runs, and an undefined name does not evaluate to `nil`.

Further rules:

- A variable that is declared but not yet initialized is skipped at steps 1 and 2 and, in top-level code, at step 3, as described in [Visibility during initialization](#visibility-during-initialization)
- **Assignment** uses step 1 to 3 only. Assigning to a name that resolves to a predefined global, or to no variable, is a compile-time error, and so is assigning to a constant
- Because lookup is lexical, a name always denotes the same variable, whenever the function that uses it is declared from
- Only _variable names_ are resolved this way. The name after a dot, `object.name`, the bare names that serve as keys in a map literal, `{name = 1}` and the names of methods are not variable references. They are never resolved to variables
- `self` and `super` are reserved words and are not looked up as variables; see [Expressions](expressions.md)

```tea
var scale = 10                  // module variable

function make(base) // 'base' is a local of make
{
    var offset = 5
    return function(x) {        // x: local; base, offset: captured; scale: module
        return (x + base + offset) * scale
    }
}
```

## Exporting Declarations

A declaration at the top level of a module can be exported by prefixing it with `export`:

```
export_declaration ::= 'export' ( variable_declaration | function_declaration | class_declaration )
```

`export` takes effect only for a declaration in a **module scope**, since only module variables can be exported. It is allowed only in the main body of a chunk, not in a function. The for `export {a, b}`, which exports module variables that have already been declared, and the semantics of what is exported, are described in the chapter on modules under [Module](type-system.md#module).
