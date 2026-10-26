---
title: The Interpreter
number: "3."
weight: 1800
---

Teascript source is never interpreted directly, and it is never turned into a syntax tree. A single component, the parser in `tea_parse.c`, reads the token stream once, from the first token to the last, and emits bytecode for the virtual machine while it parses. When the input ends, the bytecode, the constants and the other tables of each function have been assembled into function prototypes, and the outermost one, the chunk, is ready to run. Teascript is designed to be compiled this way; the grammar and the scoping rules allow every decision the compiler has to make to be taken with the tokens seen so far and at most one token of lookahead.

This chapter describes that compiler. How it is organized around a stack of per-function states, how it emits and measures code without an intermediate representation, how it resolves variable names to storage during parsing, how control flow is compiled using jump patching, and how a finished function is packed into a prototype. The syntax, the operator precedence table and the scoping rules of the language are defined in the Language Specification and are not repeated here; what follows is only how the compiler handles them.

## Single-Pass Architecture

### From Text to Function

Loading a chunk (`tea_loadx`, described in The tea Program) runs a protected helper that sets up the lexer and calls `tea_parse`. The result is a prototype, which is wrapped in a closure with no upvalues belonging to the chunk's module and left on the stack. The whole path is as follows:

```
reader callback --> lexer --> parser/compiler --> GCproto (chunk) --> closure --> VM
  (file, string)   tea_lex.c    tea_parse.c        tea_func_newT_empty
```

The input is pulled through a reader callback in blocks, and the lexer produces tokens on demand, so neither the complete source text nor the complete token list exists at any time. There is no abstract syntax tree and no separate code generation pass. Functions of the parser emit instructions as soon as they have recognized the construct that requires them.

`tea_parse(ls, eval)` creates the state for the chunk as a function of kind `FUNC_SCRIPT`, primes the token window, and compiles either a sequence of declarations (`parse_chunk`) or, in _eval mode_ (used by `tea_eval`), a single expression followed by `RETURN`.

### The Token Window

The lexer exposes three tokens at a time in the lexer state:

- `prev`, the last consumed token;
- `curr`, the token being examined;
- `next`, one token lookahead.

`tea_lex_next` shifts the window by one. The parser is therefore LL(2) at worst; the second token is used in exactly the places where the first one is ambiguous:

| Decision | Tokens inspected |
| --- | --- |
| A statement starting with a name is a multiple assignment rather than an expression | name followed by `,` |
| A parenthesis starts an arrow function's parameter list rather than a grouping | `(` then `)` followed by `=>`, or `(` then a name followed by `,` or `)` |
| Adjacent string literals joined by `+` can be merged at compile time | `+` followed by a string |

Because the window is shared, the parser has no backtracking and **never** re-reads a token. Error positions use `prev`, so a syntax error is reported on the line of the last token consumed.

### Pratt Parsing and Assignment Flag

Expressions are parsed by precedence climbing driven by a table. `expr_rule(tok)` returns a `ParseRule` with an optional _prefix_ function, an optional _infix_ function and the token's binding power. `expr_prec(fs, prec)` consumes a token, runs its prefix function, and then keeps running infix functions while the next token binds at least as tightly as `prec`. The precedence levels themselves are those of the language definition.

Since no tree is built, an assignment target cannot be identified after the fact.
Instead, every prefix and infix function receives an `assign` flag, which is true when the expression is being parsed at assignment precedence or lower, meaning an assignment would be legal here. A function that has just parsed something assignable (a name, an attribute access, a subscript) looks at the token that follows. If it is `=` or a compound assignment operator, and `assign` is set, it parses the right-hand side and emits the store, otherwise it emits the load.
The three places where this happens are `parse_named`, `expr_dot` and `expr_subscript`. For a compound assignment the target is loaded, the operand parsed, the operator applied and the result stored, without evaluating the target's sub-expressions twice (`PUSHATTR` and `PUSHIDX` keep the object and index on the stack for this purpose). If a `=` is still pending after an expression that did not accept it, `expr_prec` reports an invalid assignment target.

### The Function State Stack

