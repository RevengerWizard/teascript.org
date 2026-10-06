---
title: Code Loading and Execution
weight: 1900
---

This section covers the functions used to load Teascript source or bytecode, to call functions (both protected and unprotected), and to serialize compiled code. A typical workflow is to load a chunk with one of the `tea_load*` functions, which leave a function on the stack, and then executes it with `tea_pcall` or `tea_call`. The `tea_eval` helper bundles loading and calling into one step.

Unless stated otherwise, `tea_load*` functions return an error code (`TEA_OK` on success, one of the `TEA_ERROR_*` values on failure) and, on success, push the compiled chunk as a function onto the stack. On failure, an error message is pushed instead.

---

## tea_call()

```c
void tea_call(tea_State* T, int n);
```

{{< stack before="...,func,arg1,...,argN" after="...,result" >}}

Calls the function at position `top - n - 1` with `n` arguments taken from the top of the stack (`top - n` through `top - 1`). Both the functions and the arguments are popped, and the result is pushed in their place.

This is an unprotected call: any error raised inside the callee propagates out of the C function that called `tea_call`, unwinding the C stack. Use `tea_pcall` when you need to catch errors.

#### Arguments
- `T`: Teascript state
- `n`: Number of arguments passed to the function

#### Errors
Propagates any error raised by the called function.

#### Example
```c
/* Assume a global function "greet" exists and takes one argument */
if(tea_get_global(T, "greet"))
{
    tea_push_string(T, "world");
    tea_call(T, 1);         /* prints/returns whatever greet does */
    tea_pop(T, 1);          /* drop the result */
}
```

#### See Also
tea_pcall, tea_pccall

---

## tea_pcall()

```c
int tea_pcall(tea_State* T, int n);
```

{{< stack before="...,func,arg1,...,argN" after="...,result" >}}

Calls the function at position `top - n - 1` with `n` arguments, in protected mode. If the call completes successfully, `TEA_OK` is returned, the function and arguments are replaced on the stack by the return value. If an error occurs, the error value is pushed onto the stack and one of the `TEA_ERROR_*` codes is returned; the original function and arguments are still removed.

#### Arguments
- `T`: Teascript state
- `n`: Number of arguments passed to the function

#### Returns
`TEA_OK` on success; otherwise an error code.

#### Example
```c
if(tea_get_global(T, "risky"))
{
    tea_push_integer(T, 42);
    int status = tea_pcall(T, 1);
    if(status != TEA_OK)
    {
        const char* err = tea_get_string(T, -1);
        fprintf(stderr, "call failed: %s\n", err);
    }
    tea_pop(T, 1);
}
```

#### See Also
tea_call, tea_pccall

---

## tea_pccall()

```c
int tea_pccall(tea_State* T, tea_CFunction func, void* ud);
```

{{< stack before="..." after="..." >}}

Calls the C function `func` in protected mode, passing it the arbitrary pointer `ud` as its only argument. This is convenience wrapper around `tea_pcall` for calling a C function with a single pointer-sized user argument, without having to push a closure first.

#### Arguments
- `T`: Teascript state
- `func`: C function to call
- `ud`: Opaque pointer passed as the function's argument

#### Returns
`TEA_OK` on success; otherwise an error code.

#### Example
```c
typedef struct { int x, y; } Point;

static void process_point(tea_State* T)
{
    Point* p = (Point*)tea_get_pointer(T, 1);
    printf("(%d, %d)\n", p->x, p->y);
}

Point pt = { 3, 4 };
int status = tea_pccall(T, process_point, &pt);
```

#### See Also
tea_pcall, tea_call

---

## tea_loadx()

```c
int tea_loadx(tea_State* T, tea_Reader reader, void* data, const char* name, const char* mode);
```

{{< stack before="..." after="...,chunk" >}}

Loads a chunk using the reader function `reader`, which is called repeatedly to supply successive pieces of the chunk. `data` is passed through to the reader as its user data. `name` is used in error messages and as the module environment name. `mode` controls what the loader accepts: `"t"` for text source, `"b"` for binary bytecode, `"bt"` for both; `NULL` is equivalent to `"bt"`.

