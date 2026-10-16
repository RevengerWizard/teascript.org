---
title: Type System
number: "3."
weight: 400
---

This chapter defines the types of values that a Teascript program can manipulate, and for each type its representation, its truth value, its equality, and the operations the language itself defines on it. Operations that are provided by the standard library rather than by the language are outside the scope of this chapter.

Teascript is **dynamically typed**; variables, parameters, list elements and map entries have no declared type, and every _value_ carries its type with it. The type of a value is fixed for the lifetime of the value. No implicit conversion between types takes place, except where this chapter says so explicitly.

## Type System Overview

### Types

Teascript has 14 types of first-class values. The names in the second column are names used in diagnostics.

| Type | Name in diagnostics | Category | Defined in |
| --- | --- | --- | --- |
| Nil | `nil` | Value | [Nil](#nil) |
| Boolean | `bool` | Value | [Boolean](#boolean) |
| Number | `number` | Value | [Number](#number) |
| Pointer | `pointer` | Value | [Pointer](#pointer) |
| String | `string` | Reference | [String](#string) |
| Range | `range` | Reference | [Range](#range) |
| Function | `function` | Reference | [Function](#function) |
| Bound method | `method` | Reference | [Function](#function) |
| List | `list` | Reference | [List](#list) |
| Map | `map` | Reference | [Map](#map) |
| Class | `class` | Reference | [Class and Instance](#class-and-instance) |
| Instance | `instance` | Reference | [Class and Instance](#class-and-instance) |
| Module | `module` | Reference | [Module](#module) |
| Userdata | `userdata` | Reference | [Userdata](#userdata) |

The implementation has two internal object types, `proto` (compiled function code) and `upvalue` (a captured variable). They are never visible to a program as values and are not described further.

### Value Types and Reference Types

#### Value Types
(`nil`, `bool`, `number`, `pointer`) are stored directly in the variable, parameter, list element or map entry that holds them. Copying such a value copies the value itself.

#### Reference types
Are heap objects managed by the garbage collector. A variable, element or entry holds a _reference_ to the object. Copying it (by assignment, by passing it as an argument, or by storing it in a list) copies the reference, so the copy and the original denote the **same object**. Mutating an object through one reference is observable through every other reference to it. An object is reclaimed when it is no longer reachable from the program.

### Truth Value

Conditions (`if`, `while`, the conditional operator, `and`, `or`, `not` and so on) never require a boolean; every value entailes a **truthy value**. A value is _falsey_ in exactly the following cases; any other value is _truthy_

| Type | Falsy when |
| --- | --- |
| `nil` | always |
| `bool` | the value is `false` |
| `number` | the value equals `0` |
| `string` | the string is empty: the first byte of the string is the NUL byte (`\0`); see [Encoding and Byte Semantics](#encoding-and-byte-semantics) |
| `list` | it has no elements |
| `map` | it has no entries |

Values of the types `pointer`, `range`, `function`, `method`, `class`, `instance`, `module` and `userdata` are always _truthy_.

### Equality

The `==` operator, `switch/case` matching and the comparison of list elements and map values all use the same equality relation. (`switch`/`case` matching never calls operator methods; see below for `==`)

Two values are equal only if they have **the same type**; there is no cross-type equality, so `1 == true`, `0 == nil` and `"1" == 1` are all `false`. For two values of the same type:

| Type | Equal when |
| --- | --- |
| `nil` | always |
| `bool` | both are `true` or both are `false` |
| `number` | the number are equal under IEEE-754 comparison (so `NaN` is not equal to iself, and `0 == -0`)
| `pointer` | the addresses are equal |
| `string` | the byte sequences are identical (equivalent to object identity, see [Interning](#interning)) |
| `range` | `start`, `end` and `step` are all equal |
| `list` | same object, or same length and pairwise equal elements (compared recursively) |
| `map` | same object, or same number of entries and every key of one is present in the other with an equal value (compared recursively) |
| `function`, `method`, `class`, `module` | same object |
| `instance`, `userdata` | same object, unless `==` operator method is defined (see below) |

When either operand of `==` is an `instance` or `userdata`, the operator method `==` is looked up first on the left operand's class and then on the right operand's class. If one is found it is called with the two operands, and **its result is the result of the expression**, uncoerced. If none is found, the comparison is object identity.

`!=` is the logical negation (by truth value) of `==`. Equality of lists and maps is recursive and does not detect cycles; its result is not defined for structures that define themselves.

### Classes of Built-in Types

The types `number`, `bool`, `function`, `string`, `list`, `map` and `range` each have a **built-in class**, and there is a root class from which user-defined classes inherit by default. Methods called on a value of such a type, and operator methods used with it, are looked up in its built-in class. The operator `is` tests class membership; see [Class and Instance](#class-and-instance).

## Nil

`nil` is the type of the single value `nil`, written with the keyword of the same name. It denotes the absence of a meaningful value.

- It is falsy and equal only to itself
- A variable declared without an initializer holds `nil`
- It is the only value of its type

## Boolean

`bool` has two values, `true` and `false`, written with the keywords of the same names. The comparison operators `is`, `in` and `not` produce booleans when applied to operands that the language defines them for. Operator methods defined user classes may produce any value.

A boolean is never equal to a value of another type, and there is no implicit conversion from or to `number`, except in the explicit numeric conversion described under [Number](#number).

## Number

### Representation

`number` is the **only numeric type**. A number is an IEEE 754 **binary64** (double-precision) floating-point value. There is no separate integer type; an integer is a number with no fractional part. Every integer with magnitude up to 2^53 is represented exactly; beyond that, integers are rounded like any other double.

The lexical forms of numeric literal are specified in [Lexical Structure](lexical-structure.md). Integer-form and float-form literals both produce a `number`.

**Numeric conversion**. The runtime provides conversions from value to number. Where it is applied (for example by library functions), it behaves as follows:

| Value | Result |
| --- | --- |
| `nil` | `0` |
| `true` / `false` | `1` / `0` |
| `number` | itself |
| `string` | the number denoted by the string, if the numeric scanner accepts it; otherwise the conversion fails |
| any other type | the conversion fails |

The arithmetic operators of the language do **not** apply this conversion; `1 + "2"` does not evaluate to `3`.

### Arithmetic Semantics

When both operands of a binary arithmetic or comparison operator are numbers, the operation is performed directly in double precision:

| Operator | Result |
|----------|--------|
| `a + b`, `a - b`, `a * b` | IEEE-754 addition, subtraction, multiplication |
| `a / b` | IEEE-754 division; **no error is raised for a zero divisor** |
| `a % b` | The remainder `fmod(a, b)`: it has the **sign of the dividend** `a`, and the magnitude is less than `\|b\|` |
| `a ** b` | `pow(a, b)` |
| `-a` | Negation |
| `a < b`, `a <= b`, `a > b`, `a >= b` | IEEE-754 comparison, producing a `bool`; false if either operand is `NaN` |

The results of overflow, division by zero and invalid operations are the IEEE-754 results described in [NaN and Infinity](#nan-and-infinity); these are not errors. Arithmetic is exact to double precision and subject to the usual rounding.

**Bitwise operators** `&`, `|`, `^`, `~`, `<<` and `>>` operate on **32-bit unsigned integers**:

1. Each operand is converted from `number` to an unsigned 32-bit integer
2. The operation is performed on those integers, with the result reduced modulo 2^32. `>>` is a logical shift (zero-filling), and `~a` is the bitwise complement of the 32 bits
3. The result is converted back to a `number`

Consequently the result is always an integer in the range `0` to `4294967295`, and `~0` is `4294967295`, not `-1`. The conversion in step 1 is only defined for operands that are integers in that range. The behaviour for operands that are negative, fractional, not less than 2^32, infinite or `NaN` is **unspecified** and may differ between platforms, as is the behaviour of a shift whose count is 32 or greater. Programs must not depend on it.

### NaN and Infinity

Teascript has no literal for `NaN` or infinity. They arise from arithmetic:

| Expression | Result |
| --- | --- |
| `x / 0` for finite `x > 0` / `x < 0` | positive / negative infinity |
| `0 / 0`, (infinity - infinity), `0 * infinity` | `NaN` |
| `x % 0`, (infinity) `% x` | `NaN` |
| A finite result too large for a double | positive or negative infinity |

Their behaviour follows IEEE-754:

- `NaN` is not equal to anything, including _itself_; `x == x` is `false` exactly when `x` is `NaN`. Every ordering comparison involving `NaN` is `false`
- `NaN` is _truthy_ (it is not equal to `0`), whereas `0` and `-0` are falsy
- `0` and `-0` are equal
- Positive and negative infinity are ordered as expected, are equal to themselves, and are _truthy_
- `NaN` and infinities used as bitwise operands, or as range bounds that are expanded into a list, fall under the unspecified cases of respective sections. An infinite `end` in a string slice is specified under [String](#string).

## String

### Encoding and Byte Semantics

A string is an **immutable sequence of bytes**. A string carries **no encoding**; the language assigns no meaning to the byte values, and it neither requires nor checks that the contents are valid UTF-8 or any other encoding. Specifically:

- The _length_ of a string is its number of _bytes_
- Any byte value 0 to 255 may occur, including `0` (NUL)
- Operations that decompose a string, such as slicing a string with a range or expanding it into a list, work on _bytes_; expanding `"é"` (the UTF-8 encoding of U+00E9 is two bytes) yields a list of two one-byte strings, neither of which is valid UTF-8 on its own
- Strings written in source are produced by the rules of [Lexical Structure](lexical-structure.md); `\u` and `\U` escapes produce the UTF-8 encoding of a code point

#### Slicing
Slicing a string with a range `start..end` produces a new string of the bytes from index `start` up to but excluding index `end`:

- If `end` is infinite, it is taken as the string's length
- Otherwise `end` is truncated to an integer; if it is greater than the length it is taken as the length, and if it is negative it is taken as the length plus `end`
- If `start` is greater than the resulting `end`, the result is the empty string

**Length and truth value** A string's length is limited by an implementation constant. Creating a non-empty string whose length is not less than that limit raises a runtime error. The empty string is a single shared object.

The truth value of a string is determined by its **first byte**: a string is falsy if its first byte is NUL. For every string that contains no NUL byte this is the same as being empty. A non-empty string that begins with a NUL byte is falsy.

> NOTE: Internally, every string is also followed by a terminating NUL byte which is not counted in its length. This is an implementation detail with no effect on the language, except for the truth-value rule above.

### Interning

All strings are **interned**; within one interpreter state there is at most one string object for any given sequence of bytes. Whenever a string is created, whether from a literal, a concatenation, a slice or a library call, the implementation first looks for an existing string with identical bytes and, if one exists, returns that object instead of allocating a new one.

Consequences:

- Equality of two strings is decided by _object identity_ and is therefore constant-time, and it is exactly equal to equality of their bytes. There is no way to observe two distinct string objects with the same contents
- Strings are immutable, so sharing is not observable
- Creating a string costs time proportional to its length, regardless of whether it already exists; this is, however, an implementation detail

## Range

A range is an immutable triple of numbers `(start, end, step)`. It is created by the range operator:

```tea
a..b        // start = a, end = b, step = 1
a..b..c     // start = a, end = b, step = c
```

All three components must be numbers, otherwise a runtime error is raised. They are stored as given, with no validation; a range with a zero step, a step whose sign contradicts the direction from `start` to `end`, or `NaN` or infinite components can be created.

**Equality** is by components. A range is always **truthy**.

#### Expansion
When a range is expanded into a list (for example by the spread syntax), `start`, `end` and `step` are first **truncated toward zero to 32-bit integers**, and then:

- If the truncated step is `0`, the result is empty
- If it is positive, the elements are `start`, `start + step`, `start + 2 * step`, ... while less than `end`
- If it is negative, they are the same sequence while **greater than** `end`

The end bound is therefore **exclusive**: `1..4` expands to `1, 2, 3`. Because truncation happens first, a fractional step such as `0.5` truncates to `0` and yields the empty list. The result for components outside the range of a 32-bit integer is unspecified. The use of a range as a string slice is described under [String](#string); its use with lists and in `for` loops is described with those constructs.

## Function

A function is a callable object. There are two kinds, which are indistinguishable to the caller:

- Tea functions (closures), created by function declarations and function expressions
- C functions, implemented by the host program or the standard library, called exactly like Tea functions

Every function belongs to the **module** in which it was created, and a Tea function can access the module's variables

#### Closures
A Tea function can refer to local variables of the functions that enclose it. Such a variable is _captured_ by reference; the closure and the enclosing function share the same variable, and a change made through one is seen by the other. When the variable's scope ends, the variable continues to exist for as long as any closure refers to it.

#### Parameters
A function declares a number of required parameters and a number of optional parameters; optional parameters have default values. It may additionally declare a variadic parameter, which receives the surplus arguments as a **list**. A call must supply at least all required parameters, and at most the number of required plus optional parameters, unless the function is variadic, in which case any number of additional arguments is accepted and collected into the variadic parameter's list, which is empty if there are none. Otherwise, a runtime error reports the expected and actual number of arguments. A call, including one that spreads a list into its arguments, passes **at most 255 arguments**; a function declares at most 255 parameters.

#### Calling
The call operator accepts a callee of the following types:

| Callee | Behaviour |
|--------|-----------|
| `function` | Called with the given arguments. |
| `method` (bound method) | Called with its stored receiver as `self` followed by the given arguments. |
| `instance` or `userdata` | If its class defines a `call` method, that method is called; otherwise the call is an error. |
| any other type, including `class` | A runtime error: the value is not callable. Classes are instantiated with `new` (see below). |

A **bound method** is a value that pairs a method with a receiver; it is produced when a method is obtained together with its receiver, for example through `super`. Calling it passes the receiver as `self`.

A function call evaluates to the value of the `return` statement that ends it, or `nil` if the function ends without returning a value.

## List

A list is a **mutable, ordered, growable sequence** of values. Elements may be of any type, and different elements of one list may have different types.

A list is created by a list literal, by spreading, or by library functions. Elements are stored by value (value types) or by reference (reference types), as described in the overview.

- **Truth value:** falsy if the list has no elements
- **Equality:** structural, as given in the overview table. Two distinct lists with equal elements are equal; the comparison is recursive
- **Expansion.** When the spread syntax in a list literal expands a value into list elements, the operand may be a **range** (see [Range](#range)), a **list** (its elements, in order), or a **string** (its bytes, as one-byte strings). Any other type is a runtime error
- A list of lists contains the inner lists themselves, not copies
The semantics of indexing, slicing and mutation operations are those of the list's `[]` and `[]=` operations and library methods

## Map

A map is a **mutable collection of key-value entries** in which each key occurs at most one. Values may be of any type. The implementation marks an unused entry with a `nil` key, so `nil` must not be used as a key.

A map is create by a map literal.

- **Truth value:** falsy if the map has no entries.
- **Equality:** structural: two maps are equal if they have the same number of entries and, for each key of the first, the second has an equal key with an equal value. The order of entries is irrelevant to equality.
- Reference-type keys and values are held by reference.

The operations on maps beyond literals are those of the map's `[]` and `[]=` operations and library methods.

## Class and Instance

A class is an object that defines behaviour shared by its instance. It has:

- a **name**
- an optional **superclass**; a class declared without one inherits from `Object` root class
- a **method table** that maps names to methods, each flagged as an ordinary method, a `static` method, or a getter or setter
- an optional **constructor**, which is the method named `new`

A class is created by a class declaration. It is **not callable**. An instance is created with `Class.new(args...)`:

1. If the class has no constructor (`new` method), a runtime error is raised.
2. If the constructor is a Teascript function, a new instance with an empty attribute table is created and passed to the constructor as `self`, followed by the arguments.
3. If the constructor is a native function, it is called with the class as receiver and is responsible for creating the object.
A Teascript constructor **implicitly returns the instance** (`self`), and a `return` statement with a value inside a constructor is a compile-time error. A bare `return` returns the instance.

#### Inheritance
When a class is declared with a superclass:

- The superclass operand must be a class; otherwise a runtime error is raised.
- A class cannot inherit from a built-in class, and a class cannot inherit from itself.
- The subclass starts with a **copy** of the superclass's constructor and methods, and is then given its own methods, which replace inherited ones of the same name. The subclass also records the superclass for `super` lookups and for `is`.
**Method calls on a class.** `Class.name(args)` finds only **`static`** methods of that class. If there is none, a runtime error is raised.

### Instances

An instance is an object that belongs to one class and has its own table of **attributes**, which are created by assignment and map names to values.

For a method-call expression `obj.name(args)` on an instance (and equally on a userdata), `name` is resolved in this order:

1. an **attribute** of the instance called `name`, which is then called as a function;
2. a **method** of the instance's class (including inherited ones): an ordinary method is called with the instance as `self`; if it is flagged as a **getter**, it is called without arguments and its result is what is then called with `args`;
3. the class's special method **`getattr`**, if defined, which is called with the name and whose result is then called with `args`;
4. otherwise a runtime error is raised.

## Module

A module is the object that represents one unit of source code; one script file or one imported file, together with its top-level state. A module has:

- a **name**, the canonical module name;
- a **path**, the absolute path of its source, which may be absent for modules that are not loaded from a file;
- the **variables** declared at its top level, stored in slots;
- an **exported table**, mapping exported names to values

The runtime keeps a cache of modules keyed by name; asking for a module by a name that is already cached yields the **same module object**. A module whose name begins with `?` is never looked up in the cache. Every request for such a module creates a new one.

A `module` value exposes only its **exports**. In a call `module.name(args)`, `name` is looked up in the exports table and the expected value is called; if `name` is not exported, a runtime error is raised for a missing name. Defining an export stores the **value** of the exported variable in the exports table at the moment the export executes. Imports (`import`, `from ... import`, aliases) are described in the chapter on modules.

Functions defined in a module access the module's top-level variables directly; variables that are not exported are invisible outside the module.

## Userdata

A userdata is an object created by native code that wraps host data (a block of raw memory of a given size) and optionally a number of **user values** (Tea values which are attached to the object). The payload is opaque to Teascript programs and is accessible only to native code.

A userdata behaves like an instance in the language; it has a class and an attribute table, and method calls on it are resolved with the rules given for instances. Its class may define special methods, for example `call`, `==` or `contains`. A userdata may have a **finalizer**, called when the object is reclaimed by the garbage collector.

A userdata is always truthy and, unless its class overloads `==`, equal only to itself. There is no syntax that creates userdata; the standard library uses userdata for objects such as open files and buffers.

## Pointer

A pointer is an opaque **raw address** supplied by native code. It is not managed by the garbage collector, which neither follows nor frees it, and a program can neither dereference it nor create one; there is no literal or operator for it.

A pointer is a value type. It is always truthy and is equal to another pointer exactly when the addresses are identical. Native code is responsible for keeping the memory it refers to valid for as long as the pointer is in use.