The compiler's working state for a function is a `FuncState`. States form a stack linked through `prev`, mirroring the nesting of the source; the chunk's state is at the bottom. A new state is created on the C stack when the parser enters a function body (`parse_body`) and is dropped when the body has been compiled, so the nesting depth of functions is a recursion on the C stack. The state of the function currently being compiled is `ls->fs`.

A `FuncState` holds everything the compiler needs while the function is open:

| Field | Purpose |
| --- | --- |
| `kt` | Constant table under construction: a map from each constant to its index (see Constants). |
| `pc`, `bcbase`, `bclimit` | Position in, base of and room left in the bytecode buffer. |
| `locals`, `local_count`, `scope_depth` | The locals currently in scope, their count and the current block nesting. |
| `upvalues`, `uvmap`, `nuv` | The upvalues captured so far (see Scope and Upvalue Resolution). |
| `numparams`, `numopts`, `flags` | Parameter counts and prototype flags (variadic, has nested functions). |
| `max_slots` | The compiler's running estimate of the stack space the function needs. |
| `loop`, `klass` | The innermost loop being compiled and the innermost class being compiled. |
| `info` | The kind of function (below). |
| `linedefined`, `name` | Debug information for the prototype. |

Function kinds determine a few details: the name given to the prototype, what the zeroth local is called, how the body is parsed and what an implicit `return` yields.

| Kind | Slot 0 | Implicit result | Notes |
| --- | --- | --- | --- |
| `FUNC_SCRIPT` | unnamed | `nil` | The chunk. `return` is rejected; `export` is allowed. |
| `FUNC_NORMAL`, `FUNC_ANONYMOUS`, `FUNC_STATIC` | unnamed | `nil` | Anonymous functions are named `<anonymous>`. |
| `FUNC_ARROW` | unnamed | the body expression | An expression body is followed by `RETURN`. |
| `FUNC_METHOD`, `FUNC_OPERATOR` | `self` | `nil` | `FUNC_OPERATOR` takes its name from the enclosing method's operator. |
| `FUNC_INIT` | `self` | `self` | The constructor returns the instance; `return` with a value is an error. |
| `FUNC_GETTER`, `FUNC_SETTER` | `self` | see below | The getter has no parameter list and its body is a bare block. |

Slot 0 of every function is reserved because it is the callee slot of the call frame (see the Virtual Machine chapter).
It holds the receiver for methods, which is why it is bound to the name `self` there, and the function itself otherwise, which is why it has no usable name.

### One Bytecode Buffer for All Functions

Code is emitted into an array of `BCInsLine` records, an instruction byte together with the source line it came from, held in the lexer state and grown on demand. Instructions are byte-granular. An opcode and each of its operand bytes are separate entries, each with its own line number, taken from the last token consumed when it was emitted.

All open functions share this one array. A function state does not own a buffer; it owns a _window_ into the array that starts where its parent's code currently ends:

```
ls->bcstack
 ┌──────────────────────────────┬───────────────────────────┐
 │ parent's code (pc bytes)     │ child's code (growing)    │ ···
 └──────────────────────────────┴───────────────────────────┘
 ^ parent->bcbase               ^ child->bcbase = parent->bcbase + parent->pc
```

The parent's `pc` does not move while the child is compiled. When the child is finished, its bytes are copied into its prototype and the region is abandoned; the parent continues writing at its own `pc`, over the space the child used. Since the array may be reallocated when it fills up, `bcbase` is recomputed after each growth, and `parse_body` recomputes the parent's `bcbase` and `bclimit` once the child is done. No pointer into the array is ever kept across a point where it can grow.

### Emission and Stack Accounting

Code is emitted by a small set of functions (`bcemit_op`, `bcemit_arg`, `bcemit_jump`, `bcemit_loop`, `bcemit_return` and so on) which append bytes and, for opcodes, update `max_slots`. The instruction set is declared once in an X-macro table `BCDEF` with, for each opcode, its stack effect and its number of operand bytes; the parser derives two arrays from it, `bc_effects` and `bc_argcount`. Once each emitted opcode `max_slots` is increased by the opcode's static stack effect, and at the end of a block it is decreased by the number of locals released. The resulting value is stored in the prototype as the function's stack requirement and is what the VM reserves when it enters the function.

