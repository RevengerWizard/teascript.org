---
title: Expressions
number: "4."
weight: 500
---

An _expression_ is a construct that is evaluated to produce a value. This chapter defines the forms of expression, the order in which their parts are evaluated, the meaning of every operator, the precedence and associativity that decide how operators group, and assignment.

The types of the values that expressions produce, and the truth value and equality relations used below, are defined in [Type System](../type-system). The lexical forms of literals are defined in [Lexical Structure](../lexical-structure). Grammar notation is defined in [Notation and Conventions](../notation-and-conventions); as explained there, operators are specified by the precedence table in this chapter, and the productions below describe operands and the postfix forms.

## Expression Forms

```
expression ::= ? operands combined by the operators of the precedence table ?

primary    ::= 'nil' | 'true' | 'false'
             | <number> | string | <name>
             | 'self' | super_expression
             | list_literal | map_literal
             | function_expression
             | '(' expression ')'

postfix    ::= primary ( call | member | subscript )*
call       ::= '(' arguments? ')'
member     ::= '.' ( <name> | 'new' ) call?
subscript  ::= '[' ( expression | slice ) ']'
```

### Literals and Names

`nil`, `true` and `false` denote the values of the same names. Numeric and string literals are described in [Lexical Structure](../lexical-structure). An _interpolated string_ (`"a ${x} b"`) evaluates its embedded expressions from left to right and produces a string made by joining the literal pieces with the values of the expressions, converted to strings in the way the standard `join` operation does.

When two or more string literals are joined with `+` and nothing else, as in `"ab" + "cd"`, they are concatenated at compile-time into one literal. The folding is applied greedily, before any following operators or member access is considered: in `"a" + "b".f()` the member access applies to the folded literal `"ab"`, not to `"b"`.

A `<name>` is resolved at **compile-time**, in this order:

1. a local variable of the current function;
2. a variable of an enclosing function (a captured variable);
3. a variable declared at the top level of the current module;
4. a predefined global of the language environment, which can be read but not assigned

A name that matches none of these is a **compile-time error**. There is no runtime lookup by name, and a name never evaluates to `nil` because it is undefined.

### Grouping

