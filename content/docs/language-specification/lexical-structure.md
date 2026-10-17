---
title: Lexical Structure
number: "2."
weight: 300
---

This chapter defines the lexical structure of Teascript, how a sequence of bytes is divided into the _tokens_ that the syntactic grammar works with. It covers the source encoding, white space and line endings, comments, the token set, key words, identifiers, and every form of literal.

The grammar notation used here is defined in _Notation and Conventions_. In this chapter, the alphabet of every rule is _characters_; terminals are quoted, and `[...]` denotes a character class.

At any point, the lexer (scanner) reads the **longest** sequence of characters that forms a valid token ("maximal munch"), skipping white space and comments between tokens. A lexical error is a compile-time error, and no part of the script will be run.

## Source Encoding

Source text is a sequence of **bytes**, intended to be encoded as **UTF-8**. The lexer does not validate the encoding:

- Inside string literals and comments, any byte is accepted and preserved unchanged
- Outside them, only characters defined in this chapter are valid. Any other byte is an _unexpected character_ error.

Two things are skipped before the first token is read, in this order:

1. An optional UTF-8 **byte-order-mask** (BOM, `EF BB BF`)
2. An optional **`#!` line**; if the next two characters are `#!`, everything up to and including the first line break is ignored. This allows scripts to be executable on POSIX systems.

```tea
#!/usr/bin/env tea
print("hello")
```

The `#!` line is recognized only at the very start of the source. A `#` anywhere else is an unexpected character.

> [!NOTE]
> A chunk is either source text or precompiled bytecode, distinguished by its first byte. A byte-order mark or `#!` line in front of precompiled bytecode causes the chunk to be entirely rejected. This chapter describes source text only.

The way the source is delivered to the comiler, for example in blocks read from a file, has no effect on its meaning; a token may span a block boundary.

## Whitespace and Line Endings

```
whitespace  ::= ' ' | '\t' | '\v' | '\f' | line_break
line_break  ::= '\r\n' | '\n\r' | '\n' | '\r'
```

White space separates tokens and is otherwise ignored. Line breaks have **no syntactic meaning**, they are white space line any other, and statements are not terminated by them.

Each of `\n`, `\r`, `\r\n` and `\n\r` counts as a _single_ line break. Two identical characters in a row (`\n\n`) are two line breaks.

Line numbers start at 1 and are used in diagnostics. A token is attributed to the line on which it **ends**. The number of lines in a source is bounded by an implementation limit; exceeding it is an error.

## Comments

```
comment        ::= line_comment | block_comment
line_comment   ::= '//' [^\n]*
block_comment  ::= '/*' ( block_comment | any )* '*/'
```

A **line comment** runs from `//` to the next `\n`, or to the end of the source.

A **block comment** runs from `/*` to its matching `*/`. Block comments can **nest**, every inner `/*` needs its own `*/`.

```tea
// a line comment
/* a block comment */
/* outer /* inner */ still inside the outer comment */
```

A block comment is still open at the end of the source is an _unfinished comment_ error. Because of nesting, `/* ... */` cannot be used to disable a region containing an unbalanced `/*` or `*/`, such as one inside a string literal.

> [!NOTE]
> Inside comments, only `\n` advances the line counter, so sources using bare `\r` line endings may report line numbers that are too low after a block comment. LF and CRLF sources are unaffected.

Comments act as white space. `a/**/b` is two tokens.

## Tokens

The lexer produces tokens of the following classes:

| Class | Description |
| --- | --- |
| Keyword | One of the 32 reserved words |
| `<name>` | An identifier |
| `<number>` | A numerical literal |
| `<string>` | A string literal, or the final piece of an interpolated string |
| `<interpolation>` | A string piece that is followed by an interpolated expression |
| Symbol | An operator or punctuation token |
| `<eof>` | The end of the source; always the last token |

The symbol tokens are:

| Group | Tokens |
| --- | --- |
| Delimiters | `(` `)` `[` `]` `{` `}` |
| Separators | `,` `;` `:` `.` `?` |
| Arithmetic | `+` `-` `*` `/` `%` `**` |
| Bitwise | `&` `\|` `^` `~` `<<` `>>` |
| Comparison | `==` `!=` `<` `<=` `>` `>=` |
| Logical | `!` |
| Assignment | `=` |
| Compound assignment | `+=` `-=` `*=` `/=` `%=` `**=` `&=` `\|=` `^=` `<<=` `>>=` |
| Range and spread | `..` `...` |
| Arrow | `=>` |

