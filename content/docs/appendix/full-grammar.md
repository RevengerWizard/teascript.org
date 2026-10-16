---
title: Full Grammar
number: A.
weight: 100
---

This appendix collects the grammar of Teascript in one place, written in the notation defined in [Notation and Conventions](notation-and-conventions.md). It consolidates the productions given throughout this specification; each chapter remains the authority for the _meaning_ of the constructs.

The grammar has two parts. The **lexical grammar** has characters as its alphabet and defines the tokens; the **syntactic grammar** has tokens as its alphabet and defines the structure of programs. Expressions are written here as a stratified grammar, one production per precedence level, which is equivalent to the precedence table of [Expressions](expressions.md#operator-precedence-table).

## EBNF

```
(* ======================================================================== *)
(*  LEXICAL GRAMMAR                                                         *)
(* ======================================================================== *)

(* ---- Source text ---- *)

token_stream  ::= ( whitespace | comment | token )* <eof>
token         ::= keyword | symbol | <name> | <number> | <string> | <interpolation>

whitespace    ::= ' ' | '\t' | '\v' | '\f' | line_break
line_break    ::= '\r\n' | '\n\r' | '\n' | '\r'

comment       ::= line_comment | block_comment
line_comment  ::= '//' [^\n]*
block_comment ::= '/*' ( block_comment | any )* '*/'          (* comments nest *)

(* ---- Keywords and symbols ---- *)

keyword       ::= 'and' | 'as' | 'break' | 'case' | 'class' | 'const'
                | 'continue' | 'default' | 'do' | 'else' | 'export' | 'false'
                | 'for' | 'from' | 'function' | 'if' | 'import' | 'in' | 'is'
                | 'new' | 'nil' | 'not' | 'operator' | 'or' | 'return' | 'self'
                | 'static' | 'super' | 'switch' | 'true' | 'var' | 'while'

symbol        ::= '(' | ')' | '[' | ']' | '{' | '}'
                | ',' | ';' | ':' | '.' | '?' | '=>'
                | '+' | '-' | '*' | '/' | '%' | '**'
                | '&' | '|' | '^' | '~' | '<<' | '>>'
                | '==' | '!=' | '<' | '<=' | '>' | '>=' | '!'
                | '..' | '...'
                | assign_op

assign_op     ::= '=' | '+=' | '-=' | '*=' | '/=' | '%=' | '**='
                | '&=' | '|=' | '^=' | '<<=' | '>>='

(* ---- Identifiers ---- *)

<name>        ::= ? name that is not a keyword ?
name          ::= name_start name_part*
name_start    ::= [A-Za-z_]
name_part     ::= [A-Za-z0-9_]

(* ---- Numbers ---- *)

<number>      ::= integer | float

integer       ::= digits | '0' [xX] hex_digits
float         ::= digits '.' digits exponent?
                | digits exponent
                | '0' [xX] hex_digits '.' hex_digits hex_exponent?
                | '0' [xX] hex_digits ( '.' hex_digits )? hex_exponent
exponent      ::= [eE] [+-]? digits
hex_exponent  ::= [pP] [+-]? digits
digits        ::= [0-9] ( '_'? [0-9] )*
hex_digits    ::= [0-9A-Fa-f] ( '_'? [0-9A-Fa-f] )*

(* ---- Strings ---- *)

q             ::= "'" | '"' | '`'               (* the three delimiters are equivalent *)

(* A string without interpolation is a single <string> token. A string with
   interpolations is scanned as <interpolation> ... <string> tokens: the '}'
   that closes an interpolation is found by counting braces. *)

<string>        ::= q string_item* q                        (* plain string *)
                  | '}' string_item* q                      (* last piece of an interpolated string *)
                  | q q q long_char* q q q                  (* long string; q is the same character *)
<interpolation> ::= q string_item* '${'                     (* first piece *)
                  | '}' string_item* '${'                   (* middle piece *)

string_item   ::= string_char | escape
string_char   ::= ? any byte except the delimiter, '\', a line break, and the start '${' of an interpolation ?
long_char     ::= ? any byte except the delimiter character; no escapes and no interpolation ?

escape        ::= '\' ( q | '\' | '$' | '0' | 'a' | 'b' | 't' | 'n' | 'v' | 'f' | 'r' | 'e'
                      | 'x' hex_digit hex_digit
                      | 'u' hex_digit hex_digit hex_digit hex_digit
                      | 'U' hex_digit hex_digit hex_digit hex_digit
                            hex_digit hex_digit hex_digit hex_digit
                      | [1-9] [0-9]? [0-9]? )               (* decimal value at most 255 *)
hex_digit     ::= [0-9A-Fa-f]


(* ======================================================================== *)
(*  SYNTACTIC GRAMMAR                                                       *)
(* ======================================================================== *)

(* ---- Programs ---- *)

chunk         ::= declaration* <eof>
eval_chunk    ::= expression <eof>                          (* evaluation of one expression *)

declaration   ::= class_declaration
                | function_declaration
                | variable_declaration
                | statement

block         ::= '{' declaration* '}'

(* ---- Declarations ---- *)

variable_declaration ::= ( 'var' | 'const' ) declarators
declarators   ::= <name> '=' expression ( ',' <name> '=' expression )*
                | <name> ( ',' <name> )* ( '=' expression_list )?
                | rest_binding ( ',' rest_binding )+ '=' expression     (* exactly one '...' *)
rest_binding  ::= '...'? <name>
expression_list ::= expression ( ',' expression )*

function_declaration ::= 'function' <name> '(' parameters? ')' block
                       | 'function' <name> ( '.' <name> )+ '(' parameters? ')' block
                       | 'function' <name> ( '.' <name> )* ':' <name> '(' parameters? ')' block

parameters    ::= parameter ( ',' parameter )*
parameter     ::= <name>
                | <name> '=' expression
                | '...' <name>

class_declaration ::= 'class' <name> ( ':' expression )? '{' member* '}'
member        ::= 'new' '(' parameters? ')' block                      (* constructor *)
                | 'function' <name> '(' parameters? ')' block          (* method *)
                | 'static' <name> '(' parameters? ')' block            (* static method *)
                | 'operator' operator_symbol '(' parameters? ')' block (* operator method *)
                | <name> block                                         (* getter *)
                | <name> '=' '(' parameters? ')' block                 (* setter *)
operator_symbol ::= '+' | '-' | '*' | '/' | '%' | '**'
                  | '&' | '|' | '~' | '^' | '<<' | '>>'
                  | '<' | '<=' | '>' | '>=' | '=='
                  | '[' ']' | '[' ']' '='

(* ---- Statements ---- *)

statement     ::= ';'
                | block
                | if_statement
                | switch_statement
                | while_statement
                | do_statement
                | for_statement
                | for_in_statement
                | break_statement
                | continue_statement
                | return_statement
                | import_statement
                | from_statement
                | export_statement
                | multiple_assignment
                | expression_statement

if_statement  ::= 'if' expression block ( 'else' ( if_statement | block ) )?

switch_statement ::= 'switch' expression case_clause* default_clause?
case_clause   ::= 'case' expression ( ',' expression )* block
default_clause ::= 'default' block

while_statement ::= 'while' expression? block
do_statement  ::= 'do' block 'while' expression

for_statement ::= 'for' for_init ';' expression ';' expression block
for_init      ::= ( 'var' | 'const' ) <name> ( '=' expression )?
                | expression
for_in_statement ::= 'for' ( 'var' | 'const' ) <name> ( ',' <name> )* 'in' expression block

break_statement    ::= 'break'
continue_statement ::= 'continue'
return_statement   ::= 'return' expression?

multiple_assignment ::= <name> ( ',' <name> )+ '=' expression_list
expression_statement ::= expression

(* ---- Modules ---- *)

import_statement ::= 'import' logical_import ( ',' logical_import )*
                   | 'import' path_import ( ',' path_import )*
logical_import  ::= <name> ( 'as' <name> )?
path_import     ::= path ( 'as' <name> )?
from_statement  ::= 'from' module_ref 'import' import_item ( ',' import_item )*
module_ref      ::= <name> | path
import_item     ::= <name> ( 'as' <name> )?
path            ::= <string>
                  | <interpolation> expression ( <interpolation> expression )* <string>

export_statement ::= 'export' ( variable_declaration | function_declaration | class_declaration )
                   | 'export' '{' <name> ( ',' <name> )* '}'

(* ---- Expressions, from lowest to highest precedence ---- *)

expression    ::= assignment | conditional

assignment    ::= target assign_op expression               (* right-associative *)
target        ::= <name>
                | postfix '.' <name>
                | postfix '[' expression ']'

conditional   ::= logical_or ( '?' expression ':' expression )?   (* right-associative *)

logical_or    ::= logical_and ( 'or' logical_and )*
logical_and   ::= equality ( 'and' equality )*
equality      ::= class_test ( ( '==' | '!=' ) class_test )*
class_test    ::= comparison ( ( 'is' | 'is' 'not' | 'not' 'in' ) comparison )*
comparison    ::= bitwise_or ( ( '<' | '<=' | '>' | '>=' | 'in' ) bitwise_or )*
bitwise_or    ::= bitwise_xor ( '|' bitwise_xor )*
bitwise_xor   ::= bitwise_and ( '^' bitwise_and )*
bitwise_and   ::= shift ( '&' shift )*
shift         ::= range ( ( '<<' | '>>' ) range )*
range         ::= additive ( '..' additive ( '..' expression )? )?      (* ranges do not chain *)
additive      ::= multiplicative ( ( '+' | '-' ) multiplicative )*
multiplicative ::= power ( ( '*' | '/' | '%' ) power )*
power         ::= unary ( '**' unary )*                     (* left-associative *)
unary         ::= ( 'not' | '!' | '-' | '~' ) unary
                | postfix

postfix       ::= primary ( call | member | subscript )*
call          ::= '(' arguments? ')'
member        ::= '.' ( <name> | 'new' )
subscript     ::= '[' index ']'
index         ::= expression
                | expression ':'
                | expression ':' expression
                | expression ':' expression ':' expression
                | expression ':' ':' expression

arguments     ::= argument ( ',' argument )*
argument      ::= expression | '...' expression

primary       ::= 'nil' | 'true' | 'false'
                | <number>
                | string_expression
                | <name>
                | 'self'
                | super_expression
                | list_literal
                | map_literal
                | function_expression
                | '(' expression ')'

string_expression ::= <string>
                    | <interpolation> expression ( <interpolation> expression )* <string>

super_expression  ::= 'super' ( call | '.' <name> call? )?

list_literal  ::= '[' ( list_item ( ',' list_item )* ','? )? ']'
list_item     ::= expression | '...' expression

map_literal   ::= '{' ( map_entry ( ',' map_entry )* ','? )? '}'
map_entry     ::= <name> '=' expression
                | '[' expression ']' '=' expression

function_expression ::= 'function' '(' parameters? ')' block
                      | '(' parameters? ')' '=>' ( expression | block )
```
