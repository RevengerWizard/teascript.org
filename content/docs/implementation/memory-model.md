---
title: Memory Model
number: "5."
weight: 1803
---

This chapter describes how Teascript values and objects are laid out in memory and how that memory is obtained, tracked and released. It covers the representation of a single value, the tagged value, the common header and the individual layout of every collectable object, the way objects own and reference one another, and the allocation interface through which every byte of interpreter-managed memory passes.

The data structures built from these objects (the string table, lists, maps and the string-keyed tables) are covered in depth in the Core Data Structures chapter; the way the interpreter loop and the collector cooperate is covered in the Virtual Machine chapter. This chapter only stays at the level of byte and ownership.

All sizes and offsets below are for a 64-bit target with 8-byte pointers, a 4-byte `int` and natural alignment, which is how the reference implementation is normally built. Offsets are in bytes from the start of the object. They follow from the structure definitions in `tea_obj.h`, and are not part of any interface. Nothing outside the implementation may depend on them.

## Value Representation

### The Tagged Value

Every Teascript value is stored in a `TValue`. This is a one-byte type tag and an 8-byte payload.

```
 TValue (16 bytes)
  0       1                 8                       16
  +-------+-----------------+------------------------+
  |  tt   |    (padding)    |        payload         |
  +-------+-----------------+------------------------+
                              one of:
                                bool    b   (1 byte)
                                void*   p   (pointer)
                                double  n   (number)
                                GCobj*  gc  (object)
```

The payload is a union.
The tag says which member is active. The representation does not encode the type information in the payload bits. There is no NaN-boxing or pointer tagging, which gives every number its full double precision and every pointer its full width, at the cost of 16 bytes per value.

The same `TValue` is used whenever a value is stored.
Stack slots, list elements, map key-values, table entries, module variables, prototype constants, closed upvalues and the interpreter's own temporaries. A zero-filled `TValue` is `nil`, since the tag of `nil` is 0.

Values are copied by value.
Copying a `TValue` copies the tag and the 8 payload bytes (`copyTV`). For object types the payload is a pointer, so copies of an object value _share_ the object. There are no value-semantics aggregates; every list, map, instance, string and range is an object accessed through a reference.

### Tags

| Tag | Value | Payload | Collectable | Notes |
| --- | --- | --- | --- | --- |
| `TEA_TNIL` | 0 | none | no | |
| `TEA_TBOOL` | 1 | `b` | no | |
| `TEA_TNUM` | 2 | `n` | no | All numbers are IEEE-754 doubles. |
| `TEA_TPOINTER` | 3 | `p` | no | An opaque C pointer; never followed by the collector. |
| `TEA_TSTR` | 4 | `gc` | yes | |
| `TEA_TRANGE` | 5 | `gc` | yes | |
| `TEA_TFUNC` | 6 | `gc` | yes | Teascript and native functions. |
| `TEA_TMODULE` | 7 | `gc` | yes | |
| `TEA_TCLASS` | 8 | `gc` | yes | |
| `TEA_TINSTANCE` | 9 | `gc` | yes | |
| `TEA_TLIST` | 10 | `gc` | yes | |
| `TEA_TMAP` | 11 | `gc` | yes | |
| `TEA_TUDATA` | 12 | `gc` | yes | |
| `TEA_TPROTO` | 13 | `gc` | yes | Internal: function prototype. |
| `TEA_TUPVAL` | 14 | `gc` | yes | Internal: upvalue. |
| `TEA_TMETHOD` | 15 | `gc` | yes | Bound method. |

The order of the tags is significant in three places:

- **Collectability** is a range test, `tag >= TEA_TSTR` (`tvisgcv`); every tag from `TEA_TSTR` on has a pointer to a `GCobj` in its payload, and every tag below it has none.
- **Type names** are looked up by indexing a static array (`tea_obj_typenames`) with the tag.
- **Deallocation** dispatches through an array of free functions indexed by `tag - TEA_TSTR`, whose order must match the tag order.

