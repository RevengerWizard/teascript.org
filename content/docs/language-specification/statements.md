---
title: Statements
number: "5."
weight: 600
---

A _statement_ is a construct that is executed for its effect. This chapter defines how statements are sequenced and what it means for one to complete, and gives the semantics of Teascript's control flow statements: conditionals, loops, `switch`, and the jump statements `break`, `continue` and `return`.

The declaration statements (`var`, `const`, `function`, `class`), scoping and name resolution are described in the chapter on declarations; `import`, `from` and `export` in the chapter on modules. Expressions, including assignments, are described in [Expressions](../expressions). Truth values and equality are defined in [Type System](../type-system).

## Execution Model

A program is a _chunk_. A chunk is a sequence of declarations and statements that is executed in order from the first to the last.

```
chunk       ::= declaration* <eof>

declaration ::= class_declaration
              | function_declaration
              | variable_declaration
              | statement

statement   ::= ';'
              | block
              | if_statement
              | switch_statement
              | while_statement
              | do_statement
              | for_statement
              | break_statement
              | continue_statement
              | return_statement
              | import_statement
              | from_statement
              | export_statement
              | multiple_assignment
              | expression_statement

block       ::= '{' declaration* '}'
```

Statements are executed **one after another, in source order**. A declaration takes effect when execution reaches it. Newlines do not end statements (see [Lexical Structure](../lexical-structure)), and a semicolon is not required to end a statement; semicolons are required only between the clauses of the three-clause `for`.

### Completion

Executing a statement ends in exactly one of these ways:

| Completion | Caused by | Effect |
| --- | --- | --- |
| **Normal** | the statement finished | execution continues with the next statement |
| **Break** | `break` | the innermost enclosing loop ends |
| **Continue** | `continue` | the innermost enclosing loop proceeds to its next iteration |
| **Return** | `return`, or reaching the end of a function body | the enclosing function ends |
| **Error** | a runtime error | the error propagates (see the chapter on the error model) |

