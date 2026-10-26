---
title: Core Data Structures
number: "6."
weight: 1804
---

Almost everything a Teascript program manipulates is stored in one of a handful of runtime data structures. The interned string table, growable lists, hash maps keyed by arbitrary values, and string-keyed hash tables that hold globals, modules, class method tables and instance attributes. This chapter describes how each of them is represented in memory, how it grows and shrinks, how it is traversed, and what the collector needs from it. It also describes how classes, instances, bound methods and userdata are built from these pieces.

The structures live in `tea_str.c`, `tea_list.c`, `tea_map.c`, `tea_tab.c` and `tea_udata.c` with the object layouts in `tea_obj.h`. The language-level behavior of strings, lists and maps (indexing rules, methods) is defined by the Language Specification and the standard library, and is not repeated here.

## Overview

| Structure | Object | Keys | Collision strategy | Entries counted for load |
| --- | --- | --- | --- | --- |
| String table | none (part of the state) | string contents | Separate chaining (intrusive chains) | Live strings |
| List | `GClist` | integer index | Not hashed; contiguous array | Not applicable |
| Map | `GCmap` | any value except `nil` and NaN | Open addressing, linear probing | Live entries only |
| Table `Tab` | embedded in other objects and in the state | interned strings | Open addressing, linear probing | Live entries **and** tombstones |

The three hash structures index with `hash & (size - 1)`, so every capacity is a power of two. Capacities are chosen by the growth macro `TEA_MEM_GROW` and a minimum (`TEA_MIN_VECSIZE`); the exact values are build constants of the implementation.

All vectors are allocated through the memory manager (`tea_mem_newvec`, `tea_mem_growvec`, `tea_mem_freevec`), so their sizes are accounted for in the collector's byte count and every growth can trigger a collection (see Allocation and GC safety).

## String Table

Every string is an immutable `GCstr` object. A header (GC header, a `reserved` byte used by the lexer to recognize keywords, the 32-bit `hash` and 32-bit `len`) followed directly by the character data and a terminating NUL byte. The characters are bytes; the structure attaches no encoding to them.

Strings are _interned_. For any byte sequence there is at most one `GCstr` in the state. Consequently, two strings are equal if their pointers are equal, and no code outside the interning function ever compares string contents. Table lookups by name, map keys and equality tests all rely on this.


The one exception to "created through the table" is the empty string. `tea_str_new` never allocates for length zero. It returns the state's preallocated `strempty` object. The same object is returned by the substring helped when the result is empty. A length of `TEA_MAX_STR` or more raises a string overflow error.

### Hashing

The hash is 32-bit FNV-1a over every byte of the string. The accumulator starts at 2166136261, and for each byte it is XORed with the byte and multiplied by 16777619. It is computed once, when the string is created, and stored in the object. Strings are hashed in full, regardless of length.

<!-- This may not be very performant for very large strings, since it will try and hash its whole contents -->

### Interning Table Growth

The interning table is an array of chain heads, `T->str.hash`, of `T->str.size` buckets (a power of two), plus the count of live strings `T->str.num`. Strings are linked into their bucket through the ordinary GC `nextgc` field, which means interned strings are **not** on the collector's main object list. They are swept bucket by bucket, and freed one by one at shutdown.

`tea_str_new(T, chars, len)` computes the hash, walks the chain of bucket `hash & (size - 1)` and returns an existing string whose hash, length and bytes all match. Otherwise it allocates a new string, copies the bytes, appends the NUL, pushes the string at the head of its chain and increments `num`.

| Event | Rule |
| --- | --- |
| Growth | After inserting a string, if `num < size` the table is doubled. The load factor therefore stays at or below 1 |
| Shrinkage | At the end of each collection's sweep, if `num < size / 4` and `size` is above twice the minimum table size, the table is halved |
| Rehash | `tea_str_resize` allocates a new bucket array and moves each existing string to its new bucket using the stored hash; no string is hashed again. Chain order within a bucket is not preserved |

The table is created at startup with the minimum size (`tea_str_init`). Keywords are ordinary interned strings; the lexer marks them in their `reserved` field (zero for every other string), so it can tell a name from a reserved word with a single field read after interning.

### Substrings