#### Arguments
- `T`: Teascript state
- `reader`: Callback that returns the next block of the chunk
- `data`: User data passed to `reader`
- `name`: Module environment name, used in error messages
- `mode`: Accepted input modes (`"t"`, `"b"`, `"bt"`, or `NULL`)

#### Returns
`TEA_OK` on success, pushing the compiled Tea function onto the stack; otherwise an error code.

#### Example
```c
static const char* my_reader(tea_State* T, void* ud, size_t* sz)
{
    const char** p = (const char**)ud;
    if(*p == NULL) { *sz = 0; return NULL; }
    *sz = strlen(*p);
    const char* r = *p;
    *p = NULL;
    return r;
}

const char* src = "return 1 + 2";
tea_loadx(T, my_reader, &src, "=inline", "t");
```

#### See Also
tea_load, tea_dump, tea_load_bufferx

---

## tea_load()

```c
int tea_load(tea_State* T, tea_Reader reader, void* data, const char* name);
```

{{< stack before="..." after="...,chunk" >}}

Equivalent to `tea_loadx` with `mode` set to `NULL` (accepting both text and binary).

#### Arguments
- `T`: Teascript state
- `reader`: Callback that returns the next block of the chunk
- `data`: User data passed to `reader`
- `name`: Module environment name, used in error messages

#### Returns
`TEA_OK` on success, pushing the compiled Tea function onto the stack; otherwise an error code.

#### Example
```c
const char* src = "return 'hello'";
tea_load(T, my_reader, &src, "=greeting");
if(tea_pcall(T, 0) == TEA_OK)
{
    printf("%s\n", tea_get_string(T, -1));
}
```

#### See Also
tea_loadx, tea_load_buffer

---

## tea_dump()

```c
int tea_dump(tea_State* T, tea_Writer writer, void* data);
```

{{< stack before="...,func" after="...,func" >}}

Serializes the function at the top of the stack into bytecode, invoking `writer` with successive chunks of output. `data` is passed through to the writer as its user data. Returns `TEA_OK` on success, or a writer-defined non-zero error code otherwise.

This is the counterpart to `tea_loadx` and can be used to pre-compile chunks or to persist compiled code.

#### Arguments
- `T`: Teascript state
- `writer`: Callback invoked with each output block
- `data`: User data passed to `writer`

#### Returns
`TEA_OK` on success; otherwise a writer-supplied error code.

#### Example
```c
static int my_writer(tea_State* T, void* ud, const void* p, size_t sz)
{
    FILE* fp = (FILE*)ud;
    fwrite(p, 1, sz, fp);
    return 0;
}

/* Assume a compiled function is on the stack */
FILE* fp = fopen("out.tbc", "wb");
tea_dump(T, my_writer, fp);
fclose(fp);
tea_pop(T, 1);
```

#### See Also
tea_loadx, tea_load_bufferx

---

## tea_load_filex()

```c
int tea_load_filex(tea_State* T, const char* filename, const char* name, const char* mode);
```

{{< stack before="..." after="...,chunk" >}}

Loads a chunk from the file `filename`. `name` is used in error messages and if `NULL`, `filename` is used instead. `mode` has the same meaning as in `tea_loadx`.

#### Arguments
- `T`: Teascript state
- `filename`: Path of the file to load
- `name` Module environment name used in error messages (may be `NULL`)
- `mode`: Accepted input modes (`"t"`, `"b"`, `"bt"`, or `NULL`)

#### Returns
`TEA_OK` on success, pushing the compiled Tea function onto the stack; otherwise an error code.

#### Example
```c
if(tea_load_filex(T, "script.tea", "=script", "t") == TEA_OK)
{
    tea_pcall(T, 0);
    tea_pop(T, 1);
}
```

#### See Also
tea_load_file, tea_loadx

---

## tea_load_file()

```c
int tea_load_file(tea_State* T, const char* filename, const char* name);
```