`break` and `continue` may only occur inside a loop, and `return` only inside a function; otherwise the program is rejected at compile time, see [break, continue and return](#break-continue-and-return).

### Empty Statement

A lone `;` is a statement that does nothing.

### Expression Statements

```
expression_statement ::= expression
```

An expression statement evaluates the expression and **discards its value**. Any expression is allowed, whether or not it has an effect. Because assignment, calls and compound assignment are expressions, they are written as expression statements.

An expression statement ends where the expression can longer be extended. Since a line break does not end it, a following line that begins with a token that can continue an expression, such as `(`, `[`, `.`, `-` or any binary operator, is read as a continuation:

```tea
var f = g
(h)            // one declaration: var f = g(h)
 
x = a
-b             // one statement: x = a - b
```

To avoid this, end the first statement with `;`, or start the next line with something that cannot continue an expression.

### Blocks

A block executes its declarations and statements in order, and opens a new scope. Variables declared inside it cease to be visible when it ends. Every control-flow statement in this chapter takes a **block** as its body; a single statement without braces is not accepted.

At the start of a statement, `{` always begins a block, never a map literal.

### Execution of a Chunk

The code of a chunk is executed once, from the top. When the last statement completes, the chunk ends. `return` is not permitted in the top-level code of a chunk.

## Control Flow Semantics

### Truthiness

Every control-flow condition is tested by **truth value**, as defined under [Truth value](../type-system#truth-value); a condition need not be a boolean. This applies to the conditions of `if`, `while`, `do ... while` and the clauses of generic `for`.

### if / else

```
if_statement ::= 'if' expression block ( 'else' ( if_statement | block ) )?
```

The condition is written **without parentheses**, and both branches are blocks.

1. The condition is evaluated and tested
2. If it is truthy, the first block is executed and the statement ends
3. Otherwise, if there is an `else` part, it is executed. an `else if` repeats these steps with the next condition; a final `else` block is executed unconditionally

At most one block executes. Conditions are evaluated in order and only until one succeeds.

```tea
if n < 0
{
    sign = -1
}
else if n == 0
{
    sign = 0
}
else
{
    sign = 1
}
```

### switch

```
switch_statement ::= 'switch' expression case_clause* default_clause?
case_clause      ::= 'case' expression ( ',' expression )* block
default_clause   ::= 'default' block
```

There are no braces around the clauses.

1. The `switch` expression is evaluated **once**
2. The clauses are examined in order. A `case` clause matches if the switch value is **equal** to the value of at least one of its expressions, using the equality relation of [Type System](../type-system#equality). `switch` never calls an `==` operator method, so instances and userdata match by identity
3. The block of the **first** matching clause is executed, and then the statement ends. There is **no fall-through**
4. If no clause matches, the `default` block is executed, if there is one; otherwise nothing happens

The expressions of a `case` clause are evaluated only when the clause is reached. Within one clause with several expressions (`case 1, 2, 3`), all of them are evaluated, from left to right, before they are compared. A `case` clause may not follow the `default` clause; this is a compile-time error.

`break` inside a `switch` does **not** leave the `switch`, as it refers to the innermost enclosing loop, see [break, continue and return](#break-continue-and-return).

```tea
switch command
case "start"
{
    run()
}
case "stop", "quit"
{
    shutdown()
}
default
{
    print("unknown command")
}
```

### while / do

```
while_statement ::= 'while' expression? block
do_statement    ::= 'do' block 'while' expression
```

#### `while`
The condition is evaluated before every iteration. As long as it is truthy, the body is executed; when it is falsy, the loop ends. If the condition is **omitted** (`while { ... }`), it is always true and the loop runs until a `break`, a `return` or an error ends it.

#### `do ... while`
The body is executed first, and the condition is evaluated **after** each execution; the loop continues while it is truthy. The body therefore executes at least once. No semicolon follows the condition, but it is possible to add it.

In both forms, each execution of the body has its own scope; variables declared in the body are created anew in every iteration.

`continue` has a different effect in the two loops. See [break, continue and return](#break-continue-and-return).

### Generic for

The three-clause `for` statement is the counting loop of the language:

```
for_statement ::= 'for' for_init ';' expression ';' expression block
for_init      ::= ( 'var' | 'const' ) <name> ( '=' expression )?
                | expression
```

There are no parentheses around the three clauses, and none of them may be omitted. The semantics are:

1. The **initializer** is executed once. If it is a `var` or `const` declaration, the declared variable is local to body of the loop; if the `= value` part is missing, the variable starts as `nil`. If it is an expression, its value is discared.
2. The **condition** is evaluated and tested before every iteration, including the first. If it is falsy, the loop ends.
3. The **body** is executed.
4. The **increment** expression is evaluated, and its value discarded. Execution continues with step 2.

The loop is therefore equivalent to a `while` loop with the increment placed after the body, and the increment is also executed when the body ends with `continue`.

```tea
for var i = 0; i < 10; i += 1
{
    print(i)
}
```

#### The loop variable and closures
A variable declared in the initializer is _copied_ for every iteration. The body sees its own variable, initialized from the loop variable at the start of the iteration, and a function created in the body captures that per-iteration variable, not the one that the increment updates. When the body completes normally the value of the body's variable is copied back, so an assignment to it in the body affects the following condition and increment:

```tea
for var i = 0; i < 3; i += 1
{
    register(function() { return i })   // each closure keeps its own i: 0, 1, 2
}
```

> [!NOTE]
> The copy back does not take place when the iteration ends with `continue`, so an assignment to the loop variable made in the body before a `continue` is lost. If the loop variable is declared with `const`, an increment that assigns to it is a compile-time error.

#### Steps and Termination
The language does not interpret the three clauses: the _increment_ is any expression and the _condition_ is any expression, so the step may be any amount, positive or negative, and the loop terminates only if the condition eventually becomes falsy. In particular:

- an increment that does nothing (such as a step of `0`), or that moves away from the termination condition, gives a loop that does not terminate by itself;
- with floating-point steps, the number of iterations is that of the arithmetic actually carried out in double precision. `for var x = 0; x != 1; x += 0.1` never ends, because the sum never equals `1` exactly, so prefer an ordering comparison such as `x < 1`;
- a condition that is initially falsy executes the body zero times.

To iterate over the numbers of a range, use the iterative `for` described next.

### Iterative for

```
for_in_statement ::= 'for' ( 'var' | 'const' ) <name> ( ',' <name> )* 'in' expression block
```

The iterative `for` runs its body once for every value produced by an _iterator_ obtained from the value of the expression. The loop variables are always **new** variables introduced by `var` or `const`; an existing variable cannot be used.

#### The iterator protocol

1. The expression after `in` is evaluated **once**; the value is the _sequence_
2. An iterator is obtained from the sequence:
    - if the sequence is itself a **function**, it is used directly as the iterator;
    - otherwise the `iter` special method of the sequence's class is called with the sequence as receiver and no arguments, and its return value is the iterator;
    - if neither applies, a runtime error is raised
3. Before every iteration, the iterator is **called with no arguments**. The iterator must therefore be callable: a function, a bound method, or an instance or userdata whose class defines `call`;
4. If the call returns **`nil`**, the loop ends and the iterator is not called again. Otherwise the returned value is the next value and the body is executed.

Because `nil` marks the end, an iterator cannot produce `nil` as one of its values.

#### Loop variables
With one variable, it is bound to the value returned by the iterator. With several variables, `for var k, v in sequence`, each value returned by the iterator **must be a list** with exactly as many elements as there are variables, and the elements are bound to the variables in order; a value that is not a list, or a list with too many or too few elements, is a runtime error. A variable declared in the loop header is created anew for every iteration, so closures created in the body capture the variable of their own iteration, and it is a compile-time error to assign to it if it was declared with `const`.

```tea
// a counter written as an iterator function
function upto(n)
{
    var i = 0
    return function() {
        if i >= n { return nil }
        i += 1
        return i - 1
    }
}
 
for var x in upto(3)    // the function is used directly as the iterator
{
    print(x)               // 0, 1, 2
}
```

Which built-in types are iterable, and what their iterators produce, is determined by their `iter` methods, which are part of the standard library. Modifying a sequence while it is being iterated has the effect defined by its iterator, not by the language.

## break / continue / return

```
break_statement    ::= 'break'
continue_statement ::= 'continue'
return_statement   ::= 'return' expression?
```

### break

`break` ends the **innermost enclosing loop** (`while`, `do ... while`, `for` or generic `for`) and execution continues with the statement after it. Variables declared in the body are discarded. It is a compile-time error if `break` is not inside a loop.

`switch` is not a loop: a `break` inside a `switch` that is inside a loop ends the loop. A loop does not extend into a nested function: a `break` in a function body cannot refer to a loop outside the function.

### continue

`continue` abandons the rest of the current iteration of the **innermost enclosing loop** and proceeds as follows:

| Loop | Execution continues with |
| --- | --- |
| `while` | the evaluation of the condition |
| three-clause `for` | the increment, and then the condition |
| generic `for` | the next call of the iterator |
| `do ... while` | the **beginning of the body**; the condition is **not** evaluated |

> [!NOTE]
> The last row differs from most languages: in a `do ... while` loop `continue` jumps back to the start of the body without testing the condition, so the loop continues even if the condition is falsy.

Variables declared in the body are discarded. It is a compile-time error if `continue` is not inside a loop.

### return

`return` ends the execution of the **enclosing function** and makes the call evaluate to the given value.

- `return expression` returns the value of the expression. A function returns **a single value**.
- `return` with no expression (the `return` is followed by `}` or `;`) returns `nil`.
- Reaching the end of the function body is the same as `return` with no value.
- In a constructor, `return` with no expression returns the new instance, and `return` with a value is a compile-time error; see the chapter on the object system.
- `return` at the top level of a chunk, outside any function, is a compile-time error.
When a function returns, the variables of the function that were captured by closures remain valid for as long as the closures exist.

## Multiple Assignment

```
multiple_assignment ::= <name> ( ',' <name> )+ '=' expression_list
expression_list     ::= expression ( ',' expression )*
```

A statement that begins with a name followed by a comma assigns to several variables at once. It is a **statement**, not an expression, and has no value. There are two forms:

- **One expression per target**: `a, b = b, a`. The number of expressions must equal the number of targets, otherwise the program is rejected at compile time. All of the expressions are evaluated first, from left to right, and only then are the targets assigned, so `a, b = b, a` exchanges the two values.
- **A single expression that is a list**: `a, b = pair`. The value must be a **list** with exactly as many elements as there are targets, and its elements are assigned in order. A value that is not a list, or a list with too many or too few elements, is a runtime error.

The targets are plain variables; attributes and elements (currently) cannot be targets of a multiple assignment. The usual rules for assignment apply to each target: it must be a declared variable and must not be a constant. The targets are stored from last to first, which is observable only if a name occurs twice: in `a, a = 1, 2` the variable ends up with `1`.
