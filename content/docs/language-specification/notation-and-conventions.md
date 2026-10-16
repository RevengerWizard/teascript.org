---
title: Notation and Conventions
number: "1."
weight: 200
---

This chapter introduces the notation and conventions used throughout the Teascript Language Specification, and gives a short overview of how a Teascript program is read. It defines no language features itself: the details of each construct are given in the chapters devoted to it.

## Grammar Notation

### Normative Language

The words **must**, **must not** and **may** are used in their usual specification sense. A program that violates a _must_ is rejected. The phrase **is an errors** means that the implementation stops processing the program and reports a diagnostic.

Two kinds of errors are distinguished throughout this reference:

- **Compile-time error**: While the source is being read, before any code of that script runs
- **Runtime error**: While the program runtime executes

Text introduced by **NOTE** is informative and adds no requirements.

### Extended BNF

Grammars are written in a small EBNF dialect. Since `{ } [ ] ( ) ? * + |` are all meaningful in Teascript source, **every terminal is written in quotes**, and the grammar's own operators appear only outside quotes.

| Notation | Meaning |
| --- | --- |
| `rule ::= ...` | Defines the non-terminal `rule`. Non-terminals are written in `lower_snake_case`. |
| `'while'`, `'{'`, `'=>'` | A **terminal**: the exact characters (lexical grammar) or the exact token (syntactic grammar). |
| `<name>` | A **token class**: any token of that kind (`<name>`, `<number>`, `<string>`, `<interpolation>`, `<eof>`). |
| `a b` | Sequence. |
| `a \| b` | Alternative. |
| `( a b )` | Grouping. |
| `a?` `a*` `a+` | Zero or one, zero or more, one or more occurrences of `a`. |
| `[a-z]` `[0-9_]` | **Character class** (lexical grammar only). |
| `[^"\n]` | Negated character class. |
| `any` | Any single byte. |
| `'\n'` `'\t'` ... | Control characters, spelled as in a Teascript string. |
| `? text ?` | A rule described in prose, where the notation is not adequate. |
| `(* text *)` | A comment inside a grammar. |

A literal single quote is written `"'"`, and a literal double quote `'"'`. For example:

```
if_statement ::= 'if' expression block ( 'else' ( if_statement | block ) )?
```

reads: _an `if` statement is the keyword `if`, an expression, a block, and optionally `else` followed by another `if` statement or a block_.

### Operator Precedence Tables

Statements and declarations are specified with productions. **Expressions are specified by a precedence table**, because Teascript parses them by operator precedence; each operator has a binding strength and an associativity. Productions are given only for operand forms, and where a table and a production seem to disagree, the table decides how operators group.

## Lexical and Syntactic Layers

A program is read in three cooperative layers, each with its own grammar:

| Layer | Works on | Produces | Specified in |
|-------|----------|----------|--------------|
| **Character layer** | Bytes | Characters and line numbers | [Lexical Structure](lexical-structure.md) |
| **Lexical layer** | Characters | Tokens | [Lexical Structure](lexical-structure.md) |
| **Syntactic layer** | Tokens | Declarations, statements and expressions | The chapters on each construct |

The **lexical grammar** has characters as its alphabet; its rules use character classes. The **syntactic grammar** has tokens as its alphabet; its terminals are keywords, symbols and token classes. White space and comments are discarded by the lexical layer and never appear in the syntactic grammar.

The layers run _on demand, in a single pass_. The parser requests one token at a time and translates the program as it reads it; there is no separate three-building phase. The lexer (scanner) stays at most one token ahead of the parser, which is all the lookahead the grammar needs.

Two consequences apply to the whole specification:

- **Compilation stops at the first error**: A script is translated completely before it is executed, so a compile-time error anywhere in a script prevents all of it from running
- **The lexical grammar is not purely regular**: String iterpolation allows expressions, including further strings, inside a string literal, so the lexer keeps a small amount of state and cooperates with the parser. The details are in [Lexical Structure](lexical-structure.md).

### Terminology
 
| Term | Definition |
| --- | --- |
| **Chunk** | One complete unit of source handed to the compiler: a script file, a string passed to an evaluator, or an imported module. |
| **Token** | The smallest unit of the syntactic grammar. |
| **Lexeme** | The exact characters that make up one token. |
| **Identifier** | A `<name>` token that names a variable, function, class, parameter or member. |
| **Declaration** | A construct that introduces a name. |
| **Statement** | A construct executed for its effect. |
| **Expression** | A construct evaluated to produce a value. |
| **Block** | A brace-delimited sequence of declarations and statements that opens a new scope. |