`tea_str_slice(T, str, range)` creates the substring `[start, end)` of a string. `end` is the range's end: if it is infinite the string's length is used; otherwise it is clamped to the length, and a negative value counts from the end. `start` is converted to an integer and used as given, and the step is not applied. If `start > end` the result is the empty string; otherwise the bytes between the two indices are interned as a new string.

## Lists

A `GClist` holds three fields:

- `len`, the number of elements in use;
- `size`, the capacity of the element array;
- `items`, a separately allocated array of `TValue`. The array is not part of the object, so growing a list reallocates only the array, and the list object keeps its address.

`tea_list_new(n)` allocates an array of capacity `n` (none for `n = 0`) and starts with `len = 0`. A request above `TEA_MAX_MEM32` elements raises a list overflow error. The element array is allocated before the list object, and slots from `len` upward are never initialized; the collector only scans the first `len` slots.

### Growth Strategy

`tea_list_add`, `tea_list_addn` and `tea_list_insert` call `tea_mem_growvec` when `len + 1 > size`. The growth function doubles the capacity, enforces the minimum vector size, and clamps the result to `TEA_MAX_MEM32`. Appending is therefore amortized constant time. Capacity is never reduced: removing elements only decrements `len`, and the array is released when the list is freed.

| Operation | Behavior | Cost |
| --- | --- | --- |
| `tea_list_add` | Grow if full, store at `len`, increment | amortized O(1) |
| `tea_list_insert(idx)` | Grow if full, shift elements `idx .. len - 1` up by one, store. Valid indices are `0 .. len` (`len` appends) | O(`len` - `idx`) |
| `tea_list_delete(idx)` | Shift elements `idx + 1 .. len - 1` down by one, decrement `len`. The vacated last slot keeps its old value, which the collector never sees because it lies beyond `len`. | O(`len` - `idx`) |
| `tea_list_copy` | Creates an empty list and appends every element, so the copy's capacity follows the growth sequence, not the original's capacity. | O(`len`) |

The index-taking function assume validated indices; range checking and negative-index normalization are done by their callers.

### Slicing

`tea_list_slice(T, list, range)` builds a new list from a range. The end is normalized like a string's (infinite means the length, larger values clamp to the length, negative values count from the end); the start and the step are used as given. Elements are appended while `i < end` for a positive step, or `i > end` for a negative one, advancing by `step` each time. The new list is pushed on the stack for the duration of the loop so that it is reachable while it grows.

## Maps

### Hash Table Layout

A `GCmap` holds:

- `count` live entries;
- `size` capacity, a power of two;
- `entries` an array of `MapEntry`, each a key `TValue` and a value `TValue`. A new map has `size = 0` and no array; storage is allocated on the first insertion.

A slot is in one of three states, encoded in the slot itself:

| State | Key | Value |
| --- | --- | --- |
| Empty (never used) | `nil` | `false` |
| Tombstone (deleted) | `nil` | `true` |
| Live | not `nil` | the stored value |

Since `nil` is never a valid key, the value field of a key-less slot is free to carry the empty/tombstone marker. Storing `nil` or NaN as a key raises an error a NaN would never compare equal to itself and could not be found again.

**Key equality** is `tea_obj_rawequal`: numbers, booleans and `nil` compare by value, and every object compares by identity. Since strings are interned this is value equality for strings, but a list, map or range used as a key matches only the very same object, even though `==` on such values is structural.

**Hashing** depends on the key's type:

| Key | Hash |
| --- | --- |
| `nil` | constant 1 |
| boolean | constant 2 (`true` and `false` share a bucket chain) |
| number | the 64-bit integer mixer applied to the number converted to an integer |
| pointer, and any object other than string | the mixer applied to the object's address |
| string | the string's stored FNV hash, with no further mixing |

The integer mixer is Thomas Wang's 64-bit integer hash, reduced to 30 bits. Because numbers are converted to integers before mixing, numbers with the same integer part (for example `1`, `1.25` and `1.5`) have the same hash and share a probe sequence; they are still distinguished by key equality.

### Collisions and Deletion

Collisions are resolved by linear probing. Lookup starts at `hash & (size - 1)` and steps one slot at a time with wrap-around until it finds the key or an empty slot. The same routine serves lookup and insertion. When the key is absent it reports the first tombstone met on the way, if any, or the empty slot that ended the probe, so that insertion reuses tombstones.