{{< stack before="..." after="...,chunk" >}}

Equivalent to `tea_load_filex` with `mode` set to `NULL`.

#### Arguments
- `T`: Teascript state
- `filename`: Path of the file to load
- `name`: Module environment name used in error messages (may be `NULL`)

#### Returns
`TEA_OK` on success, pushing the compiled Tea function onto the stack; otherwise an error code.

#### Example
```c
tea_load_file(T, "config.tea", "=config");
tea_pcall(T, 0);
```

#### See Also
tea_load_filex

---

## tea_load_bufferx()

```c
int tea_load_bufferx(tea_State* T, const char* buffer, size_t size, const char* name, const char* mode);
```

{{< stack before="..." after="...,chunk" >}}

Loads a chunk directly from an in-memory buffer of `size` bytes. `name` and `mode` behave as in `tea_loadx`.

#### Arguments
- `T`: Teascript state
- `buffer`: Pointer to the chunk data
- `size`: Size of the buffer in bytes
- `name`: Module environment name used in error messages (may be `NULL`)
- `mode`: Accepted input modes (`"t"`, `"b"`, `"bt"`, or `NULL`)

#### Returns
`TEA_OK` on success, pushing the compiled Tea function onto the stack; otherwise an error code.

#### Example
```c
const char* src = "return 6 * 7";
tea_load_bufferx(T, src, strlen(src), "=answer", "t");
tea_pcall(T, 0);
printf("%d\n", (int)tea_get_integer(T, -1));   /* 42 */
tea_pop(T, 1);
```

#### See Also
tea_load_buffer, tea_loadx

---

## tea_load_buffer()

```c
int tea_load_buffer(tea_State* T, const char* buffer, size_t size, const char* name);
```

{{< stack before="..." after="...,chunk" >}}

Equivalent to `tea_load_bufferx` with `mode` set to `NULL`.

#### Arguments
- `T`: Teascript state
- `buffer`: Pointer to the chunk data
- `size`: Size of the buffer in bytes
- `name`: Module environment name used in error messages (may be `NULL`)

#### Returns
`TEA_OK` on success, pushing the compiled Tea function onto the stack; otherwise an error code.

#### Example
```c
const char* src = "return 'buffered'";
tea_load_buffer(T, src, strlen(src), "=buf");
tea_pcall(T, 0);
tea_pop(T, 1);
```

#### See Also
tea_load_bufferx

---

## tea_eval()

```c
int tea_eval(tea_State* T, const char* s);
```

{{< stack before="..." after="...,result" >}}

Convenience function that loads the NUL-terminated string `s`, calls the resulting chunk, and leaves any results on the stack. Returns `TEA_OK` on success; otherwise an error code is returned and an error value is left on the stack.

NOTE: Unlike `tea_load_buffer`, the source is a C string and cannot contain embedded NUL bytes.

#### Arguments
- `T`: Teascript state
- `s`: Source code to evaluate

#### Returns
`TEA_OK` on success; otherwise an error code.

#### Example
```c
if(tea_eval(T, "1 + 2 * 3") == TEA_OK)
{
    tea_Number result = tea_get_number(T, -1);
    printf("%g\n", result);     /* 7 */
    tea_pop(T, 1);
}
```

#### See Also
tea_load_buffer, tea_pcall

---

## tea_import()

```c
void tea_import(tea_State* T, const char* name);
```

{{< stack before="..." after="...,module" >}}

Imports the module with the given logical `name`, loading and executing it if necessary, and pushes the module's namespace object onto the stack. This is the C API counterpart to the `import` statement in Tea code.

#### Arguments
- `T`: Teascript state
- `name`: Logical name of the module to import

#### Example
```c
tea_import(T, "math");
if(tea_get_key(T, -1, "sqrt"))
{
    tea_push_number(T, 16.0);
    tea_call(T, 1);
    printf("%g\n", tea_get_number(T, -1));   /* 4 */
}
```

#### See Also
tea_eval, tea_get_global