The compiler follows the discipline of a stack machine. An expression leaves exactly one value on the stack, an expression statement is followed by a `POP`, and every statement is stack-neutral, so the compile-time number of locals is at every point the true height of the locals on the runtime stack. This is what allows a variable's stack slot to be decided at declaration time.

### Constants

Each function has a constant table, built as a map from constant index while the function is beign parsed (`const_num`, `const_str`, `const_gc`). Numbers are keyed by value, and strings and prototypes (both interned or unique objects) by indentity, so a constant used many times occupies one slot. The index is an 8-bit operand; `fs_finish` raises an error if the table has more than 255 entries.

The map has two other uses. It is anchored on the interpreter stack from `fs_init` to `fs_finish`, so everything it refers to (strings from the lexer, prototypes of nested functions) is reachable by the collector while the function is being compiled.
And the lexer registers every string it creates through `tea_parse_keepstr`, which inserts it in the current function's map with a boolean marker instead of an index; the markers keep the strings alive but are skipped when the table is converted into the prototype.

### Prototype Construction

`fs_finish` converts a function state into a prototype in one allocation. It first computes the total size, then allocates the object and fills in the four allocated arrays, in this order:

```
GCproto
┌──────────────┬──────────────┬─────────────────┬──────────────────┬───────────────────┐
│ header (72)  │ bytecode     │ constants       │ upvalue          │ line info         │
│              │ pc bytes     │ nk × TValue     │ descriptors      │ (pc-1) × 1, 2     │
│              │              │                 │ nuv × uint16     │ or 4 bytes        │
└──────────────┴──────────────┴─────────────────┴──────────────────┴───────────────────┘
```

- **Bytecode**: the instruction bytes are copied out of the shared buffer.
- **Constants**: every key of the constant map is stored at the index it was assigned.
- **Upvalue descriptors**: the `uvmap` array of 16-bit entries (the high byte is nonzero for a local of the enclosing function, the low byte is the slot or upvalue index).
- **Line information**: for each instruction byte after the first, its line expressed as the difference from the line where the function was defined. The width of each entry is chosen from the number of lines the function spans. One byte under 256 lines, two bytes under 65536, four bytes beyond. The first byte of a function needs no entry, as it belongs to the line of the definition.

The function then pops its constant map off the stack and unlinks them from `ls->fs`. The caller `parse_body` records the new prototype as a constant of the enclosing function and emits a `CLOSURE` instruction naming it, so a nested function costs the parent one constant slot and two bytes of code.

### Syntax Nesting and Errors

Expressions and declarations are parsed by recursive functions, so the depth of the parse is bounded explicitly. `expr_prec` and `parse_decl` count nesting levels (`synlevel_begin`/`synlevel_end`) and raise an error when the limit `TEA_MAX_XLEVEL` is reached, so that a pathologically nested program cannot overflow the C stack.

The parser has no error recovery.
The first error is raised through the lexer's error function, which unwinds with a syntax error to the protected call that loads the chunk; everything the compiler allocated up to that point is garbage and is reclaimed by the collector. Errors detected by the compiler itself are of two kinds: syntax errors, and violations of limits, which report either the chunk or, when inside a function, the line the function began.

## Scope and Upvalue Resolution

Every name used in a program is resolved at compile time to a storage location and an instruction.
A reference to a variable is never looked up by name while the program runs, with the single exception of attribute and index accesses. This is possible in one pass because, at any point of the parse, the compiler holds the complete lexical environment of the current position: open locals of the current function, and, in the suspended states beneath it, those of every enclosing function.

### Kinds of Storage

| Storage | Where it lives | Declared by | Get/set instructions |
| --- | --- | --- | --- |
| Local | A slot of the function's stack frame | `var`, `const`, parameters and loop variables inside any function or block | `GETLOCAL`/`SETLOCAL` |
| Upvalue | A captured local of an enclosing function | referencing a local of an enclosing function | `GETUPVAL`/`SETUPVAL` |
| Module variable | A slot in the module's variable array | `var`, `const`, `function`, `class` and imports at the top level of a chunk | `GETMODULE`/`SETMODULE` |
| Global | The state's global table | the host and the standard library | `GETGLOBAL` (readonly) |

