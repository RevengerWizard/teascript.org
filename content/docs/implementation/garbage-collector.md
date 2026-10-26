---
title: Garbage Collector
number: "7."
weight: 1805
---

Teascript reclaims memory automatically with a stop-the-world, non-moving, precise mark-and-sweep collector. This chapter describes how a collection cycle works. When one starts, what it treats as roots, how marking is organized, why the collector needs no write barrier, in which order finalizers run, and how userdata take part in the cycle.

The chapter is about the collector iself. The layout of the objects it traverses and the allocation interface that triggers it are in the Memory Model chapter; the rules the interpreter must follow so that a collection can run at any allocation, and the way finalizers re-enter the virtual machine, are in Virtual Machine chapter. Those topics are only recalled here where the algorithm depends on them.

## Algorithm

### Properties

| Property | Description |
| --- | --- |
| Stop-the-world | A cycle runs to completion inside one allocation call. The program does not execute while marking and sweeping, and is resumed only to run finalizers after the cycle. |
| Non-incremental, non-generational | Every cycle examines the whole heap. There is no separate young generation and no partial collection. |
| Non-moving | Objects never change address, so raw pointers to objects (and into their arrays) stay valid across a collection. |
| Precise | The collector knows the type of every object and the location of every reference in it; it never guesses whether a word is a pointer. |
| Allocation-driven | Collection is started only by the allocator, by comparing the heap size against a threshold; there is no timer or background activity. |

### When a Cycle Starts

All managed memory is counted in `T->gc.total`. The allocation entry point (`tea_mem_realloc`) starts a cycle, before it performs a growing allocation, when `total` exceeds `T->gc.next_gc`. A cycle can also be forced by the C API (`tea_gc`), which the standalone interpreter does after a chunk fails, and, in debug builds with `TEA_DEBUG_STRESS_GC`, happens before every growing allocation.

At the end of each cycle the threshold becomes twice the memory still in use (`GC_HEAP_GROW_FACTOR` is 2). The heap can thus double between cycles, so the amortized cost of collection is proportional to the amount allocated. The threshold is recomputed _before_ finalizers are run, so memory allocated by finalizers counts towards the next cycle.

There is no guard against a collection being requested while another one is in progress; see Finalization Order for the places where that can happen.

### Phases

`tea_gc_collect` performs the following steps in order:

```
mark roots --> trace --> separate userdata --> mark pending --> trace --> sweep --> finish
(gc_mark_roots) (gray     (tea_gc_separate-    userdata        (gray     3 lists    shrink,
                 stack)    udata)               (mmudata)       stack)               threshold,
                                                                                     finalizers
```

| Step | Function | What it does |
| --- | --- | --- |
| 1. Mark roots | `gc_mark_roots` | Marks every object directly reachable from the interpreter state (see Roots). |
| 2. Trace | `gc_trace_references` | Repeatedly takes an object from the gray stack and marks everything it references, until the stack is empty. |
| 3. Separate userdata | `tea_gc_separateudata` | Scans the userdata list for objects that were not reached and have to be finalized, and moves them to the pending list `mmudata` (see Interaction with Userdata). |
| 4. Mark pending userdata | `gc_mark_mmudata` | Marks everything the pending userdata reference, so that they and their contents survive this cycle. |
| 5. Trace | `gc_trace_references` | Propagates those marks. |
| 6. Sweep | `gc_sweep` | Frees every unmarked object in the userdata list, in every bucket of the string table, and in the main object list, and clears the marks of the survivors. |
| 7. Finish | | Halves the string table if it has become sparse, shrinks the two temporary buffers, sets the next threshold, then runs the pending finalizers (`tea_gc_finalize_udata`). |

Marking costs time proportional to the live objects and their references; sweeping costs time proportional to *all* objects, living or dead. Marking uses no recursion: the traversal is driven by an explicit gray stack, so the depth of a data structure (a long chain of lists, a deeply nested map) does not consume C stack.

### Roots

Roots are references that live outside the object graph:

| Root | Marked how |
| --- | --- |
| The value stack | Every slot from the bottom of the stack up to `T->top`. Slots above `top` are dead and are not examined. |
| Active functions | The function of every call record, from the first to the current one. |
| Open upvalues | Every upvalue in the state's open list. |
| The registry | The registry value. |
| Module table | `T->modules`, keys and values. |
| Global table | `T->globals`, keys and values. |
| Base classes | The classes for the base types and the root object class (`GCROOT_KLBASE` to the end of the root array). |

