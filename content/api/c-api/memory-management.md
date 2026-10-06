---
title: Memory Management
weight: 1800
---

This section covers the raw memory allocation interface used by the Teascript runtime. All objects created by the API (`tea_new_list`, `tea_new_map`, `tea_push_lstring`, etc.) are allocated through the state's configured allocator, which you can replace via `tea_set_allocf` (see State Manipulation). The functions here expose the same allocator directly so that extension code can allocate memory that is tracked and accounted for by the runtime, which is important for memory limits and for integration with the collector.

These functions allocate and free raw memory; they **do not** create Teascript value objects. To create a new userdata object with a managed data block, use `tea_new_userdata` or one of its variants instead.

---

## tea_alloc()

```c
void* tea_alloc(tea_State* T, size_t size);
```

Allocates a raw block of `size` bytes using the state's allocator. The returned pointer is not initialized and may be `NULL` if the allocation fails.

If `size` is zero, the behavior is allocator-dependent; prefer to avoid zero-size allocations.

#### Arguments
- `T`: Teascript state
- `size`: Number of bytes to allocate

#### Returns
Pointer to the newly allocated block, or `NULL` on failure.

#### Example
```c
char* buf = (char*)tea_alloc(T, 256);
if(buf)
{
    memcpy(buf, "hello", 6);
    /* ... use buf ... */
    tea_free(T, buf);
}
```

#### See Also
tea_realloc, tea_free

---

## tea_realloc()

```c
void* tea_realloc(tea_State* T, void* p, size_t size);
```

Resizes the block at `p` to `size` bytes. If `p` is `NULL`, this behaves like `tea_alloc`. If `size` is zero, the block is freed and `NULL` may be returned. Otherwise the block is grown or shrunk, preserving as much of the existing contents as possible, and the (possibly new) pointer is returned.

Because the block may move, always assign the result back to your pointer.

#### Arguments
- `T`: Teascript state
- `p`: Pointer to an existing block allocated by this state, or `NULL`
- `size`: New size in bytes

#### Returns
Pointer to the resized block, or `NULL` on failure or when `size` is zero.

#### Example
```c
char* buf = (char*)tea_alloc(T, 64);
buf = (char*)tea_realloc(T, buf, 128);
if(buf)
{
    /* use enlarged buf */
    tea_free(T, buf);
}
```

#### See Also
tea_alloc, tea_free

---

## tea_free()

```c
void tea_free(tea_State* T, void* p);
```

Frees the raw memory block at `p`, which must have been allocated by this same state (via `tea_alloc` or `tea_realloc`). Passing `NULL` is a no-op. Passing any other pointer is undefined behavior.

#### Arguments
- `T`: Teascript state
- `p`: Pointer to a block previously allocated by this state, or `NULL`

#### Example
```c
void* p = tea_alloc(T, 128);
/* ... */
tea_free(T, p);
```

#### See Also
tea_alloc, tea_realloc

---

## tea_set_finalizer()

```c
void tea_set_finalizer(tea_State* T, tea_Finalizer f);
```

Registers a finalizer function `f` for the userdata at the top of the stack. The finalizer is invoked by the garbage collector when the userdata becomes unreachable, giving you a chance to release non-memory resources (file handles, sockets, native buffers, and similar).

The value at the top of the stack is not popped. The stack must contain a userdata value in slot `-1`.

#### Arguments
- `T`: Teascript state
- `f`: Finalizer function to run when the userdata is collected

#### Example
```c
typedef struct FileHandle
{
    FILE* fp;
} FileHandle;

static void file_handle_finalizer(void* p)
{
    FileHandle* fh = (FileHandle*)p;
    if(fh->fp)
        fclose(fh->fp);
}

static int open_file(tea_State* T)
{
    const char* path = tea_check_string(T, 1);
    FileHandle* fh = (FileHandle*)tea_new_userdata(T, sizeof(FileHandle));
    fh->fp = fopen(path, "r");
    tea_set_finalizer(T, file_handle_finalizer);
    return 1;  /* userdata is left on the stack */
}
```

#### See Also
tea_gc, tea_new_userdata, tea_get_userdata