A declaration at nesting depth of zero of a _chunk_ creates a module variable; every other declaration creates a local. Function parameters are always local, since a function's parameter list opens its own scope.

### Resolution Order

`var_find` resolves an identifier by trying each kind in order, innermost first:

1. A local of the current function (`var_lookup_local`), searching the locals array from the most recently declared back to the first, so inner declarations shadow outer ones.
2. An upvalue (`var_lookup_uv`): a local, or an already captured upvalue, of an enclosing function.
3. A module variable (`var_lookup_var`).
4. A global, but only when the name is being read, and only when it is present in the global table _at compile time_.
5. Otherwise, a compile-time error for an undefined variable.

The consequence of step 4 is that a name that is neither declared in the program nor registered by the host before compilation does not compile; there are no implicit globals, and assigning to a global is never legal.

### Locals and Scopes

A `Local` records the name (an interned string, compared by pointer), the scope depth at which it was declared, whether it is a constant, whether a closure captures it (`isupval`), and whether it has been initialized (`init`).
The _index_ in the locals array is the stack slot. `local_count` starts at 1 because slot 0 belongs to the callee, and each declaration appends an entry, which is correct because the initializing value is pushed onto the stack at exactly that position.

Declaration is split in two steps to implement the scoping rules in one pass:

- `var_declare` adds the name to the locals (or the module variables) with `init` false. Declaring a name twice at the same depth is an error; declaring at a deeper depth shadows it.
- `var_define` marks it initialized after its initializer has been compiled.

While a variable is uninitialized, lookup does not see it.
The search simply stops and falls through to the next kind, so in `var a = a` the right-hand `a` refers to an outer variable. A function declaration is the exception and its name is marked initialized before the body is compiled, so the function can refer to itself.

`scope_begin` increments the `scope_depth`.
`scope_end` closes the scope by emitting one instruction for each local of the scope, from the last to the first (`CLOSEUPVAL` if the local has been captured, `POP` otherwise), then removes the from the array, reduces `max_slots`, and decrements the depth.
The same emission without the bookkeeping is available as `scope_close` and is used by `break` and `continue` to discard the locals of the scopes they leave on their way out of a loop, without ending those scopes for the code that follows.

Because capture can only happen in code that appears after the declaration, the `isupval` flag of a local is complete by the time the scope ends. Cleanup code emitted earlier on an early-exit path (a `break`) cannot be skipping a capture that already exists.

### Hidden Locals

Some constructs need stack slots that no name can refer to.
The compiler creates locals for whem with names a program cannot write:

| Construct | Hidden locals |
| --- | --- |
| `for ... in` | `"seq "` and `"iter "` (note the trailing space): the sequence and its iterator. `GETITER` and `FORITER` take their slots as operands. |
| `class ... : Super` | `super`: the superclass value, kept in a scope that spans the class body, so methods capture it as an upvalue. |
| Method `self` | slot 0 of methods, constructors and operators. |

### Module Variables

At depth zero the compiler does not allocate stack slots. Names are recorded in the lexer state's variable list (`vstack`, with the name, a constant flag and an `init` flag), and the position in that list is the index of the variable in the module's variable array. Defining one emits `SETMODULE idx` followed by `POP`, and for an exported name also `DEFMODULE`, which stores the value in the module's exports table.
Declaration order matters for multiple declarations. A list of names initialized from an unpacked value is defined from the last name to the first, because the values are popped from the top of the stack.

Module variables are what makes top-level code cheap to reference.
Any function in the chunk reaches them through the module of the running closure, with no upvalue and no capture, which is why top-level variables never appear in a prototype's upvalue descriptors. A function body can mention a module variable that has been declared but not yet initialized (so mutually recursive top-level functions are possible provided the names are declared first), while code at depth zero cannot use one before its initialization.

The module's variable array is allocated when compilation of the chunk ends (`var_fixup_end`), sized to the number of names, with every variable first set to `nil`.
A chunk compiled into a module that already has variables first copies their names into `vstack` (`var_fixup_start`), marked initialized, so the new code resolves them to the same slot; the array is then enlarged.
This is how consecutive chunks of the same module, such as the entries of an interactive session, see each other's top-level variables. As a consequence, re-declaring an existing top-level name is the same error as re-declaring it within a single chunk.
The `const` flag is not preserved across chunks.