The public C API uses a separate set of type constants (`TEA_TYPE_*`) which has an extra leading `NONE` entry, so the API type of a value is its tag plus one for the types the two sets share. The internal-only tags (`proto`, `upvalue`) never reach the API.

Setting a value writes its payload and then its tag. `setnilV` writes only the tag: the payload of a `nil` value is unspecified, which means two values must never be compared by their bytes. Equality goes through `tea_obj_equal` or `tea_obj_rawequal`, which look at the tag first.

### Numbers

Numbers are always doubles. Integer-valued quantities (list lengths, indices, counts, results of `setintV`) are stored as the equivalent double and converted back to integer types with a C cast where an integer is needed. The API's integer type is `ptrdiff_t`, converted at the boundary. Bitwise operators convert to `uint32_t` and back (see the Virtual Machine chapter).

## Object Layout

### Common Header

All collectable objects begin with the same 10-byte header, `GCheader`:

```
 GCheader
  0               8        9        10
  +---------------+--------+--------+- - - -
  |    nextgc     | marked |  gct   | ...object-specific fields
  +---------------+--------+--------+- - - -
```

| Field | Meaning |
| --- | --- |
| `nextgc` | Link to the next object in whichever collector list the object is in (the main object list, the userdata list, or an interning-table chain for strings). |
| `marked` | Collector mark. Zero means "not marked in this cycle"; the collector sets it to 1 when it reaches the object and may add flag bits (`TEA_GC_FIXED` for objects that are never collected, `TEA_GC_FINALIZED` for userdata whose finalizer has already run). |
| `gct` | The object's own type tag, the same value that appears in the tag of any `TValue` that refers to it. The collector uses it to trace and to free the object without needing the referencing value. |

All object types are members of one union, `GCobj`, so a `GCobj*` can refer to any of them and the specific type is selected by `gct`. A value's payload `gc` is a `GCobj*`; the typed accessors (`strV`, `listV`, ...) are simply the corresponding union member of that pointer.

The object-specific fields start at offset 10 or later, but are aligned normally. Some structures use the padding after the header for small fields (`len`, `count`, `hash`, `reserved`), which keeps small objects compact.

### Object Sizes

The header holds no size. Whoever frees an object recomputes its size from its fields and passes it to the allocator, which requires the exact old size:

| Object | Size |
| --- | --- |
| Fixed-size objects | `sizeof` of the structure |
| String | header + `len` + 1 (terminator) |
| Teascript closure | `sizeTfunc(upvalue_count)` |
| Native closure | `sizeCfunc(upvalue_count)` |
| Userdata | `tea_udata_size(len, nuvals)` |
| Prototype | the `sizept` field, which includes the arrays stored with it |

Objects with variable-sized trailing data, strings, closures, userdata and prototypes, keep that data in the same allocation as the header. Objects with growable parts, lists, maps, tables, modules, keep them in separate arrays, referenced by pointer and released by the object's free function.

### Strings

```
 GCstr (24 bytes of header + len + 1)
  0           8    9    10        12          16          20     24
  +-----------+----+----+---------+-----------+-----------+------+---------------+----+
  |  nextgc   | mk | gt | reserv. |   hash    |    len    | pad  | bytes (len)   | \0 |
  +-----------+----+----+---------+-----------+-----------+------+---------------+----+
                         ^10      ^12         ^16                  ^24 (str_data)
```

The character data starts right after the 24-byte header (`str_data`) and is NUL-terminated, so a string can be handed to C code directly. `hash` is the cached FNV-1a hash; `reserved` is set by the lexer for keywords. Strings are immutable and interned.

The empty string is not allocated on the heap. It is a `GCstr` embedded in the interpreter state, followed by a one-byte terminator field (`strempty0`) positioned so that `str_data` of the empty string points at that zero byte.

### Ranges

```
 GCrange (40 bytes)
  0              10                 16        24        32        40
  +--------------+------------------+---------+---------+---------+
  |   GCheader   |      (padding)   |  start  |   end   |  step   |
  +--------------+------------------+---------+---------+---------+
```