Parentheses group an expression and do not change its value. A `(` is, however, also the start of the parameter list of an arrow function, see [Function Expressions](#function-expressions). The parser decides by looking at the tokens that follow the `(`. If they are a `)` followed by `=>`, or a name followed by `,` or `)`, an arrow function is being parsed. Consequently, a parenthesized single name, `(x)`, is **never** a grouped expression and it is read as an arrow function parameter list and must be followed by `=>`. Parentheses around a single name are never needed for grouping.

### List and Map Literals

```
list_literal ::= '[' ( list_item ( ',' list_item )* ','? )? ']'
list_item    ::= expression | '...' expression
map_literal  ::= '{' ( map_entry ( ',' map_entry )* ','? )? '}'
map_entry    ::= <name> '=' expression
               | '[' expression ']' '=' expression
```

A list literal creates a new list each time it is evaluated, with the items in order. A `...` item evaluates its expression and appends every element it denotes: the elements of a list, the integers of a range, or the bytes of a string as one-byte strings; see [List](../type-system#list). Any other type is a runtime error.

A map literal creates a new map each time it is evaluated. An entry of the form `name = value` has the **string** name as its key; an entry of the form `[key] = value` uses the value of the key expression. Entries are evaluated in order, and within an entry the key is evaluated before the value. Both forms allow a trailing comma. Note that entries use `=`.

> [!NOTE]
> A `{` at the start of statement begins a block, not a map literal. To use a map literal as an expression statement, wrap it in parentheses.

### Function Expressions

```
function_expression ::= 'function' '(' parameters? ')' block
                      | '(' parameters? ')' '=>' ( expression | block )
```

Evaluating a function expression creates a new function value (a closure) that captures the variables it refers to from enclosing functions. In the arrow form, a body that is an expression is evaluated when the function is called and its value is returned. A body that begins with `{` is always a block, and the function returns `nil` unless it executes `return value`; to return a map literal from an arrow function, wrap it in parentheses.

The parameters (required, optional with defaults, and a variadic `...name`) are described together with function declarations. As explained under [Grouping](#grouping), an arrow function's parameter list must begin with `(`, or with a name followed by `,` or `)`; in particular a first parameter that has a default value cannot be written as `(a = 1) => ...`.

### Member Access

`object.name` evaluates `object` and then reads the attribute `name` of it. The result depends on the type of `object`:

| `object` | `object.name` |
| --- | --- |
| instance, userdata | its attribute, or its class's method or getter, or the result of the class's `getattr` special method (see [Class and Instance](../type-system#class-and-instance)) |
| class | in a method call, its `static` method called `name` |
| module | the exported value called `name` |
| any other value | a method of the value's class |

`name` must be a `<name>` or the keyword `new`.

`object.name(arguments)` is a **method call**. It looks up `name` as just described and calls it with `object` as the receiver, without first creating a bound method. `Class.new(arguments)` constructs an instance, see [Class and Instance](../type-system#class-and-instance).

### Calls

`callee(arguments)` evaluates the callee, then the arguments from left to right, then performs the call. The callee may be a function, a bound method, or an instance or userdata whose class defines `call`; any other value is a runtime error, see [Function](../type-system#function). A call evaluates to the value the function returns.

```
arguments ::= argument ( ',' argument )*
argument  ::= expression | '...' expression
```

An argument written `...expr` must evaluate to a **list**; its elements are passed as individual arguments in place. No trailing comma is permitted in an argument list.

A call argument is a full expression, including an assignment: in `f(a = 1)` the argument is the *assignment* of `1` to `a`, whose value is passed. Teascript has no named arguments.

### Subscripts and Slices

```
subscript ::= '[' expression ']'
            | '[' expression ':' ']'
            | '[' expression ':' expression ( ':' expression )? ']'
            | '[' expression '::' expression ']'
```

`object[index]` evaluates `object`, then `index`, and then performs the object's index operation.

A **slice** is an index that is a _range value_. The slice notation builds the range for you:

| Notation | Equivalent range |
| --- | --- |
| `x[a:b]` | `a..b` (step 1) |
| `x[a:b:c]` | `a..b..c` |
| `x[a:]` | from `a`, no upper bound (end is positive infinity), step 1 |
| `x[a::c]` | from `a`, no upper bound, step `c` |

The start must always be written. The meaning of the range for a given object type, for example the slicing of a string, is described with that type.

### Ranges

`start..end` and `start..end..step` create a new range value; see [Range](../type-system#range). `start`, `end` and `step` are evaluated from left to right, and the step is `1` when omitted. All three must be numbers, otherwise a runtime error is raised.

The operands `start` and `end` bind tighter than `..`, at the level of addition, so `1..n + 1` is `1..(n + 1)`. The step, however, is a full expression. Ranges do not chain.

### Conditional Expression

`condition ? when_true : when_false` evaluates `condition` and tests its truth value. If it is truthy only `when_true` is evaluated and is the result; otherwise only `when_false` is. The conditional operator is right-associative: `a ? b : c ? d : e` is `a ? b : (c ? d : e)`. Both branches are full expressions, so an assignment may appear in either.

### Self and Super

`self` denotes the receiver in a method. It may only be used inside a method of a class (not in a static method); elsewhere it is a compile-time error.

`super` may only be used inside a class that was declared with a superclass; elsewhere it is a compile-time error. It has three forms:

| Form | Meaning |
| --- | --- |
| `super.name(args)` | Calls the superclass's method `name` with the current `self` as receiver |
| `super.name` | A bound method: the superclass's method `name` paired with the current `self` |
| `super(args)` | Equivalent to `super.new(args)`: calls the superclass constructor |
| `super` | The superclass itself |

The method is looked up in the superclass's method table, which includes the methods that the superclass itself inherited.

## Evaluation Order

Teascript evaluates the operands of an expression in a defined order, **left to right** in the order in which they appear in the source, with the exceptions below. Side effects of an operand therefore take place before those of the operand to its right, and a program may depend on this.

| Construct | Order |
| --- | --- |
| Binary operator `a op b` | `a`, then `b`, then the operation |
| Unary operator `op a` | `a`, then the operation |
| `a and b`, `a or b` | `a`; `b` only if needed (see [Logical](#logical)) |
| `c ? x : y` | `c`; then only one of `x` and `y` |
| Call `f(a1, a2, ...)` | `f`, then `a1`, `a2`, ..., then the call |
| Method call `o.m(a1, ...)` | `o`, then the arguments, then the lookup and the call |
| `o[i]` | `o`, then `i` |
| `x[a:b:c]`, `a..b..c` | the components, in source order |
| List literal | the items, in order |
| Map literal | the entries in order; within an entry the key before the value |
| Interpolated string | the pieces and embedded expressions, in order |
| `target = value` | the sub-expressions of the target, then `value`, then the store |
| `target op= value` | the sub-expressions of the target, then the **current value of the target**, then `value`, then the operation, then the store |

Two points deserve emphasis:

- The callee is evaluated before the arguments. In `f(g())`, `f` is evaluated first
- A binary operator evaluates both operands before it examines them. Dispatching to an operator method happens after both operands have been evaluated, see [Operator Overloading Dispatch](#operator-overloading-dispatch)

Whenever the precedence table makes two operators group in a particular way, evaluation order is still left to right: grouping `a + b * c` as `a + (b * c)` does not cause `b * c` to be evaluated before `a`.

## Operator Semantics

The arithmetic, bitwise and ordering operators have two behaviours:

1. a **built-in behaviour** when its operands are numbers, as specified in [Number](../type-system#number);
2. when the operands are not numbers, **dispatch to an operator method**, described in [Operator Overloading Dispatch](#operator-overloading-dispatch)

### Arithmetic

| Operator | Name | Notes |
| --- | --- | --- |
| `a + b` | Addition | Also string concatenation, see below |
| `a - b` | Subtraction | |
| `a * b` | Multiplication | |
| `a / b` | Division | Division by zero is not an error; see [NaN and Infinity](../type-system#nan-and-infinity) |
| `a % b` | Remainder | Sign of the dividend |
| `a ** b` | Exponentiation | |
| `-a` | Negation | Unary |

When both operands are numbers, the result is a number computed in double precision, as specified in [Arithmetic Semantics](../type-system#arithmetic-semantics). There is no implicit conversion. An operand that is not a number never becomes one. `+` applied to two strings denotes **concatenation** and produces a string that is the bytes of the left operand followed by those of the right.

Any other combination is resolved by [dispatch](#operator-overloading-dispatch), and is runtime error if neither operand's class provides an operator method.

### Comparison

| Operator | Meaning |
| --- | --- |
| `a == b` | Equality |
| `a != b` | Inequality |
| `a < b`, `a <= b`, `a > b`, `a >= b` | Ordering |
| `a in b` | Membership |
| `a not in b` | Negated membership |

#### Equality
`==` applies the equality relation of [Type System](../type-system#equality). Values of different types are never equal. If either operand is an instance or a userdata, an `==` operator method is used when one exists, and its result, whatever it is, is the value of the expression. `a != b` is evaluated as `not (a == b)`. Its result is always boolean, and any `==` operator method is the one that is consulted.

#### Ordering
When both operands are numbers the comparison is the IEEE-754 comparison and produces a boolean (always `false` if an operand is `NaN`). Otherwise the corresponding operator method is dispatched; the language itself defines no ordering for other types. Comparisons do **chain**: `a < b < c` is `(a < b) < c`, which compares the boolean result of `a < b` with `c`.

#### Membership
`x is container` calls the `contains` method of `container` with `x` as its argument, and the result of that call is the value of the expression. If `container` has no `contains` method, a runtime error is raised. `x not in container` is `not (x in container)` and is always a boolean. Note that `x` is the _left_ operand and `container` the right one.

### Logical

```
not a      !a      a and b      a or b
```

`and` and `or` are **short-circuit** operators that work on truth values, but give one of their operands not a boolean; see [Truth value](../type-system#truth-value)

| Expression | Evaluation | Result |
| --- | --- | --- |
| `a and b` | evaluate `a`; if `a` is falsy, stop | `a` if `a` is falsy; otherwise the value of `b` |
| `a or b` | evaluate `a`; if `a` is truthy, stop | `a` if `a` is truthy; otherwise the value of `b` |

The right operand is evaluated **only** if it can influence the result. These operators are what make idioms like `name = given or "default"` work, and they can be applied to values of any type.

`not a` and `!a` are two spellings of the same operator. The result is the boolean `true` if `a` is falsy and `false` otherwise. `not` and `!` cannot be overloaded.

Precedence matters here: `and` binds tighter than `or`, and `not`/`!` bind **tighter than every binary operator**, so `not a == b` is `(not a) == b`; write `not (a == b)` or `a != b` to negate the comparison.

### Identity

Teascript has no operator that compares object identity. The `is` operator is a **class membership test**:

```
value is Class          value is not Class
```

The right operand must evaluate to a class, otherwise a runtime error is raised. The result is `true` if the class of `value` is `Class` or inherits from it, directly or indirectly, and `false` otherwise, including when `value` has no class. `is not` is the negation and is always a boolean. `is` cannot be overloaded.

For types whose `==` is identity (functions, classes, modules, instances without an `==` method), `==` is also the way to test whether two references denote the same object.

### Bitwise

| Operator | Meaning |
| --- | --- |
| `a & b` | Bitwise AND |
| `a \| b` | Bitwise OR |
| `a ^ b` | Bitwise XOR |
| `~a` | Bitwise complement |
| `a << b` | Left shift |
| `a >> b` | Right shift (zero-filling) |

When both operands are numbers, the operation is performed on **32-bit unsigned integers**, as specified in [Arithmetic Semantics](../type-system#arithmetic-semantics): the result is an integer in `0` to `4294967295`, and the effect of operands outside the range of 32-bit unsigned integers, and of shift counts of 32 or more, is unspecified. Otherwise the corresponding operator method is dispatched.

Bitwise operators bind **more tightly than the comparison and equality operators** (unlike C): `a & b == c` is `(a & b) == c`.

### Operator Overloading Dispatch

A class overloads an operator by defining the corresponding _operator method_; the declaration syntax is part of class declarations. The following operators can be overloaded:

| Category | Operators |
| --- | --- |
| Arithmetic | `+` `-` `*` `/` `%` `**` |
| Bitwise | `&` `\|` `^` `~` `<<` `>>` |
| Comparison | `<` `<=` `>` `>=` `==` |
| Index | `[]` (read) and `[]=` (write) |

`!=`, `not`, `!`, `and`, `or`, `is`, `is not`, `..` and the conditional operator cannot be overloaded; `!=` follows from `==`. The other special methods (`call`, `contains`, `iter`, `getattr`, `setattr`, `tostring`, `gc`, `new`) are not operators; they are listed in [Class and Instance](../type-system#operator-methods-and-special-methods).

#### Binary operators
For `a op b`, after both operands are evaluated:

1. If `a` and `b` are both numbers, the built-in numeric operation is performed and no method is consulted
2. Otherwise the implementation looks for the operator method for `op` in the class of the **left operand**, and, if the left operand's class has none, in the class of the **right operand**
3. If a method is found it is called with **two arguments**: `a` and `b`, in that order, regardless of which operand's class supplied it. The return value of the method, unmodified, is the value of the expression
4. If no method is found, a runtime error is raised that names the operator and the types of the two operands

#### Unary operators
For `-a` and `~a`: if `a` is a number the built-in operation is performed; otherwise the method for the operator is looked up in the class of `a` and called with two arguments, `a` and `nil`. If there is none, a runtime error is raised. The operator method for `-` therefore serves both the unary and the binary minus, and tells them apart by whether its second argument is `nil`.

#### Equality
(`==`) differs from the other operators: the built-in equality is used unless an operand is an instance or a userdata, in which case an `==` operator method is consulted first (left operand's class, then right's). If none exists, built-in equality is used instead of raising an error.

#### Membership
(`in`) is not dispatched like the binary operators. It is a call of the `contains` method of the right operand with the left operand as argument, as described under [Comparison](#comparison).

#### Indexing
For an instance or a userdata, `object[index]` is dispatched to the `[]` method of its class, and `object[index] = value` to `[]=`.

## Operator Precedence Table

The operators are listed from **lowest** precedence (binds loosest) to **highest**. Operators in the same row have the same precedence.

| Level | Operators | Associativity | Description |
| --- | --- | --- | --- |
| 1 | `=` `+=` `-=` `*=` `/=` `%=` `**=` `&=` `\|=` `^=` `<<=` `>>=` | right | Assignment |
| 1 | `? :` | right | Conditional |
| 2 | `or` | left | Logical OR (short-circuit) |
| 3 | `and` | left | Logical AND (short-circuit) |
| 4 | `==` `!=` | left | Equality |
| 5 | `is` `is not` `not in` | left | Class test, negated membership |
| 6 | `<` `<=` `>` `>=` `in` | left | Ordering and membership |
| 7 | `\|` | left | Bitwise OR |
| 8 | `^` | left | Bitwise XOR |
| 9 | `&` | left | Bitwise AND |
| 10 | `<<` `>>` | left | Shifts |
| 11 | `..` | see [Ranges](#ranges) | Range |
| 12 | `+` `-` | left | Addition, subtraction |
| 13 | `*` `/` `%` | left | Multiplication, division, remainder |
| 14 | `**` | left | Exponentiation |
| 15 | `not` `!` `-` `~` | right (prefix) | Unary operators |
| 16 | `[ ]` | left | Subscript, slice |
| 17 | `( )` `.` | left | Call, member access |

"Associativity" says how a sequence of operators of the same row groups. For left-associative operators `a op b op c` is `(a op b) op c`.

A few consequences that differ from other languages:

- **`**` is left-associative**: `2 ** 3 ** 2` is `(2 ** 3) ** 2`, which is `64`.
- **Unary operators bind tighter than `**`**: `-2 ** 2` is `(-2) ** 2`, which is `4`. The exponent may itself be negated: `2 ** -1`.
- **Bitwise operators bind tighter than comparisons**: `a & b == c` is `(a & b) == c`.
- **`not` binds tighter than any binary operator**: `not a == b` is `(not a) == b`.
- **`in` and `not in` are on different levels**: `in` is at the level of ordering comparisons, `not in` at the level of `is`.
- **Comparisons do not chain**: `a < b < c` is `(a < b) < c`.

```tea
1 + 2 * 3          // -> 7
(1 + 2) * 3        // -> 9
a or b and c       // -> a or (b and c)
-2 ** 2            // -> 4
1..n + 1           // -> 1..(n + 1)
x = y = 0          // -> x = (y = 0)
```

## Assignment

```
assignment ::= target '=' expression
target     ::= <name>
             | postfix '.' <name>
             | postfix '[' expression ']'
```

Assignment stores the value of the right-hand side into the **target**:

| Target | Effect |
| --- | --- |
| `name` | Stores into the local, captured or module variable `name` |
| `object.name` | Sets the attribute `name` of `object` (through the `setattr` special method for instances and userdata, if it defines one) |
| `object[index]` | Performs the index store of `object`, the `[]=` operation, with `index` |

The value of an assignment to a **variable** is the assigned value, so assignments can be nested and chained: `a = b = 0` assigns `0` to `b`, then the result `0` to `a`. The value of an assignment to an attribute or an element is the result of the store operation of the object and is unspecified; programs must not rely on it.

#### Evaluation
The sub-expressions of the target (`object`, then `index`) are evaluated first, from left to right, then the right-hand side, then the store takes place.

#### Where assignment is allowed
Assignment is not an ordinary operator. It is accepted only where an assignment can appear, which is at the start of an expression, as the right-hand side of another assignment, in a branch of the conditional operator, in a parenthesized expression, and as a call argument. A target that is the operand of any other operator is a compile-time error, _invalid assignment_: `a + b = c` and `a * x.y = 1` are rejected, as is an assignment whose target is a call, a literal or any other expression that cannot be stored into.

#### Constants
Assigning to a variable declared with `const`, by `=` or by a compound assignment, is a compile-time error. The restriction is on the variable, not on the object it refers to. Attributes and elements of an object held in a `const` variable can be assigned.

#### Undeclared Names
Assigning to a name that does not resolve to a variable is a compile-time error; see [Literals and Names](#literals-and-names). Assignment does not create variables, and predefined globals cannot be assigned.

> [!NOTE]
> Assigning to several targets at once `a, b = b, a` is a statement, not an expression, and is described in statements.

## Compound Assignment

```
compound_assignment ::= target compound_operator expression
compound_operator   ::= '+=' | '-=' | '*=' | '/=' | '%=' | '**='
                      | '&=' | '|=' | '^=' | '<<=' | '>>='
```

`target op= value` computes `target op value` and stores the result in `target`; the value of the whole expression is the result. It is the same as `target = target op value`, except for the following:

1. The **sub-expressions of the target are evaluated only once**. In `list[next()] += 1`, `next()` is called once, and `list[i] += 1` indexes with the same `i` for the read and for the store
2. The **current value of the target is read before the right-hand side is evaluated**. If evaluating `value` modifies the target, the old value is the one that is used:

```tea
var x = 1
x += (x = 10)      // reads 1, then evaluates (x = 10), then stores 1 + 10 -> x is 11
```

3. For an attribute or element target, the read uses the same lookup as a plain read (including `getattr` and `[]`), and the store uses the same operation as a plain assignment (including `setattr` and `[]=`).
The operation is the binary operator named by the compound operator, including its dispatch to an operator method when the operands are not numbers. It follows that `+=` on strings concatenates, and that `a |= b` behaves as `a = a | b`, including the 32-bit unsigned semantics of the bitwise operators.

The restrictions of plain assignment apply: the target must be a variable, an attribute or an element, and it is a compile-time error to assign to a constant. There are no compound forms for `and`, `or` or `..`, and no increment or decrement operators.
