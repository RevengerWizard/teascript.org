---
title: User-Defined Types in C
number: 14.
weight: 3500
---

In this chapter we will see how to extend Teascript with new types written directly in C. We will build a complete ring buffer type and extend it step by step through the chapter to cover methods, uservalues, and raw pointers.

A ring buffer — also called a circular buffer — is a fixed-capacity queue where elements are written and read through two indices that wrap around a contiguous block of memory. It is a natural fit for a C extension: the fixed size means we can allocate the entire structure, including its data array, in a single `tea_new_udata` call, and all operations are O(1) with no allocation on the hot path. Implementing the same thing in pure Teascript using a list would work, but the GC would see every element write, and resizing would be implicit and unpredictable. In C, we control all of that.

## Userdata

Userdata is the primary mechanism for representing C data structures as first-class Teascript values. When you create a userdata, Teascript allocates a raw block of memory of the size you request and manages its lifetime through the garbage collector. From the Teascript side, a userdata value is opaque — scripts cannot inspect or modify its bytes directly. All meaningful interaction happens through methods you register on it.

Our ring buffer struct holds a capacity, a count of live elements, head and tail indices, and a flexible array member for the data:

```c
typedef struct {
    int capacity;
    int count;
    int head;
    int tail;
    double data[1]; /* flexible array member */
} RingBuffer;
```

We use `double` as the element type to keep the example simple. A production implementation might store tagged Teascript values instead, which we will touch on in section 14.2.

Because the data array is inline in the struct, we cannot use a plain `sizeof(RingBuffer)`. Instead we calculate the total size at allocation time:

```c
static size_t ringbuf_size(int capacity)
{
    return sizeof(RingBuffer) + (capacity - 1) * sizeof(double);
}
```

To create the userdata, use `tea_new_udata`. Unlike the raw `tea_new_userdata`, this variant associates a **name** with the block, which lets you verify and retrieve it safely later:

```c
static void ringbuf_new(tea_State* T)
{
    tea_Integer capacity = tea_check_integer(T, 0);
    if(capacity <= 0)
        tea_error(T, "capacity must be positive");

    RingBuffer* rb = (RingBuffer*)tea_new_udata(T, ringbuf_size(capacity), "RingBuffer");
    rb->capacity = (int)capacity;
    rb->count = 0;
    rb->head = 0;
    rb->tail = 0;
}
```

This function is meant to be called from Teascript as a constructor. It reads the capacity off the stack, allocates the block named `"RingBuffer"`, initializes the fields, and leaves the new userdata on top of the stack.

To retrieve the pointer safely later — verifying that the userdata is indeed a `RingBuffer` and not something else — use `tea_check_udata`:

```c
static RingBuffer* check_ringbuf(tea_State* T, int index)
{
    return (RingBuffer*)tea_check_udata(T, index, "RingBuffer");
}
```

`tea_check_udata` raises a runtime error if the value at `index` is not a userdata with the name `"RingBuffer"`, so a script can never pass the wrong type and get silent memory corruption. If you want a softer check that returns `NULL` on mismatch instead of erroring, use `tea_test_udata`.

Now let's add the core operations. We want to write things like this from Teascript:

```tea
from ringbuf import RingBuffer

var rb = RingBuffer(8)
rb.push(1.0)
rb.push(2.0)
print(rb.pop())    // 1.0
print(rb.count)    // 1
print(rb.full)     // false
```

The push and pop implementations are straightforward:

```c
static void ringbuf_push(tea_State* T)
{
    RingBuffer* rb = check_ringbuf(T, 0);
    double value = tea_check_number(T, 1);

    if(rb->count == rb->capacity)
        tea_error(T, "ring buffer is full");

    rb->data[rb->tail] = value;
    rb->tail = (rb->tail + 1) % rb->capacity;
    rb->count++;
}

static void ringbuf_pop(tea_State* T)
{
    RingBuffer* rb = check_ringbuf(T, 0);

    if(rb->count == 0)
        tea_error(T, "ring buffer is empty");

    double value = rb->data[rb->head];
    rb->head = (rb->head + 1) % rb->capacity;
    rb->count--;

    tea_push_number(T, value);
}
```

We also expose a few read-only properties through `"get"` methods. The `"get"` type tag in `tea_Methods` marks a property getter — it is invoked when a script reads `rb.count` rather than calling `rb.count()`:

```c
static void ringbuf_get_count(tea_State* T)
{
    RingBuffer* rb = check_ringbuf(T, 0);
    tea_push_integer(T, rb->count);
}

static void ringbuf_get_capacity(tea_State* T)
{
    RingBuffer* rb = check_ringbuf(T, 0);
    tea_push_integer(T, rb->capacity);
}

static void ringbuf_get_empty(tea_State* T)
{
    RingBuffer* rb = check_ringbuf(T, 0);
    tea_push_bool(T, rb->count == 0);
}

static void ringbuf_get_full(tea_State* T)
{
    RingBuffer* rb = check_ringbuf(T, 0);
    tea_push_bool(T, rb->count == rb->capacity);
}
```

Putting it all together with `tea_create_class`:

```c
static const tea_Methods ringbuf_methods[] = {
    { "push",     "method", ringbuf_push,         2, 0 },
    { "pop",      "method", ringbuf_pop,           1, 0 },
    { "count",    "get",    ringbuf_get_count,     1, 0 },
    { "capacity", "get",    ringbuf_get_capacity,  1, 0 },
    { "empty",    "get",    ringbuf_get_empty,     1, 0 },
    { "full",     "get",    ringbuf_get_full,      1, 0 },
    { NULL, NULL, NULL, 0, 0 }
};

static const tea_Reg ringbuf_module[] = {
    { "RingBuffer", ringbuf_new, 1, 0 },
    { NULL, NULL, 0, 0 }
};

TEA_API void tea_import_ringbuf(tea_State* T)
{
    tea_create_class(T, "RingBuffer", ringbuf_methods);
    tea_create_module(T, "ringbuf", ringbuf_module);
}
```

## Uservalues

The ring buffer above stores `double` values, which keeps the implementation simple. But what if we want a ring buffer that can hold arbitrary Teascript values — numbers, strings, instances, whatever a script pushes into it?

The challenge is that the garbage collector knows nothing about bytes buried inside a userdata block. If we were to store raw Teascript values there, the GC could collect objects that are only referenced from inside our buffer, corrupting the data. We need a way to tell the GC about those references.

**Uservalues** solve this. They are a fixed number of extra value slots attached to a userdata, each capable of holding any Teascript value. The GC tracks them properly: as long as the userdata is alive, the values in its uservalue slots are kept alive too.

You request uservalues at allocation time using `tea_new_udatav` (the named variant of `tea_new_userdatav`), passing the number of slots as the last argument:

```c
void* tea_new_udatav(tea_State* T, size_t size, int nuvs, const char* name);
```

For a value-typed ring buffer, we want one uservalue slot per capacity. We change the struct to store indices only — the actual values live in uservalue slots — and allocate accordingly:

```c
typedef struct {
    int capacity;
    int count;
    int head;
    int tail;
} RingBufferV;

static void ringbufv_new(tea_State* T)
{
    tea_Integer capacity = tea_check_integer(T, 0);
    if(capacity <= 0)
        tea_error(T, "capacity must be positive");

    RingBufferV* rb = (RingBufferV*)tea_new_udatav(T, sizeof(RingBufferV), (int)capacity, "RingBufferV");
    rb->capacity = (int)capacity;
    rb->count = 0;
    rb->head = 0;
    rb->tail = 0;

    /* Initialize all slots to nil */
    for(int i = 0; i < capacity; i++)
    {
        tea_push_nil(T);
        tea_set_udvalue(T, -2, i);
    }
}
```

To read and write individual slots, use `tea_get_udvalue` and `tea_set_udvalue`. `tea_set_udvalue` pops the value on top of the stack and stores it in slot `n`. `tea_get_udvalue` pushes the value in slot `n` onto the stack:

```c
bool tea_get_udvalue(tea_State* T, int ud, int n);
void tea_set_udvalue(tea_State* T, int ud, int n);
```

Here `ud` is the stack index of the userdata itself, and `n` is the zero-based slot index.

Push and pop now move values through uservalue slots instead of a raw array:

```c
static void ringbufv_push(tea_State* T)
{
    RingBufferV* rb = (RingBufferV*)tea_check_udata(T, 0, "RingBufferV");

    if(rb->count == rb->capacity)
        tea_error(T, "ring buffer is full");

    /* Value to push is at index 1; store it in the tail slot */
    tea_push_value(T, 1);
    tea_set_udvalue(T, 0, rb->tail);

    rb->tail = (rb->tail + 1) % rb->capacity;
    rb->count++;
}

static void ringbufv_pop(tea_State* T)
{
    RingBufferV* rb = (RingBufferV*)tea_check_udata(T, 0, "RingBufferV");

    if(rb->count == 0)
        tea_error(T, "ring buffer is empty");

    /* Retrieve the value from the head slot */
    tea_get_udvalue(T, 0, rb->head);

    /* Clear the slot so the GC can release the object if nothing else holds it */
    tea_push_nil(T);
    tea_set_udvalue(T, 0, rb->head);

    rb->head = (rb->head + 1) % rb->capacity;
    rb->count--;

    /* The retrieved value is already on top of the stack */
}
```

Note that we clear the slot after popping. This is important: a uservalue slot holds a strong reference. If we left the old value there after logically removing it from the buffer, we would keep the object alive longer than necessary — effectively a GC-level memory leak.

## Pointers

Teascript also exposes a lightweight **pointer** type, distinct from userdata. A pointer is just a raw `void*` with no associated memory management: Teascript does not allocate, own, or free the memory it points to, and the garbage collector takes no interest in it whatsoever.

You push a pointer with `tea_push_pointer` and retrieve it with `tea_get_pointer`:

```c
void tea_push_pointer(tea_State* T, void* p);
const void* tea_get_pointer(tea_State* T, int index);
```

A pointer is useful when you want to give Teascript a reference to a C object whose lifetime is clearly managed on the C side. Imagine a system where ring buffers are pre-allocated in a C-owned pool — perhaps a real-time audio engine where dynamic allocation is forbidden. Rather than copying data into a Teascript-managed userdata, you can hand the script a pointer to an existing buffer and let C remain in full control:

```c
static void wrap_ringbuf_ptr(tea_State* T, RingBuffer* rb)
{
    tea_push_pointer(T, rb);
}

static void ringbuf_ptr_push(tea_State* T)
{
    RingBuffer* rb = (RingBuffer*)tea_get_pointer(T, 0);
    double value = tea_check_number(T, 1);

    if(rb->count == rb->capacity)
        tea_error(T, "ring buffer is full");

    rb->data[rb->tail] = value;
    rb->tail = (rb->tail + 1) % rb->capacity;
    rb->count++;
}
```

The tradeoff is total loss of safety. Teascript cannot verify what a pointer points to, cannot check whether the memory is still valid, and will not notify C when it is done with the value. If the C-side pool frees a buffer while a script still holds a pointer to it, retrieving that pointer will return a dangling address.

Use pointers only when the lifetime of the underlying object is strictly governed by C and is guaranteed to outlive any Teascript values that reference it. For most purposes, userdata is the safer and more idiomatic choice. A pointer is an escape hatch, not the default.

## Object-Oriented Patterns

Looking back at what we have built, the `RingBuffer` type behaves like an ordinary Teascript class from a script's point of view. Construction, method calls, and property reads all work through exactly the same mechanisms a class defined in Teascript would use. This is intentional: the C API is designed so that there is no visible seam between native types and script-defined ones.

A few patterns are worth keeping in mind as you build more complex types.

**Finalizers.** If a userdata owns resources beyond its own memory — open file handles, heap allocations inside the struct, GPU objects, locks — you must release them when the GC collects the userdata. Attach a finalizer with `tea_set_finalizer` before registering the class. The finalizer receives a bare `void*` to the userdata memory and no `tea_State*`, so it must only perform C-side cleanup:

```c
static void ringbuf_finalizer(void* p)
{
    /* Our inline ring buffer owns no external resources, but if it did: */
    RingBuffer* rb = (RingBuffer*)p;
    (void)rb;
}

/* During module setup, before tea_create_class */
tea_set_finalizer(T, ringbuf_finalizer);
```

For types that do own external resources, the finalizer is not optional — without it, every collection event leaks. For pure value types like our `double` ring buffer, it can be omitted.

**Operator overloading.** Methods registered with operator names as their key participate in Teascript's operator dispatch. To make two ring buffers comparable, or to let scripts concatenate them with `+`, register the appropriate operator methods the same way as any other method. See chapter 9.3.4 for the full list of overloadable operators.

**Type checking across the boundary.** Always use `tea_check_udata` rather than `tea_get_userdata` in methods that receive `self`. A script can store anything in a variable, and if an object of the wrong type ends up passed as `self`, a raw cast will produce undefined behavior. The named check costs almost nothing and eliminates an entire class of hard-to-debug crashes.