| Operation | Behavior |
| --- | --- |
| Lookup (`tea_map_get`) | Returns a pointer to the value, or `NULL`. Returns immediately for a map with `count == 0` |
| Store (`tea_map_set`) | Rejects `nil` and NaN keys. If `count + 1 > size * 0.75` the map is first resized to the next capacity, whether or not the key already exists. It then finds the slot, copies the key and increments `count` when the key is new, and returns a pointer to the value slot for the caller to fill in |
| Delete (`tea_map_delete`) | Overwrites the slot with a tombstone and decrements `count`. If the map is now empty, it is cleared and returns to the unallocated state. Otherwise, if the capacity is above the minimum and `count` is below one eighth of it, the map is rebuilt at half the capacity (never below the minimum) |
| Resize | Allocates a new array of empty slots and reinserts every live entry. Tombstones are discarded, and `count` is unchanged |
| Copy, merge | Insert each live entry of the source into a new or existing map; for merge, entries of the source replace those of the destination with the same key |

Tombstones are not included in the `count`, so they do not contribute to the load factor that triggers growth. They are removed only when the map is rebuilt or cleared. A map that is repeatedly filled and emptied without ever dropping below the shrink threshold can therefore accumulate tombstones, lengthening probe sequences for absent keys; a probe sequence is bounded by the capacity because the routine stops after one full cycle.

Value slots of newly stored keys hold the old marker (`false` or `true`) until the caller itself writes the real value, which every caller does immediately.

### Iteration Order

Maps have no insertion order. Traversal visits slots from index 0 upward and skips empty and deleted slots, so the order is determined by the hash values, the capacity and the insertion history. It can change whenever the map is resized, and equal maps built in different orders may traverse in different orders.
Equality of maps does not depend on it. Two maps are equal if they have the same number of entries and every key of one is present in the other with an equal value.

Traversal is driven by `tea_map_next(map, key, out)`.
The cursor is the previous *key* rather than an index: given `nil` it starts at slot 0; given a key it finds the key's slot and continues from the next one. On success it stores the key and value in `out[0]` and `out[1]` and returns 1; at the end it returns 0; if the supplied key is not in the map it returns -1. As a result a traversal survives resizing as long as the last returned key is still present, and each step costs one lookup.

## Instances and Method Tables

### Tables

Names are resolved through `Tab`, a hash table specialized for interned-string keys. It is embedded (not allocated separately) in the objects that need it: the state's global table and module table, every module's export table, every class's method table, and the attribute tables of instances and userdata.

A `Tab` has:

- `count`
- `size`
- `entries` array of `TabEntry`. Each entry holds the key (`GCstr*`, or `NULL`), a `flags` byte, and an union of either a single value or an accessor pair (`get` and `set`).

Probing starts at `key->hash & (size - 1)` and compares keys by pointer, which is sufficient because strings are interned.

The slot encoding differs from a maps': an entry with a `NULL` key and a `nil` value is empty, and one with a `NULL` key and a `true` value is a tombstone.

| Aspect | Table behavior |
| --- | --- |
| Load factor | `count + 1 > size * 0.75` triggers growth before an insertion, whether or not the key exists. |
| Meaning of `count` | Slots that are no longer empty: live entries **plus** tombstones. It is incremented only when a never-used slot is claimed, and not decremented on delete. |
| Termination | Since tombstones count toward the load limit there is always at least one empty slot, so probing always terminates. |
| Delete | Writes a tombstone (key `NULL`, flags 0, value `true`). The table never shrinks. |
| Resize | Reinserts live entries only (copying flags and the whole value or accessor pair), and resets `count` to the number of live entries, which discards tombstones. |
| Merge (`tea_tab_merge`) | For each live entry of the source, stores its plain value in the destination (replacing an existing entry for that key). Accessor flags and the setter half are not copied. |

A new entry created by `tea_tab_set` returns a pointer to its value slot; the slot contains `nil` (fresh) or the tombstone marker `true` (reused) until the caller overwrites it.

### Accessor Entries

Class method tables use the flags byte to describe each member:

| Flag | Meaning |
| --- | --- |
| `ACC_STATIC` | A static method |
| `ACC_GET` | The entry is a property getter |
| `ACC_SET` | The entry is a property setter |

