---
title: The Virtual Machine
number: "4."
weight: 1801
---

The Teascript virtual machine is a stack-based bytecode interpreter. It executes the prototypes produced by the parser (or loaded from precompiled bytecode) against a single value stack and a single stack of call records, both owned by the interpreter state `tea_State`. The same machinery runs scripts, module bodies, class methods, operators overloads, iterator functions and finalizers, and it is the engine behind every call made from the C API into Teascript.

This chapter describes how that machinery is implemented. How the interpreter loop is structured and how it keeps its cached registers consistent with the state, how frames are laid out and how arguments are adjusted, how native and Teascript code call each other, how upvalues are captured and closed, how errors are raised and unwound, what a traceback is built from, and which rules the VM must observe so that the garbage collector can run at any allocation. The semantics of the language itself belong to the Language Specification and are only restated where the implementation defines them.

The chapter documents the reference implementation, so it names internal functions, macros and structure fields. None of these are part of the public C API.

## Overview

### Components

| Component | Role |
| --- | --- |
| `vm_execute` | The interpreter loop. Runs Teascript frames until the frame it was entered with returns. |
| `vm_precall`, `vm_call`, `vm_invoke` | Frame setup; resolve what is being called, adjust arguments, push a call record. Native functions run to completion inside `vm_call` |
| `tea_vm_call` | The entry point for calls from C and from inside the VM (meta methods, iterators, finalizers). Calls `vm_precall` and, for a Teascript callee, `vm_execute` |
| `tea_vm_pcall` | Protected call: runs a function under an error handler and restores the stacks if it fails |

## Execution Loop

### Entry and Exit

`vm_execute` has no parameters besides the state. It starts running the frame that is current `T->ci` and returns when that frame returns. Whoever enters it has already set up the frame; for a Teascript callee, `vm_call` (reached through `vm_precall`) has pushed the call record and left arguments on the stack.

On entry `vm_execute` marks the frame _beneath_ the entry frame as an interpreter boundary by assigning `CIST_REENTRY` to its `state` (see The Call Stack). The loop terminates in exactly one way: `RETURN` pops a frame and finds that the frame underneath is not marked `CIST_CALLING`, which means it was not entered by this loop. The result is then already in place on the stack and `vm_execute` simply returns.

A call from one Teascript function to another through `CALL`, `INVOKE`, `NEW` or `SUPER` does not recurse in C. The new frame and the loop continues in the callee, and `RETURN` resumes the caller in the same activation. Consequently the nesting depth of Teascript-to-Teascript calls is bounded by the call-info and value stacks, not by the C stack. Only the re-entrant paths described in Re-entrancy consume C stack.

### Cached Registers

The loop keeps two registers in C locals:

| Local | Meaning |
| --- | --- |
| `ip` | Instruction Pointer. Points to the next byte of bytecode in the current prototype |
| `base` | Stack base. Pointer to slot 0 of current frame in the value stack |

The stack top is not cached; every instruction reads and writes `T->top` directly, which keeps native code and the interpreter in aggreement about it.

Both registers are only valid until something can invalidate them. The bytecode never moves, but `ip` must be written back before anything that can inspect or resume the frame, and `base` must be re-read after anything that can reallocate the value stack. The protocol is expressed by two macros:

| Macro | Effect |
| --- | --- |
| `STORE_FRAME` | `T->ci->ip = ip`. Required before any operation that can raise an error (so tracebacks see the current position), call back into the VM, or push a new frame |
| `READ_FRAME()` | Reloads `ip` and `base` from `T->ci`. Required after any such operation returns |

Instruction that call out (`CALL`, `INVOKE`, `NEW`, `SUPER`, the attribute and index instructions, `GETITER`, `FORITER`, `IN`, `LISTEXTEND`, the import instructions and the arithmetic fallbacks) bracket the call with these two macros. The fast paths for numbers use neither.

`RUNTIME_ERROR(...)` is the shorthand for raising an error from inside the loop: it performs `STORE_FRAME`, raises the error with caller context, and, for form's sake, would continue with `READ_FRAME` and dispatch. Since raising an error never returns, that continuation is unreachable.

### Dispatch

Two dispatch strategies are selected at build time:

- With `TEA_COMPUTED_GOTO` (compilers supporting addressable label gotos), a static table of label addresses is generated from the opcode list, and `DISPATCH()` reads the next opcode byte and jumps through the table. Each instruction ends with its own indirect jump.
- Otherwise, the loop is a `switch` over the bytecode byte, and `DISPATCH()` jumps back to the top of the loop.

Both strategies execute identical instruction bodies.

## The Call Stack

### Value Stack and Frames