Because the longest match always wins, `a>>=b` is `a`, `>>=`, `b` and `x**=2` is `x`, `**=`, `2`.

## Keywords and Reserved Words

The following 32 words are **reserved**. They are case-sensitive and can never be used as identifiers.

| Group | Reserved words |
| --- | --- |
| Declarations | `var` `const` `function` `class` `static` `operator` |
| Conditionals | `if` `else` `switch` `case` `default` |
| Loops and jumps | `for` `while` `do` `break` `continue` `return` |
| Operators | `and` `or` `not` `in` `is` |
| Values | `true` `false` `nil` |
| Object model | `self` `super` `new` |
| Modules | `import` `from` `as` `export` |

`new` is the one reserved word that may also appear after a dot, as a member name: `Point.new(1, 2)`. No other reserved word may follow a dot.

## Identifiers

```
name        ::= name_start name_part*
name_start  ::= [A-Za-z_]
name_part   ::= [A-Za-z0-9_]
```

An identifier consists of ASCII letters, digits and underscores, and does not start with a digit. Identifiers are case-sensitive: `total` and `Total` are different names. A word that matches a reserved word is a keyword token, not a `<name>`.

## Literals

Literals `true`, `false` and `nil` are keywords (see above). The remaining literals are numbers and strings, described below. List and map literals are expressions and are specified with the other expressions.

### Integer Literals

```
integer      ::= decimal_int | hex_int
decimal_int  ::= digits
hex_int      ::= '0' [xX] hex_digits
digits       ::= [0-9] ( '_'? [0-9] )*
hex_digits   ::= [0-9A-Fa-f] ( '_'? [0-9A-Fa-f] )*
```

An integer literal is a decimal number or, after the prefix `0x` / `0X`, a hexadecimal number. It has no fractional part and no exponent.

An underscore may be used as a **digit separator**, with exactly one allowed between two digits. `1__0` and `10_` are errors.

```tea
42
1_000_000
0xFF          // 255
0xDEAD_BEEF
```

All numeric literals produce a `number` token, and share one number type; the integer/float distinction in this chapter is a matter of lexical form only.

### Float Literals

```
float         ::= decimal_float | hex_float
decimal_float ::= digits '.' digits exponent?
                | digits exponent
exponent      ::= [eE] [+-]? digits
hex_float     ::= '0' [xX] hex_digits ( '.' hex_digits )? hex_exponent
                | '0' [xX] hex_digits '.' hex_digits
hex_exponent  ::= [pP] [+-]? digits
```

A float literal has a fractional part, an exponent, or both. In a hexadecimal float the exponent letter is `p` / `P` and denotes a power of two.

```tea
3.14
1.5e3         // 1500
2e-4
0x1p4         // 16
0x1.8p1       // 3
```

Rules shared by all numeric literals:

- A decimal point must be **followed by a digit**, and a literal always **starts with a digit**. `1.` is an error, and `.5` is the symbol `.` followed by the number `5`. Write `1.0` and `0.5`
- A dot immediately followed by a second dot ends the number, so `1..5` is `1`, `..`, `5`
- A `+` or `-` belongs to the number only directly after the exponent letter; `1e+5` is one token, while `0xe+1` is `0xe`, `+`, `1`
- The lexer takes the whole run of letters, digits, underscores and dots as one lexeme and then validates its contents. `12abc` is therefore a single _malformed number_ error, and not `12` followed by `abc`. Separate a number from a following name with white space or an operator

### String Literals

```
string        ::= short_string | long_string
short_string  ::= q ( string_char | escape | interpolation )* q
long_string   ::= q q q long_char* q q q
q             ::= "'" | '"' | '`'
```

All three delimiters `'`, `"` and `` ` ``, are fully equivalent. The closing delimiter must be the same character as the opening one.

#### Short Strings