Static methods and plain methods keep their function in the single value slot. A getter, a setter, or both, live in the accessor pair. `tea_tab_setx(key, flags)` creates or extends an entry: for a getter or setter it merges the new flag into an existing entry (so a property can receive its getter and its setter in separate definitions) or sets the flag on a new one, and returns a pointer to the matching half of the pair. `tea_tab_getx(key, &flags)` takes the requested accessor in `flags` on entry (`ACC_SET` asks for the setter, anything else for the getter), returns the corresponding value, and overwrites `flags` with the entry's own flags so the caller can see what it found. If the entry lacks the requested half, the other half is returned. Because the union overlays the plain value with the getter, plain access (`tea_tab_get`) on an accessor entry returns the getter slot.

### Classes

A `GCclass` has a name, a `super` pointer (every class created by the VM has the root `Object` class as its default superclass), an `init` field caching the constructor, and the method table. The `init` field is `nil` until a `new` method is defined.

Inheritance is resolved by copying.
When a class inherits from another, the superclass's methods are merged into the subclass's table, after which the subclass's own definitions replace entries of the same name. A method lookup therefore costs one table probe regardless of the depth of the hierarchy, and methods added to a superclass after the subclass was created are not seen by it. The `super` pointer remains in use for `is` tests and for `super` calls, which look the method up directly in the superclass's table.

### Instances

An instance `GCinstance` is a class pointer and an attribute table.
Attributes are stored directly in the instance's `Tab`, with no precomputed slots or layouts; a new instance owns no memory beyond its header until its first attribute is set, and freeing an instance only releases the attribute array. Member lookup on an instance checks the instance's attributes first and then its class's method table, which costs up to two probes.

### Bound Methods

A bound method (`GCmethod`) pairs a receiver value with a function. It is allocated when a method is read from an instance without being called, and calling it places the receiver in slot 0 of the new frame.

## Userdata

Userdata is a block of raw memory owned by the interpreter, exposed to Teascript as an object with a class and attributes. A `GCudata` is allocated as a single block of memory:

```
+-----------------+----------------------+-------------------------+
| GCudata header  | nuvals x TValue      | len bytes of payload    |
+-----------------+----------------------+-------------------------+
                  ^ ud_uvalues(ud)         ^ ud_data(ud)
```

The header carries the class pointer, the attribute table, a `udtype` tag, the number of user values (`nuvals`, at most 255), the payload size `len` and an optional C finalizer `fd`.
The tag distinguishes plain userdata from two kinds created by the standard library (files of the `io` module and string buffers). The payload address, which is what the C API hands to native code, never moves during the object's lifetime.

`tea_udata_new` allocates the block, sets the class to the root object class, initializes the attribute table and sets all user values to `nil`, then links the object into the dedicated userdata list, `T->gc.rootud`, rather than the main object list. The separate list is what lets the collector find the userdata that need a `gc` method call without scanning every object.

Two finalization mechanisms exist and run at different times.
The `gc` special method of the class is called by the collector after marking and sweeping, as a Teascript call (see the Virtual Machine chapter). The C finalizer `fd` is called during the sweep itself, from `tea_udata_free`, with the payload pointer, just before the attribute table and the block are released; it is not allowed to call back into Teascript.

## Allocation and GC safety

The structures above follow a common discipline that the collector depends on:

- **Order of allocation.** Constructors allocate any backing array before the object that will own it, so a collection triggered by the second allocation cannot see a half-built object. After the object is allocated, every field the collector follows is initialized before the next allocation can happen.
- **What the collector scans.** Lists: the first `len` slots. Maps: every slot of `entries`, which is harmless for empty and deleted ones because their key is `nil` and their value is a boolean. Tables: every entry's key and its value or accessor value. Strings and ranges contain no references.
- **Rooting during construction.** `tea_list_slice` pushes the new list while it grows. `tea_list_copy`, `tea_map_copy` and `tea_map_merge` do not push the object they fill; they rely on the caller's context for reachability of the destination.
- **Resizing.** A resize allocates the new array, moves the live entries, and only then frees the old array. Nothing allocates between the allocation of the new array and the swap, so the structure is consistent at every point where a collection could run.
- **Strings.** A new string is linked into its bucket and counted *before* the interning table is grown, so the table is consistent when the growth allocation runs.
