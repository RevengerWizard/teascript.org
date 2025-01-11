---
title: Syntax
weight: 110
toc: true
---

## Keywords

```tea
and
as
break
case
class
const
continue
default
do
else
false
for
from
function
if
import
in
is
nil
not
operator
or
return
self
static
super
switch
true
var
while
```

## Comments

Line comments start with `//` and end at the end of the line:

```tea
// This is a comment
```

Block comments start with `/*` and end with `*/`. They can span multiple lines:

```tea
/*  This
    is
    a
    multi-line
    comment 
*/
```

prec | operator | description | associates
---|---|---|---
1 | `.` `()` | Grouping, calls | Left
2 | `[]` | Subscript | Left
3 | `not` `!` `~` | Negate, Not, Complement | Right
4 | `**` | Power | Left
5 | `*` `/` `%` | Multiply, Divide, Modulo | Left
6 | `+` `-` | Add, Subtract | Left
7 | `..` | Range | Left
8 | `<<` `>>` | Left shift, Right shift | Left
9 | `&` | Bitwise and | Left
10 | `^` | Bitwise xor | Left
11 | `\|` | Bitwise or | Left
12 | `<` `>` `<=` `>=` | Comparison | Left
13 | `is` | Type test | Left
14 | `==` `!=` | Equals, not equal | Left
15 | `and` | Logical and | Left
16 | `or` | Logical or | Left
17 | `=` | Assignment | Right