A range holds three doubles and no references. It is immutable and has no separately allocated part.

### Prototypes and Functions

A prototype (`GCproto`) is the compiled, immutable description of a function; closures pair a prototype with captured variables.

```
 GCproto (72 bytes, then bytecode)
  0            10 11 12 13 14     16    20     24     28    32   40
  +------------+--+--+--+--+------+-----+------+------+-----+----+
  | GCheader   |np|no|uv|  | slots|flags|sizept|sizebc|sizek| k  | ...
  +------------+--+--+--+--+------+-----+------+------+-----+----+
   np numparams (10), no numopts (11), uv sizeuv (12), max_slots (14),
   flags (16), sizept (20), sizebc (24), sizek (28), k (32), uv (40)
  48           52           56          64          72
  +------------+------------+-----------+-----------+===================+
  | firstline  |  numline   | lineinfo  |   name    | bytecode ...      |
  +------------+------------+-----------+-----------+===================+
                                                      ^ proto_bc(pt)
```

The bytecode begins immediately after the header (`proto_bc`), and `sizept` covers the header and everything stored with it, which is the number of bytes to release when the prototype is freed.
`k` points to the constants (an array of `TValue`) and `uv` to the upvalue descriptors (16-bit entries: a slot index in the low byte plus the `PROTO_UV_LOCAL` flag). The last four fields are debug information only.

```
 GCfuncT: Teascript closure             GCfuncC: native closure
  0        10 11 12   16       24  32    0        10 11 12   16       24   32    40  44  48
  +--------+--+--+----+--------+---+===+  +--------+--+--+----+--------+----+----+----+----+====
  |GCheader|ff|uc|    | module | pt| upv|  |GCheader|ff|uc|    | module |type| fn |narg|nopt| upv
  +--------+--+--+----+--------+---+===+  +--------+--+--+----+--------+----+----+----+----+====
   ff ffid, uc upvalue_count                 ff ffid, uc upvalue_count
   upv: GCupval* x upvalue_count (8 bytes)   upv: TValue x upvalue_count (16 bytes)
   size: 32 + 8n                             size: 48 + 16n
```

`GCfunc` is the union of the two.
The shared header holds the function kind `ffid` (`FF_TEA` or `FF_C`), the number of upvalues and the module the function belongs to (`NULL` for native functions). A Teascript closure refers to its prototype and holds *pointers* to upvalue objects, which lets closures share variables. A native closure holds its upvalues directly as values, so they are private to that closure.

### Upvalues

```
 GCupval (48 bytes)
  0            10       16         24                 40        48
  +------------+--------+----------+------------------+---------+
  | GCheader   |        | location |      closed      |  next   |
  +------------+--------+----------+------------------+---------+
```

`location` points either to a stack slot (the upvalue is *open*) or to the object's own `closed` field (*closed*). `next` links open upvalues in the state's list. Reads and writes always go through `location`.

### Modules

```
 GCmodule (72 bytes)
  0            10 16        24       32       40         48 50      56            72
  +------------+--+--------+--------+--------+----------+--+------+-------------+
  | GCheader   |  |  name  |  path  |  vars  | varnames |sz|      |   exports   |
  +------------+--+--------+--------+--------+----------+--+------+-------------+
                                                                    (Tab, 16 bytes)
```

`vars` and `varnames` are two parallel arrays of `size` entries (`size` is a 16-bit field): the values of the module's top-level variables and their names. `exports` is an embedded string-keyed table. The arrays are allocated separately and are released together with the module.

### Classes, Instances and Bound Methods

```
 GCclass (64 bytes)                       GCinstance (40 bytes)
  0          10 16     24      32     48     64   0          10 16      24       40
  +----------+--+------+-------+------+------+   +----------+--+-------+---------+
  | GCheader |  | name | super | init | meth |   | GCheader |  | klass |  attrs  |
  +----------+--+------+-------+------+------+   +----------+--+-------+---------+
   init: TValue (16) @32, methods: Tab (16) @48    attrs: Tab (16) @24

 GCmethod (40 bytes)
  0          10 16               32       40
  +----------+--+----------------+--------+
  | GCheader |  |    receiver    |  func  |
  +----------+--+----------------+--------+
   receiver: TValue (16) @16
```