A short string must end on the line where it starts; a line break or the end of the source before the closing delimiter is an _unfinished string_ error. A back slash starts an [escape sequence](#escape-sequences).

```tea
"hello"
'it\'s'
`tab:\there`
```

#### Interpolation

Inside a short string, `${` opens an **interpolation**, an expression whose value is inserted into the string. A `$` not followed by `{` is an ordinary character, and `\$` is an escaped dollar sign.

```tea
var name = "world"
"Hello, ${name}!"       // Hello, world!
"1 + 2 = ${1 + 2}"      // 1 + 2 = 3
"costs $5"              // no interpolation
```

An interpolated string is divided into several tokens. The text before each `${` becomes an `<interpolation>` token carrying that text, the expression follows as ordinary tokens, and the text after the last `}` becomes a final `<string>` token:

```
"a ${x} b ${y} c"  →  <interpolation>"a "  x  <interpolation>" b "  y  <string>" c"
 
interpolated_string ::= <interpolation> expression ( <interpolation> expression )* <string>
```

The lexer finds the `}` that ends an interpolation by counting braces, so map literals and blocks may appear inside one. Two restrictions apply:

- Interpolations may be nested **at most 4 levels** deep
- A string inside an interpolation **must not use the same delimiter** as the string enclosing it.

```tea
"name: ${ person["name"] }"    // error: same delimiter inside the interpolation
"name: ${ person['name'] }"    // OK
```

#### Long Strings

A long string is opened and closed by **three** delimiter characters `"""`, `'''` or ` ``` ` and may span lines. Its content is taken literally:

```tea
var text = """
First line
Second line
"""
```

- A line break immediately after the opening delimiter is discarded
- Every line break inside the string is stored as a single `\n`, regardless of the line ending used in the source
- **No escape sequences and no interpolation** are processed; `\` and `${` stand for themselves
- The string ends at the first occurrence of the delimiter character, which must begin a run of three. A long string therefore **cannot contain its own delimiter character**. To include `"`, delimit the string `'''` or ` ``` ` instead
- An unclosed long string is an _unfinished string_ error

### Escape Sequences

Escape sequences are recognized in short string only.

| Escape | Value |
| --- | --- |
| `\"` `\'` `` \` `` `\\` `\$` | The character itself |
| `\0` | NUL (0) |
| `\a` | Alert bell (7) |
| `\b` | Backspace (8) |
| `\t` | Horizontal tab (9) |
| `\n` | Line feed (10) |
| `\v` | Vertical tab (11) |
| `\f` | Form feed (12) |
| `\r` | Carriage return (13) |
| `\e` | Escape (27) \
| `\xHH` | The byte with the given two hexadecimal digits |
| `\uHHHH` | A Unicode code point (four hexadecimal digits), encoded as UTF-8 |
| `\UHHHHHHHH` | A Unicode code point (eight hexadecimal digits), encoded as UTF-8 |
| `\D` `\DD` `\DDD` | The byte with the given decimal value |

Details:

- Hexadecimal digits may appear upper or lower case, and exactly the stated number must follow `\x`, `\u` or `\U`
- A Unicode escape must denote a code point from `U+0000` to `U+10FFFF` and must not be a surrogate (`U+D800` to `U+DFFF`)
- A decimal escape has one to three digits, the first of which is `1` to `9`, and its value must not exceed 255. `\0` is always NUL, so `\065` is NUL followed by the characters `6` and `5`. Use `\x41` or `\65` for `A`.
- Any other character after a backslash is an _invalid escape sequence_ error; a backslash at the end of the source is an unfinished string

```tea
"caf\u00E9"       // café, encoded as UTF-8
"\x48\x69"        // Hi
"line1\nline2"
"cost: \$5"
```

## Lexical Errors

| Condition | Typical cause |
| --- | --- |
| Unexpected character | `@`, `#`, `\` or `$` outside a string |
| Malformed number | `1__0`, `10_`, `1.`, `12abc`, `1.5.3` |
| Unfinished string | Missing closing delimiter; line break in a short string; delimiter character inside a long string |
| Invalid escape sequence | `\q`, or a decimal escape above 255 |
| Invalid hexadecimal escape | `\xZZ`, or fewer than two digits |
| Invalid Unicode escape | Too few digits, above `U+10FFFF`, or a surrogate |
| Interpolation too deep | More than 4 levels |
| Reused delimiter in interpolation | `"${ "x" }"` |
| Unfinished comment | `/*` without a matching `*/` |
| Too many lines | The source exceeds the line limit |
