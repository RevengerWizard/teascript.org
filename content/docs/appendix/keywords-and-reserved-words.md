---
title: Keywords and Reserved Words
number: C.
weight: 300
---

This appendix lists the words that have a fixed meaning in Teascript. The lexical rules for them are given in [Lexical Structure](lexical-structure.md#keywords-and-reserved-words); here every word is listed with its role and the chapter that defines it.

## Reserved Words

Teascript has **32 reserved words**. They are written in lower case, are case-sensitive (`While` is an ordinary identifier), and cannot be used as identifiers. Not as the name of a variable, constant, function, class, parameter or imported name, nor as an attribute name that is written after a dot with one exception (see [Reserved words after a dot](#reserved-words-after-a-dot)).

| Word | Role | Defined in |
| :---: | --- | --- |
| `and` | logical AND, short-circuit | [Logical](expressions.md#logical) |
| `as` | alias an imported module or value | [Import Semantics](module-system.md#import-semantics) |
| `break` | ends innermost loop | [break](statements.md#break) |
| `case` | clause of `switch` | [switch](statements.md#switch) |
| `class` | class declaration | [Class Definition and Instantiation](object-system.md#class-definition-and-instantiation) |
| `const` | declare constants | [Constants](declarations.md#constants) |
| `continue` | proceed to the next iteration of the innermost loop | [continue](statements.md#continue) |
| `default` | fallback clause of `switch` | [switch](statements.md#switch) |
| `do` | begins `do { ... } while` loop | [while / do](statements.md#while--do) |
| `else` | alternative branch of `if` | [if / else](statements.md#if--else) |
| `export` | makes a module-level declaration or variable available to importers | [Exports](module-system.md#exports) |
| `false` | boolean value false | [Boolean](type-system.md#boolean) |
| `for` | loops | [Generic for](statements.md#generic-for), [Iterative for](statements.md#iterative-for) |
| `from` | `from module import ...` | [Import Semantics](module-system.md#import-semantics) |
| `function` | function declaration, expression, method | [Functions](functions.md#definition-and-calling-convention) |
| `if` | conditional statement | [if / else](statements.md#if--else) |
| `import` | load a module | [Import Semantics](module-system.md#import-semantics) |
| `in` | membership operator, used in iterative `for` | [Comparison](expressions.md#comparison), [Generic for](statements.md#generic-for) |
| `is` | class membership test | [Identity](expressions.md#identity) |
| `new` | class constructor | [Instantiation](object-system.md#instantiation) |
| `nil` | absent value | [Nil](type-system.md#nil) |
| `not` | logical negation; `not in`, `is not` | [Logical](expressions.md#logical) |
| `operator` | operator method | [Operator Overload Dispatch Table](object-system.md#operator-overload-dispatch-table) |
| `or` | logical OR, short-circuit | [Logical](expressions.md#logical) |
| `return` | end enclosing function | [return](statements.md#return) |
| `self` | method receiver | [Self and Super](expressions.md#self-and-super) |
| `static` | static method | [Class Definition and Instantiation](object-system.md#class-definition-and-instantiation) |
| `super` | refer to superclass | [Self and Super](expressions.md#self-and-super) |
| `switch` | multi-way selection by equality | [switch](statements.md#switch) |
| `true` | boolean value true | [Boolean](type-system.md#boolean) |
| `var` | declare variable | [Variable Declaration](declarations.md#variable-declaration) |
| `while` | loops | [while / do](statements.md#while--do) |

### Groups

| Group | Words |
| --- | --- |
| Values | `nil` `true` `false` |
| Declarations | `var` `const` `function` `class` `static` `operator` `new` |
| Conditionals | `if` `else` `switch` `case` `default` |
| Loops & Jumps | `for` `while` `do` `in` `break` `continue` `return` |
| Operators | `and` `or` `not` `is` `in` |
| Objects | `self` `super` `new` |
| Modules | `import` `from` `as` `export` |

### Multi-role Words

| Word | Roles |
| --- | --- |
| `in` | the membership operator (`x in list`) and the separator of a generic `for` (`for var x in list`) |
| `not` | the prefix operator, and the first word of `not in` |
| `is` | the class test, and the first word of `is not` |
| `new` | the constructor declaration in a class body, and the member name in `Class.new(...)` |
| `function` | a declaration, an expression, and a method declaration in a class body |

### Context-sensitive Words

Every reserved word is reserved **everywhere**; the following are, in addition, meaningful only in some places, and are rejected elsewhere:

| Word | Valid in |
| --- | --- |
| `static`, `operator` | the body of a class |
| `self` | methods, constructors, accessors, and the `[]` and `[]=` operators of a class |
| `super` | the body of a class declared with a superclass |
| `new` | follows a dot; `Point.new(1, 2)` |
| `case`, `default` | a `switch` statement |
| `break`, `continue` | the body of a loop |
| `return` | the body of a function |
| `export` | the main body of a module |

## Not Reserved Words

The following words may look like keywords but are **ordinary identifiers**.

#### Special Method Names
`getattr`, `setattr`, `call`, `iter`, `contains`, `tostring` and `gc` are recognized by the runtime only because a class defines a method with that name (see [Special Methods](object-system.md#special-methods)). They can be used as variable names, parameter names and attribute names like any other identifier.

#### Predefined Globals
The base library defines a set of names that are available in every module. They are not reserved: they are ordinary variables of the global environment that can be read but not assigned, and any scope can **shadow** one by declaring a variable of the same name (see [Declarations](declarations.md#redeclaration-and-shadowing)).

| Kind | Names |
| --- | --- |
| Functions | `print` `input` `assert` `error` `typeof` `tonumber` `tostring` `gc` `eval` `dump` `loadfile` `loadstring` `pcall` `rawequal` `hasattr` `getattr` `setattr` `delattr` |
| Classes | `Object` `Number` `Bool` `Function`, and the classes of the other built-in types |

The names of the standard modules (`math`, `os`, `io` and others) are not variables and are not reserved either: they are logical module names used by `import` (see [Search Path Resolution](module-system.md#search-path-resolution)).

## Symbols

Some character sequences used in other languages are **not** tokens of Teascript and are scanned as separate tokens or rejected: `++`, `--`, `&&`, `||`, `===`, `!==`, `??`, `->`, `::` and `@`. In particular, logical operators are the words `and`, `or` and `not` (and `!` as a spelling of `not`), and in a slice `x[a::c]` the two colons are two separate `:` tokens.