An instance is just a class pointer and an embedded attribute table, with no per-class slot layout. A bound method stores the receiver as a full `TValue` (which may be any value, not just an instance) and a pointer to the function.

### Userdata

```
 GCudata (56 bytes header)
  0          10 16      24         40  41  42  44    48       56
  +----------+--+-------+----------+---+---+---+-----+--------+
  | GCheader |  | klass |  attrs   |ty |nuv|   | len |   fd   |
  +----------+--+-------+----------+---+---+---+-----+--------+
   klass @16, attrs @24 (Tab, 16), udtype @40, nuvals @41, len @44, fd @48

 followed, in the same allocation, by:
  56                          56 + 16*nuvals                  + len
  +---------------------------+------------------------------+
  |  nuvals x TValue          |  payload (len bytes)         |
  +---------------------------+------------------------------+
   ud_uvalues(ud)               ud_data(ud)
```

The payload is a raw block handed to native code; it never moves, and begins 8-byte aligned (it is not guaranteed to be 16-byte aligned). `klass` and `attrs` sit at the same offsets as in an instance, which is checked by a static assertion, so code that looks up members on an object can treat instances and userdata uniformly.

### Lists, Maps and Tables

```
 GClist (32 bytes)                    GCmap (32 bytes)
  0          10 12     16     24      0          10 12      16     24
  +----------+--+------+------+       +----------+--+-------+------+
  | GCheader |  | len  | size |items| | GCheader |  | count | size |entries|
  +----------+--+------+------+------+ +----------+--+-------+------+-------+
   items: TValue[size]                  entries: MapEntry[size]

 MapEntry (32 bytes)        Tab (16 bytes)            TabEntry (48 bytes)
  +----------+----------+    +-------+------+---------+  +-----+-----+- - -+--------------+
  |   key    |   value  |    | count | size | entries |  | key |flags| pad | value | acc. |
  +----------+----------+    +-------+------+---------+  +-----+-----+- - -+--------------+
   (two TValues)                                          key GCstr* @0, flags @8, union @16
                                                          union: TValue val  or  {get, set} (32)
```

Lists and maps keep their elements in a separately allocated array that is reallocated when they grow, so their object address is stable. A `Tab` is not an object: it is a 16-byte structure embedded in modules, classes, instances, userdata and the interpreter state, with its entry array allocated separately. Details of each structure's behavior are in the Core Data Structures chapter.

## Allocation

### The Allocator Interface

Every allocation, resize and release performed by the interpreter goes through pluggable function with signature:

```c
void* alloc(void* ud, void* ptr, size_t osize, size_t nsize);
```

supplied when the state is created (`tea_new_state`; `tea_open` uses the default) and replaceable with `tea_set_allocf`. The contract is:

| Call | Meaning |
| --- | --- |
| `ptr == NULL`, `osize == 0`, `nsize > 0` | Allocate `nsize` bytes. |
| `ptr != NULL`, `nsize > 0` | Resize the block from `osize` to `nsize` bytes. |
| `nsize == 0` | Free the block of `osize` bytes; returns `NULL`. |
| Return `NULL` for `nsize > 0` | The allocation failed. |

Because the allocator is always told the old size, the interpreter never stores sizes in block headers; the free functions listed under How Object Size Is Determined exist for that reason. The assertions at the allocation entry point check that a block is `NULL` exactly when its size is zero.

### The Allocation Entry Point

`tea_mem_realloc(T, p, old_size, new_size)` is the single path to the allocator. It does the following, in order:

1. Adds `new_size - old_size` to the running total of managed bytes, `T->gc.total`.
2. If the block is growing and the total now exceeds the collection threshold `T->gc.next_gc`, runs a collection. (With the debug option `TEA_DEBUG_STRESS_GC` it collects before every growing allocation instead.)
3. Calls the allocator.
4. If the allocator returned `NULL` for a nonzero request, raises an out-of-memory error.
Collection precedes the allocation, so the object being allocated can never be collected by the collection its own allocation triggered; the request is already included in the total when the threshold is compared. The total is adjusted before the allocator is called and is not rolled back when the allocator fails.