Three kinds of object are _not_ roots, by design:

- **Strings.** The interning table is weak: it holds every string but marks none. A string survives only if something else refers to it, or if it is fixed.
- **Special-method names.** The names of the special methods occupy the first entries of the root array, which the root scan skips; they are expected to carry the fixed mark.
- **Pending userdata.** Userdata waiting for finalization are kept alive by step 4, not as roots.

## Tri-Color Marking

The collector follows the classic tri-color abstraction, but it does not store a color in each object. The three colors are implied by the `marked` byte of the header together with membership in the gray stack:

| Color | Meaning | Representation |
| --- | --- | --- |
| White | Not reached yet; garbage if still white when marking ends. | `marked == 0` |
| Gray | Reached, but its references have not been examined. | `marked != 0` and present on the gray stack |
| Black | Reached, and all its references have been examined (and are themselves gray or black). | `marked != 0` and no longer on the gray stack |

All objects are white between cycles: allocation creates them with `marked == 0`, and the sweep clears the mark of every survivor.

### Marking

`gc_markobj` is the white-to-gray transition. It ignores a null pointer and any object whose `marked` is already nonzero; otherwise it sets `marked` to 1 and pushes the object on the gray stack, growing the stack first if necessary. Marking a value (`gc_markval`) marks its object when the value's tag is a collectable one, and does nothing for numbers, booleans, `nil` and raw pointers.

`gc_trace_references` is the gray-to-black transition. It pops an object and *blackens* it with `gc_blacken`, which marks each object the popped object refers to, according to its type (the complete list of references is given in Outgoing References in the Memory Model chapter). Tables are traced entry by entry: every key, and for each entry its value or, for an accessor entry, the accessor slot. The loop ends when the gray stack is empty, which is when no gray object remains and the black set is closed under reference.

The traversal order is last-in-first-out: the most recently marked object is examined first. The order has no effect on the result.

### The Gray Stack

The gray stack is a vector of object pointers with a count and a capacity. It grows geometrically when it fills up. It is allocated directly through the allocator function, bypassing the memory accounting: growing it does not change `total` and so cannot start a nested collection in the middle of marking. It is released at shutdown. If its growth fails, a memory error is raised.

### Fixed Objects

An object with the `TEA_GC_FIXED` flag in `marked` is never collected: it is treated as already marked by `gc_markobj`, and the sweep preserves its mark. Because marking returns immediately for such an object, **its references are never traced**. The flag is therefore only appropriate for objects that refer to nothing, which is the case of the strings it is used for.

### Resurrected Userdata

Step 4 breaks the rule that marking starts from roots. A pending userdata is reset to white (`marked = 0`) and blackened directly, which marks its class, its attributes and everything reachable from them. The userdata itself is not on any list the sweep visits, so it survives regardless of its color. Its referents survive because they are marked.

## The Write Barrier

**The collector has no write barrier, and does not need one.**

A write barrier is required by incremental and concurrent collectors, in which the program runs between two steps of marking and may store a reference to a white object into a black one, breaking the tri-color invariant (no black object refers to a white object) and causing a live object to be freed. In Teascript the whole mark phase runs inside a single call, with the program suspended. By the time program code runs again, marking has finished and the sweep has reset every survivor to white, so there is never a moment at which the program can observe or modify a black object.

This has three consequences for the rest of the implementation:

- **Stores need no hooks.** Assignments into lists, maps, tables, instances, module variables and upvalues, and every other write of a reference, are plain stores. None of the structure code contains collector bookkeeping.
- **Only reachability matters.** The only requirement the program has to meet is that a live object is reachable from a root at the instants an allocation can start a cycle. The rules for meeting it are described in the Virtual Machine chapter.
- **Finalizers are safe.** Finalizers run after the cycle is complete and before the program resumes, with the heap in a consistent, all-white state, so Teascript code in a finalizer needs no special treatment.
The price is pause time: a cycle's duration grows with the whole heap, and the program is stopped for all of it. A future incremental mode would need barriers on every reference store into an object, on closing an upvalue, and on writes to the stack; none of that exists today.

## Finalization Order

Finalization applies to userdata only. Other object types have no finalizers. A userdata is finalized when it becomes unreachable and its class defines the special method `gc`; the method is then called once, with the object as its receiver.

### Which Objects, and in What Order

`tea_gc_separateudata` runs after the first marking pass. It walks the userdata list from its head. The list is in reverse order of creation, because new userdata are linked at the head. For each object, the scan:

1. leaves alone any object that was marked (it is reachable) or that has already been finalized;
2. for an unmarked object whose class has no `gc` method in its method table, sets the finalized flag on it, so that later scans skip it;
3. unlinks every other unmarked object and appends it to a private list in the order it is met.
The private list is then placed in front of whatever was already pending (objects left over from an earlier, interrupted run of finalizers), and becomes the pending list. The result is that, within one cycle, **finalizers run from the most recently created userdata to the oldest**, and that objects pending from earlier cycles run after the new ones. Running newer objects first is the useful order when a later object depends on an earlier one it was created from: the dependent object is finalized while the object it depends on is still fully valid.

All objects reachable from any pending userdata are kept alive for the cycle (step 4). A finalizer can therefore use anything its object refers to, including other pending userdata, which are ordinary objects as far as it is concerned but whose own finalizers may or may not have run yet, depending on the order above.

### Running the Finalizers

After the sweep and the threshold update, `tea_gc_finalize_udata` runs the pending list. For each object, taken from the head of the list, it:

1. moves the object back to the userdata list, so it is once again a regular object;
2. stores it in a stack slot, which keeps it reachable while its method runs;
3. clears its mark and sets the finalized flag, so that it is never selected again;
4. if the class has a `gc` method, calls it through the virtual machine with the object as receiver and no other arguments, and discards the result.
An object whose method has run is an ordinary userdata again. If the finalizer stored a reference to it somewhere reachable (resurrection), it stays alive; if not, a later cycle frees it, without calling the method again.

Finalizers are not protected. An error raised inside one propagates out of the allocation that started the cycle, leaving the remaining pending userdata on the list; they are picked up by the next cycle. A finalizer is also free to allocate, which can start another collection: that nested cycle runs while the outer one is past its sweep, and adds any new unreachable userdata to the front of the pending list.

### At Shutdown

`tea_gc_freeall` releases every object in the main list, the userdata list and the string table without marking, and then the gray stack. It calls each userdata's C finalizer through the object's free function, but it does not run `gc` methods: those are Teascript code, and no Teascript code can run after the heap is being torn down.

## Interaction with Userdata

Userdata differ from other objects in three ways that the collector has to account for.

### A Separate List

Userdata are linked into `T->gc.rootud` instead of the main object list, so the collector can find them without scanning every object. The list has two roles: the sweep treats it like any other list, and `tea_gc_separateudata` scans it each cycle to select the ones to finalize.

```
 T->gc.root     --> obj --> obj --> ...            all objects except strings and userdata
 T->gc.rootud   --> ud  --> ud  --> ...            all live userdata, newest first
 T->gc.mmudata  --> ud  --> ud  --> ...            pending finalization (empty between cycles)
 T->str.hash[i] --> str --> str --> ...            one chain per bucket
```

An object is on exactly one of these lists at a time, linked through its `nextgc` field. Moving a userdata to `mmudata` and back is a relinking and never copies it.

### Two Kinds of Finalizer

A userdata can have two independent cleanup mechanisms:

| Mechanism | Defined by | Runs | Can call Teascript | Typical use |
| --- | --- | --- | --- | --- |
| `gc` special method | The userdata's class (Teascript or native method) | After the sweep, once, while the object is still fully usable | Yes | Releasing resources that Teascript code manages, flushing state |
| C finalizer `fd` | The code that created the userdata (see `tea_set_finalizer`) | When the object's memory is released, during the sweep or at shutdown | No | Closing a `FILE`, freeing a buffer |

The `gc` method runs first and the object may still be referenced afterwards; `fd` runs only at the point where the object is destroyed, receives the payload pointer and must not use the API: during the sweep the heap is mid-modification. Objects that only need `fd` never go through finalization at all.

### What the Collector Traces

The tracing code visits a userdata's class and its attribute table (keys and values). The payload is opaque to the collector; references that native code keeps inside it are invisible, so such code has to keep what it refers to alive by other means, typically by storing it as an attribute. The user values stored between the header and the payload are not visited by the tracing code.

Instances share this treatment: they trace their class and attribute table in the same way, and are ordinary members of the main list.

## Debugging Options

Two build options help when investigating collector problems:

| Option | Effect |
| --- | --- |
| `TEA_DEBUG_STRESS_GC` | Runs a full collection before every allocation that grows memory. Slow, and makes a missing root fail immediately and reproducibly. |
| `TEA_DEBUG_LOG_GC` | Prints a line at the start and end of each cycle with the bytes before and after and the next threshold. |