<!-- `const` status should probably be kept, somehow? -->

### Upvalue Resolution

An upvalue is resolved by walking outwards through the function state stack.
`var_lookup_uv(fs, name)` works recursively:

1. Look up the name up as a local of the immediately enclosing function (`fs->prev`). If found, set the local's `isupval` flag, so its scope will close it with `CLOSEUPVAL` rather than discard it, and add an upvalue to `fs` that refers to that slot, flagged as local.
2. Otherwise recurse; look the name up as an upvalue of the enclosing function, which may in turn capture it from the function above that. If it is found, add an upvalue to `fs` that refers to the enclosing function's upvalue, flagged as non-local.
3. At the outermost function there is nothing to search and the lookup fails.

`var_add_uv` records the capture as an index, a local flag and the constness, and returns the upvalue's number in `fs`; if an identical capture is already recorded, it returns that number, so a name referenced many times is captured once.
The upvalue count of a function is limited by `TEA_MAX_UPVAL` and by the 8-bit operand.

A name used three functions deep produces a chain of descriptors, each function capturing from the one directly above it:

```
function a() {                      a: local x            slot 1
    var x                           b: upvalue 0  <-- {local,    index 1}   (x in a)
    function b() {                  c: upvalue 0  <-- {non-local, index 0}   (b's upvalue 0)
         function c() { return x }
    }                               c compiles `x` to GETUPVAL 0
}
```

At runtime each `CLOSURE` instruction executes the descriptors of its prototype. A local descriptor captures (or reuses) an open upvalue on the slot of the creating frame, and a non-local descriptor copies the creating closure's upvalue pointer, as described in the Virtual Machine chapter. 
The compiler's work stops at emitting them.

Constness travels with the capture.
An upvalue inherits the constant flag of the variable it refers to, and the assignment check (`check_const`) tests it for locals, upvalues and module variables alike, so assigning to a captured constant is a compile-time error.

### Compile-time Class Context

The compiler also tracks the class being compiled in a small `KlassState` chain, copied into the state of every function nested in a method, so that closures inside methods may use `self` and `super`. The chain records whether the class has a superclass and whether the current member is static or an operator. 
`self` outside a class or in a static member, and `super` outside a class or in a class with no superclass, are compile-time errors. Both names are otherwise ordinary variables: `self` is the zeroth local of a method, captured as an upvalue by nested functions, and `super` is the hidden local described above.

## Constant Folding

Constant folding, the evaluation at compile time of expressions whose operands are constants (`2 * 60`, `-1`, `not true`), is **not implemented yet** and is planned. Every such expression is currently compiled to the instructions that compute it at run time.

The only transformation of this kind in the compiler is a narrow one performed by the string literal parser.
When a string literal is immediately followed by `+` and another string literal, the literals are concatenated into one constant, repeatedly, before any code is emitted. The merged literal then takes part in whatever operators or calls follow it.

## Jump Patching

A single pass compiler has to emit a jump before it knows where it will land.
This is a classic problem, and Teascript solves this with _backpatching_ of 16-bit relative offsets. The jump is emitted with a placeholder operand, the position of the placeholder is remembered by the function that emitted it, and the operand is filled in when the target is reached. There are no jump lists, labels or fixup tables; since the language has only structured control flow, the remembered position is enough and lives in a local variable of the parsing function, which keeps it alive for exactly as long as it is needed.

### Forward Jumps

`bcemit_jump(op)` emits the instruction with a placeholder operand of `0xFFFF` and returns the position of the operand. When the target is reached, `bcpatch_jump(pos)` stores in the operand the distance from the end of the operand to the current position. If it does not fit in 16 bits, the compiler raises a "jump too long" error. The VM adds the operand to the instruction pointer after reading it, so the stored value is exactly the number of bytes to skip.

Backward jumps need no patching, as the target is known when they are emitted. `bcemit_loop(start)` emits `LOOP` with the distance back to `start`, and raises an error if it exceeds 16 bits.

### Conditional Code