Only memory passing through this function is counted. The collector's own work list, the gray stack, is allocated directly through the allocator and does not count, and so cannot trigger a collection.

### Allocating Objects

| Helper | Purpose |
| --- | --- |
| `tea_mem_newgco(T, size, type)` | Allocates a collectable object, sets `gct` and `marked = 0`, and links it at the head of the main object list `T->gc.root`. |
| `tea_mem_new`, `tea_mem_newvec` | Allocate raw blocks, or arrays of a given element type, without linking them (strings, userdata, and the arrays inside other objects). |
| `tea_mem_growvec`, `tea_mem_grow` | Grow a vector (see below). |
| `tea_mem_free`, `tea_mem_freet`, `tea_mem_freevec` | Release a block, an object of a fixed type, or an array; each passes the exact size to the allocator. |

(The convenience macros are defined in `tea_gc.h`.) New objects are linked at the head of their list, so the main list is in reverse order of creation. Objects that need their own list are linked by their constructors: strings into the interning table's bucket chains, userdata into `T->gc.rootud`. Newly created objects have no mark, and nothing roots them: the code that creates an object is responsible for storing it somewhere reachable (usually the stack) before the next allocation.

`tea_mem_grow(T, p, &size, size_elem, limit)` implements the growth of vectors: the new element count is double the current one, raised to at least `TEA_MIN_VECSIZE` and capped at `limit`; the block is reallocated and `size` updated. Lists use it, with `TEA_MAX_MEM32` as the limit.

### Object Lifecycle

| Phase | Memory-level behavior |
| --- | --- |
| Creation | Allocated with `marked = 0`, linked into a collector list. |
| Marking | The collector sets `marked = 1` on each reachable object and pushes it on the gray stack; popping an object marks everything it references (see Outgoing References). The gray stack is a vector that grows geometrically. |
| Sweeping | The collector walks three groups of lists: the userdata list, every bucket chain of the string table, and the main list. An unmarked object is unlinked and released through the free function selected by its tag; a marked object has its mark cleared, except objects flagged as fixed, which keep it. |
| Finalization | Unreachable userdata with a `gc` method are held back and resurrected for one cycle so that the method can run; see the Virtual Machine chapter. Userdata with a C finalizer have it called when they are released. |
| Threshold | After a cycle the next threshold is set to twice the memory still in use. |
 
Release is done by `gc_free`, which indexes a table of free functions by `gct - TEA_TSTR`. The functions return the object's arrays and then the object itself to the allocator: strings (also decrementing the interning count), ranges, functions, modules (variables, names and export table), classes (method table), instances (attribute table), lists, maps, userdata (calling the C finalizer, then the attribute table), prototypes, upvalues and bound methods. Releasing never touches other objects, so the order in which a cycle frees unreachable objects is immaterial.

At shutdown (`tea_gc_freeall`) the same release functions are applied to every object in the main list, the userdata list and the string table, without any marking, and then the gray stack is returned.

### Memory Errors

When the allocator fails, `tea_err_mem` raises an error with status `TEA_ERROR_MEMORY`; it is delivered like any other error (see the Virtual Machine chapter). The error message is a string created at throw time, so raising the error can itself need memory.

### Memory Outside the Managed Heap

A few pieces of interpreter memory are not managed objects:

- the interpreter state itself, which embeds the empty string, the two temporary buffers, the module and global tables, the table of collector roots and several temporary values (`nilval`, `registrytv`, `tmptv`);
- the value stack and the call-info array, which are vectors owned by the state and resized as calls nest;
- the payload of userdata, which is part of the userdata object but opaque to the collector;
- anything native code obtains for itself, directly or through the C API's `tea_alloc`, `tea_realloc` and `tea_free`, none of which creates objects.
