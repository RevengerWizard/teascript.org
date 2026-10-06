---
title: State Manipulation
weight: 200
---

The **State Manipulation** section covers the functions used to _create_, _configure_, and _destroy_ a Tea state. A `tea_State` represents the entire interpreter context and must exist before any other Teascript C API function can be called. The functions here let you initialize a state, provide custom memory allocators, store command-line settings for scripts to access and install a panic handler for unprotected errors. Properly creating a state at startup and closing it at shutdown ensures that all resources, including userdata with finalizers, are released cleanly.

---

## tea_new_state()

```c
tea_State* tea_new_state(tea_Alloc allocf, void* ud);
```

Creates a new Teascript state. This is the very first function you should call when embedding Teascript into your application. The state holds the entire interpreter context, including the stack, garbage collector, and global and module environment.

#### Arguments
- `allocf`: A custom memory allocator function, or `NULL` to use the default allocator.
- `ud`: An opaque pointer passed as the first argument to `allocf`. Can be `NULL`.

#### Returns
A pointer to the newly created state, or `NULL` if the allocation of the state fails.

#### Example
```c
tea_State* T = tea_new_state(NULL, NULL);
if(T == NULL)
{
    fprintf(stderr, "Failed to create Tea state\n");
    return 1;
}
/* ... Use the state ... */
tea_close(T);
```

#### See Also
tea_close, tea_open

---

## tea_close()

```c
void tea_close(tea_State* T);
```

Closes and destroys an already opened Teascript state, releasing all memory associated with it. After calling this function, the state pointer **must not** be used again. Any userdata finalizers are called during this process.

#### Arguments
- `T`: Teascript state to close.

#### Example
```c
tea_State* T = tea_open();
tea_do_file(T, "script.tea");
tea_close(T);   /* State is no longer valid */
```

#### See Also
tea_new_state, tea_set_finalizer

---

## tea_set_argv()

```c
void tea_set_argv(tea_State* T, int argc, char** argv, int argf);
```

Stores command-line arguments in the state, making them accessible to Tea scripts. The `argf` parameter specifies the index of the first non-option argument within `argv`, or `0` if there is no such argument. This information is typically used by scripts to parse command-line options.

#### Arguments
- `T`: Teascript state
- `argc`: The number of command-line arguments
- `argv`: An array of C strings containing the arguments.
- `argf`: The index of the first non-option argument, or `0` if none

#### Example
```c
int main(int argc, char** argv)
{
    tea_State* T = tea_open();
    /* First argument after the program name is the script */
    tea_set_argv(T, argc, argv, 1);
    tea_do_file(T, argv[1]);
    tea_close(T);
    return 0;
}
```
#### See Also
tea_get_argv

---

## tea_get_argv()

```c
int tea_get_argv(tea_State* T, char*** argv, int* argf);
```

Retrieves the command-line arguments previously stored with `tea_set_argv`. The `argv` and `argf` pointers may be `NULL` if you are only interested in the argument count.

#### Arguments
- `T`: Teascript state
- `argv`: A pointer to a `char**` variable that receives the argument array, or `NULL`
- `argf`: A pointer to an `int` variable that receives the first non-option index, or `NULL`

#### Returns
The number of command-line arguments.

#### Example
```c
char** argv;
int argf;
int argc = tea_get_argv(T, &argv, &argf);
printf("Script received %d arguments\n", argc);
for(int i = argf; i < argc; i++)
    printf("  arg[%d] = %s\n", i, argv[i]);
```

#### See Also
tea_set_argv

---

## tea_atpanic()

```c
tea_CFunction tea_atpanic(tea_State* T, tea_CFunction panicf);
```

Sets a new panic function and returns the old one. The panic function is called when an unprotected error occurs inside Teascript (for example, an error outside of a `tea_pcall`). It receives the state with the error value pushed onto the stack.

The default panic function prints a message to `stderr` and aborts the program. A custom panic function can perform a graceful shutdown, but it cannot return normally; it must either abort the process, or perform some kind of recovery, like performing a long jump.

#### Arguments
- `T`: Teascript state
- `panicf`: The new panic function, or `NULL` to keep the current one

#### Returns
The previous panic function

#### Example
```c
static void my_panic(tea_State* T)
{
    const char* msg = tea_to_string(T, -1);
    fprintf(stderr, "PANIC: %s\n", msg ? msg : "(no message)");
    exit(EXIT_FAILURE);
}

tea_atpanic(T, my_panic);
```

#### See Also
tea_error, tea_throw

---

## tea_get_allocf()

```c
tea_Alloc tea_get_allocf(tea_State* T, void** ud);
```

Provides the memory allocator function currently being used by the state, and optionally its user data pointer. This is useful when you need to perform memory allocations that should be tracked by the same allocator.

#### Arguments
- `T`: Teascript state
- `ud`: A pointer to a `void*` variable that receives the allocator user data, or `NULL`

#### Example
```c
void* ud;
tea_Alloc alloc = tea_get_allocf(T, &ud);
char* buf = (char*)alloc(ud, NULL, 0, 256);
/* ... Use buf ... */
alloc(ud, buf, 256, 0);
```

#### See Also
tea_set_allocf, tea_new_state

---

## tea_set_allocf()

```c
void tea_set_allocf(tea_State* T, tea_Alloc f, void* ud);
```

Changes the memory allocator function used by the state. This can only be done safely when no other Teascript resources are live, typically immediately after creating the state. If `f` is `NULL`, the allocator is left unchanged; similarly, if `ud` is `NULL`, the user data is left unchanged.

#### Arguments
- `T`: Teascript state
- `f`: The new allocator function, or `NULL`
- `ud`: The allocator user data, or `NULL`

#### Example
```c
static void* my_alloc(void* ud, void* ptr, size_t osize, size_t nsize)
{
    (void)osize;
    if(nsize == 0)
    {
        free(ptr);
        return NULL;
    }
    return realloc(ptr, nsize);
}

tea_State* T = tea_open();
tea_set_allocf(T, my_alloc, NULL);
```

#### See Also
tea_get_allocf, tea_new_state