The interpreter state owns one contiguous value stack `T->stack` to `T->stack_max`, with `T->top` the first free slot, and one array of call records `CallInfo`, from `T->ci_base` to `T->ci_end`, with `T->ci` the current one. A call record holds:

| Field | Meaning |
| --- | --- |
| `func` | The function being run |
| `ip` | Saved instruction pointer (Teascript frames only; `NULL` for native frames). Only current after a `STORE_FRAME` |
| `base` | Pointer to the frame's slot 0 |
| `state` | Flags, see below |

A frame is laid out as follows:

```
          slot 0     slots 1..n      locals    temporaries
        +--------+-----------------+---------+--------------+
 stack: | callee |  arg1 ... argN  |   ...   |      ...     |  (free)
        +--------+-----------------+---------+--------------+
         ^ ci->base                                         ^ T->top
```

Slot 0 holds either the function being called (plain calls), the receiver (method calls, where it is `self`), or, for a class instantiation, the new instance. Arguments occupy slots 1 to N; the compiler assigns locals to the following slots, and expression temporaries live above them. All `slot` operands are relative to `base`.

A call always consumes the callee slot, the arguments and anything above them, and leaves a single value in their place. On return the VM sets `T->top = base`, copies the result into that slot and advances `top`. A function always produces exactly one result; there is no multipl-return convention.

On entry to a Teascript function the VM ensures that `max_slots` slots are available above the arguments (`tea_state_checkstack`), then pushes a call record (`tea_state_growci`). Because either operation can reallocate its array, no pointer into the value stack or the call-info array may be held across a call that can enter the VM; code that must do so converts pointers to offsets first (`stack_save`/`stack_restore`, `ci_save`/`ci_restore`, as `tea_vm_pcall` does).

### Frame State Flags

| Flag | Meaning |
| --- | --- |
| `CIST_TEA` | The frame runs a Teascript function |
| `CIST_C` | The frame runs a native function |
| `CIST_CALLING` | Set on a frame that has called a Teascript function in the same interpreter activation, so that the callee's `RETURN` resumes it instead of leaving `vm_execute` |
| `CIST_REENTRY` | Set on the frame beneath the entry frame of a `vm_execute` activation |

`CALL`, `INVOKE`, `NEW` and `SUPER` set the _caller_ frame's state to `CIST_TEA | CIST_CALLING` after a Teascript frame has been pushed, and `vm_execute` sets the frame beneath its entry frame to `CIST_REENTRY`, replacing whatever it held. `CIST_CALLING` is never cleared explicitly. The invariant that makes `RETURN` correct is that the frame directly beneath the entry frame of an activation always has `CIST_REENTRY` and never `CIST_CALLING`, because entering the activation rewrote it, while every frame above it that has called a Teascript function in the activation has been marked by that call.

## Calling Native Functions

A native function is a `GCfunc` of the C kind, created with `tea_push_cfunction`/`tea_push_cclosure` or registered through `tea_Reg` and `tea_Methods` records. It carries a function pointer, the number of required arguments `nargs`, the number of optional arguments `nopts`, a type and its own array of upvalues, stored by value.

`vm_call` runs a native function to completion:

1. Unless `nargs` is `TEA_VARG`, the argument count is checked. For methods, the registered `nargs` includes the receiver, hence `nargs - extra`.
2. At least `TEA_STACK_START` free slots are guaranteed (`tea_state_checkstack`), and a call record with `state = CIST_C` and `ip = NULL` is pushed.
3. `T->base` is set so that stack index 0 is the first argument (or receiver, for methods)
4. The function is called as `fn(T)`. It reads its arguments with the `tea_check_*` and `tea_opt_*` families, which resolve indices against `T->base`.
5. On returns, the value on top of the stack is the result. The call record is popped, `T->base` is restored, `T->top` is reset to the frame's slot 0 and the result is pushed there.

Two properties follow.

A native function returns `void` and the VM takes whatever is on top of the stack as the result; the VM does not verify that the function pushed anything. And a native call needs no `vm_execute` activation of its own. `vm_call` returns `false` for it, and the interpreter loop simply continues with the result on the stack.

Native functions call Teascript back through the API, which ends in `tea_vm_call` (see Re-entrancy). Errors raised by native functions are raised "in the context of the caller". The message is built, a traceback is attached while the native frame is still on the call stack, and the error is thrown. Argument errors report the 1-based argument number, translating negative indices to absolute ones.

## Re-entrancy

`vm_execute` can be entered while another activation of it is suspended further up the C stack. This happens whenever the VM or a native function needs to call Teascript and wait for the result:

- operator overloads and the `==` metamethod (`vm_arith`, `vm_arith_unary`);
- the `[]`, `[]=`, `getattr` and `setattr` metamethods and property accessors (inside `tea_meta_*` and `vm_invoke`);
- `contains` (`IN`), `iter` (`GETITER`), and the iterator function itself (`FORITER`);
- the importer running a module body;
- native functions calling back through the API;
- finalizers run by the garbage collector (see Interacting with the GC).

In every case the entry point is `tea_vm_call`, whose convention is that the callee slot and the arguments are already on the stack. `func` points at the function (which may live outside the stack, for example in a class's method table), and slot `top - nargs - 1` holds the receiver or function that becomes slot 0 of the new frame.

Each activation:

- consumes C stack, so deep re-entrant recursion is limited by `T->nccalls` against `TEA_MAX_CCALLS`; exceeding it raises a stack overflow error;
- marks the frame beneath its entry frame with `CIST_REENTRY`, which clobbers that frame's previous `state` (for a native caller this overwrites `CIST_C`);
- returns by leaving the result in the callee's slot 0, like any other call.

`nccalls` is incremented only by `tea_vm_call`. The decrement is skipped when an error is thrown; `tea_vm_pcall` restores the value it saved. Because the interpreter can be re-entered at the points above, every instruction that may do so saves `ip` first and reloads the registers afterwards.

## Upvalue Closing

A Teascript closure (`GCfuncT`) holds an array or pointers to upvalue objects (`GCupval`). An upvalue has a `location` pointer that is either a slot in the value stack (_open_) or the upvalue's own `closed` field (_closed_). Because every access goes through `location` (`GETUPVAL`, `SETUPVAL`), the same code serves both states, and a closure sees the same variable as the function that declared it for as long as the declaring frame is alive.

#### Creating closures
`CLOSURE` calls `tea_func_newT(T, pt, parent)` with the running function as `parent`. The prototype carries one descriptor per upvalue: an index and the flag `PROTO_UV_LOCAL`. For a local descriptor, the closure captures the current frame's slot `base + idx`, found or created by `tea_func_finduv`; otherwise it shares the parent's upvalue number `idx`. The new function is pushed on the stack while its upvalues are created, since creating them allocates, and its `upvalue_count` is only set to the final value after every pointer is initialized: until then the collector sees a function with zero upvalues and does not follow uninitialized pointers. (`tea_func_newT_empty`, used for top-level chunks, creates upvalue slots set to `NULL` with the final count.)

#### Open upvalue list
The state keeps all open upvalues in a singly linked list, ordered by decreasing stack address. `tea_func_finduv` walks the list while the entries lie above the requested slot, returns the entry if one already points at the slot, and otherwise inserts a new upvalue at that position. Two closures capturing the same variable thus share one upvalue object. The list is also a GC root.

#### Closing
`tea_func_closeuv(T, last)` closes every open upvalue whose location is at or above `last`: the value is copied into `closed`, `location` is redirected to it, and the upvalue is unlinked. The VM calls it:

| Where | Argument | Purpose |
| --- | --- | --- |
| `RETURN` | the frame's `base` | Closes everything the frame owns. |
| `CLOSEUPVAL` | the slot on top of the stack | A captured local going out of scope before its frame ends. The slot is then popped. |
| `tea_vm_pcall` after an error | the level at which the protected call started | Closes upvalues of the frames being unwound. |
| `tea_err_throw` with no handler | the base of the first frame | The same, before invoking the panic function. |

Open upvalues hold raw pointers into the value stack, so any code that reallocates the stack has to rewrite them. A native closure does not use upvalue objects: its upvalues are plain values stored in the function and are reached with the upvalue pseudo-indices of the C API.

## Error Dispatch

### Mechanism

Errors are non-local exits implemented with `setjmp`/`longjmp`. The state keeps a chain of handlers. Each protected region (`tea_err_protected`) allocates a `tea_longjmp` record on the C stack holding a link to the previous handler, a `jmp_buf` and a status, and installs it in `T->error_jump`. Throwing an error (`tea_err_throw(T, code)`) stores the code in the innermost handler and jumps to it; the protected region restores the previous handler and returns the code.

If there is no handler:

- when a panic function is installed (`tea_at_panic`), the stack is reset to its base, the error value is moved to the first slot, open upvalues are closed, and the panic function is called;
- in every case, after the panic function returns, or when there is none, the process terminates with `exit(EXIT_FAILURE)`.

### Protected Calls and Unwinding

`tea_vm_pcall(T, func, ud, old_top)` is the protected entry used by the API and by the loader. It records the number of nested C calls, the current call record and the current base, as offsets so they survive stack reallocation, runs `func` under an error handler, and on failure:

1. closes the upvalues of the frames being abandoned, from `old_top` upward;
2. moves the error value (top of the stack) into the slot at `old_top` and sets `top` just above it;
3. restores `nccalls`, `T->ci` and `T->base`;
4. recomputes stack limits (`tea_state_relimitstack`), which may shrink a stack that grew during the failed call.

The caller then finds exactly one value, the error, where the call's results would have been, together with the status. No other state is repaired. Objects the failed call left half-built are simply unreachable and collected by the next cycle. This is why code that allocates in several steps keeps every intermediate object rooted on the stack (see Interacting with the GC).

## Interacting with the GC

### When Collection Runs

The collector is a stop-the-world mark-and-sweep collector driven entirely by allocation. Every allocation goes through `tea_mem_realloc`, which adds the size change to `T->gc.total` and, whenever an allocation _grows_ memory and the total exceeds `T->gc.next_gc`, runs a full collection before performing the allocation. After a collection the threshold is set twice the live total. With `TEA_DEBUG_STRESS_GC` defined, a collection is run before every growing allocation; with `TEA_DEBUG_LOG_GC` each cycle is logged.

There are no safe points. Any instruction or helper that allocates (creating a list, map, range, instance, bound method, closure or string, or growing a list or table) can trigger a collection, and a collection can in turn run Teascript finalizers.

### What the VM Must Guarantee

For the collector to be correct, the VM follows a few rules:

1. **Every live value is reachable from a root**. The roots are: all stack slots from `T->stack` up to `T->top`, the function of every active call record, the open upvalue list, the registry, the module table `T->modules`, the global table, and the base-type class roots. Slots above `top` are dead, so a value being built must be on the stack (or reachable from something that is) before the next allocation. For this reason `vm_argcheck` pushes the variadic list before filling it, `tea_func_newT` pushes the closure before creating its upvalues, `tea_module_new` and `tea_loadx` root the module and its name while they set up and parse, and the finalizer loop keeps the userdata on the stack during the call.
2. **Objects are fully initialized before the next allocation.** Object constructors set every field the collector follows before returning (class `init` to `nil`, instance and module tables initialized empty, module variable arrays `NULL` with size 0), and `tea_func_newT` delays setting `upvalue_count`, as described above.
3. **Registers survive collection, but not necessarily finalizers.** A collection neither moves objects nor reallocates the value stack, so `ip` and `base` stay valid across it. A finalizer, however, re-enters the VM and may grow the stack. Instructions that call out are bracketed by `STORE_FRAME`/`READ_FRAME`; the plain allocating instructions (`LIST`, `MAP`, `RANGE`, `CLOSURE`, ...) are not.
4. **Special method names are not traced.** The roots loop starts at the base-type classes; the interned names of the special methods (`gc`, `new`, operators) sit below that index, so they rely on the collector's fixed mark (`TEA_GC_FIXED`), which keeps an object from being cleared by the sweep.
Two further facts about what the collector follows are relevant to VM code:

- A closure's reference to its module (`GCfuncT.module`) is not traced by the collector; modules are kept alive by the module table. A function that outlives the table entry of its module would therefore hold a dangling pointer.
- Class method tables, instance attributes, module exports and variables, list and map contents, bound-method receivers, prototype constants and closed upvalues are traced; strings and ranges have no references.

### Finalizers and Re-entrancy

Userdata whose class defines the `gc` special method are finalized in two steps. During a collection, after the normal marking, unreachable userdata with a `gc` method that have not been finalized yet are moved to a separate list (`mmudata`), re-marked together with everything they reference, and so survive the cycle. After the sweep, `tea_gc_finalize_udata` pops them from the list one at a time, flags each as finalized (so the method runs only once), puts it back in the ordinary userdata list, pushes it as the receiver and calls its `gc` method through `tea_vm_call`. The object is collected by a later cycle if it is still unreachable after the finalizer returns.

Because the finalizers run inside `tea_mem_realloc`, they execute at an arbitrary allocation point of whatever code triggered the collection, in the middle of a VM instruction. This is a re-entrant activation like any other, with these consequences: finalizers must not assume anything about the instruction in progress; the interrupted instruction reloads its registers afterwards; and an error escaping from a finalizer propagates as an error raised by the allocating instruction, because the finalizer call is not itself protected.

### Collection and Errors

An error unwound by `tea_vm_pcall` may leave unreachable objects behind. The program driver forces a complete collection after a failing chunk (see The tea Program), but nothing in the VM depends on it: garbage left by a failure is reclaimed by the normal allocation-driven cycles.