The conditional jumps `JMPFALSE` and `JMPNIL` leave the tested value on the stack. The compiler therefore emits an explicit `POP` on each path that continues, so that both paths agree on the stack height at the join. The statement and operand forms share the same skeleton:

```
if cond { A } else { B }          and:  a and b            or:  a or b

    <cond>                            <a>                      <a>
    JMPFALSE ──────────┐              JMPFALSE ────┐            JMPFALSE ──┐
    POP                │              POP          │            JMP ──────┐│
    <A>                │              <b>          │            ┌─────────┘│
    JMP ────────┐      │         ┌──► (end)  ◄─────┘            │  POP ◄───┘
    ┌───────────┼──────┘         │                              │  <b>
    │  POP      │                                               └► (end)
    │  <B>      │
    └──► (end) ◄┘
```

`and` and `or` are short-circuit jumps that keep the deciding operand as the value of the expression. When the left operand decides the result, the jump skips the `POP` and the right operand, leaving the left value on the stack. The conditional operand `a ? b : c` has the same shape as `if`.
`switch` keeps one end jump per `case` in a local array, which is patched all at once after the last cause; `JMPCMP` jumps over a case body that does not match.

### Loops

Every loop is compiled with a `Loop` record, linked through `prev` to the enclosing loop held in `fs->loop`. It stores the position of the loop's start (the target of `continue` and of the closing backward jump), the position where the body begins, the `scope_depth` of the loop, and, when the loop has a condition that can fail, the position of that exit jump.

```
while cond { body }                 do { body } while cond              for init; cond; step { body }

start:  <cond>                      start:  <body>                      <init>
        JMPFALSE ─► exit                    <cond>                      start:  <cond>
        POP                                 JMPFALSE ─► exit                    JMPFALSE ─► exit
        <body>                              POP                                 POP
        LOOP ─► start                       LOOP ─► start                       JMP ─► body
exit:   POP                         exit:   POP                         step:   <step>
end:                                end:                                        POP
                                                                                LOOP ─► start
                                                                        body:   <body>
                                                                                LOOP ─► step
                                                                        exit:   POP
```

(`exit` is entered with the condition value still on the stack, so it begins with a `POP`; `end` follows it)

In the three-clause generic `for`, the loop's start is moved to the step clause once that has been compiled, so that `continue` and the end of the body run the step before testing the condition again. A variable declared in the first clause is copied into a fresh hidden variable at the start of each iteration and copied back at its end, so a closure created in the body captures that iteration's own copy.

`for ... in` has no condition test of its own.
`FORITER` calls the iterator and `JMPNIL` leaves the loop when it returns `nil`. The iterator and the sequence live in the two hidden locals, and the loop variables are declared in a scope inside the loop, so they are discarded after each iteration and the body starts with a clean stack.

### break and continue

`continue` is a backward jump: after discarding the locals of the scopes it leaves (`scope_close`), it emits `LOOP` to the start of the innermost loop.

`break` is the case where backpatching alone is not enough, because a loop can contain any number of breaks, nested at any depth, and the compiler would need to remember all of them. Instead, `break` emits its cleanup and then a placeholder: the opcode `BC_END`, a three-byte instruction with the same shape as a jump, which has no other use. When the loop ends, `loop_end` first patches the loop's condition exit and emits the closing `POP`, then scans the bytecode from the start of the loop body to the current position. The scan steps from one instruction to the next using the operand-count table (`bc_argcount`), so operand bytes are never taken for opcodes, and turns each `BC_END` it finds into a `JMP` patched to the current position, which is after the `POP`. This is why `break` skips the cleanup of the condition value: it is not on the stack on that path. Nested loops patch their own breaks in the same way when they end, and the outer loop's scan then finds ordinary jumps.

### Spread Arguments

A call argument preceded by `...` is compiled to the expression followed by a `SPREAD` instruction whose operands are a 16-bit distance and the number of arguments as written.
The distance and the final count depend on the end of the argument list, which the compiler has not reached, so the position of the operands is recorded in the argument context of the call (`ArgCtx`). When the call instruction has been emitted, `arg_patch` goes back and patches each recorded `SPREAD` with the distance to the call's argument-count operand and the static argument count.
At run time `SPREAD` overwrites that operand with the true count, as described in the Virtual Machine chapter.

