---
title: Calling Teascript from C
number: 11.
weight: 3200
---

So far we have seen how to expose C functionality to Teascript. This chapter covers the other direction: driving the Teascript runtime from C. We will load and execute source files and strings, call Teascript functions directly, and handle errors robustly using Teascript's protected call mechanism.

## Loading and Running Code

The simplest way to execute Teascript code from C is `tea_eval`, which takes a null-terminated string and runs it immediately in the current state:

```c
tea_State* T = tea_open();
tea_eval(T, "print('hello from C')");
tea_close(T);
```

`tea_eval` compiles and executes the string in one step. It is convenient for short snippets, but for anything larger — or anything you want to run more than once — you should load and execute separately.

Loading code compiles it and pushes the resulting function onto the stack without executing it. There are three loaders depending on where the source comes from:

```c
/* From a file on disk */
int tea_load_file(tea_State* T, const char* filename, const char* name);

/* From a string in memory */
int tea_load_buffer(tea_State* T, const char* buffer, size_t size, const char* name);

/* From a custom reader callback */
int tea_load(tea_State* T, tea_Reader reader, void* data, const char* name);
```

The `name` parameter is used in error messages and stack traces. For files you can pass `NULL` and Teascript will use the filename. For buffers it is good practice to give a descriptive name like `"=(config)"` so errors are easy to locate.

All three return `TEA_OK` on success or an error code on failure, leaving an error message on the stack in the failure case. On success they leave the compiled chunk as a function on top of the stack. To execute it, call `tea_call`:

```c
int status = tea_load_file(T, "config.tea", NULL);
if(status != TEA_OK)
{
    fprintf(stderr, "load error: %s\n", tea_get_string(T, -1));
    tea_pop(T, 1);
    return;
}
tea_call(T, 0); /* call the chunk with 0 arguments */
```

`tea_call` takes the function at the appropriate stack position and `n` arguments sitting above it, calls the function, and replaces them all with the return values. For a top-level chunk there are no arguments, so we pass `0`.

The `x` variants — `tea_load_filex`, `tea_load_bufferx`, `tea_loadx` — accept an additional `mode` string that controls whether the loader accepts source text, precompiled bytecode, or both. Pass `NULL` to accept either. This matters when loading untrusted bytecode, where you may want to restrict loading to source only.

For the common case of loading a file and immediately running it, the `tea_do_file` macro combines both steps:

```c
#define tea_do_file(T, fn) \
    (tea_load_file(T, fn, NULL) || tea_pcall(T, 0))
```

Note that `tea_do_file` uses `tea_pcall` rather than `tea_call` — we will cover the difference in section 11.3.

## Calling Functions

Once a Teascript function is on the stack — whether loaded from a file, retrieved from a global, or returned by another call — you call it with `tea_call`:

```c
void tea_call(tea_State* T, int n);
```

The calling convention is straightforward: push the function, push `n` arguments in order, then call. `tea_call` pops the function and all arguments and pushes the return values in their place.

Suppose a Teascript file defines a function `add` and we want to call it from C:

```tea
# math.tea
fn add(a, b)
    return a + b
end
```

```c
tea_load_file(T, "math.tea", NULL);
tea_call(T, 0); /* run the file to define add */

/* Retrieve the global 'add' */
tea_get_global(T, "add");

/* Push arguments */
tea_push_number(T, 10);
tea_push_number(T, 32);

/* Call with 2 arguments */
tea_call(T, 2);

/* Result is now on top of the stack */
double result = tea_get_number(T, -1);
tea_pop(T, 1);

printf("add(10, 32) = %g\n", result); /* 42 */
```

For functions that return multiple values, all return values are pushed onto the stack in order. You are responsible for knowing how many to expect and popping them when done.

Calling methods on an instance works the same way, except the instance itself is pushed as the first argument:

```tea
# counter.tea
class Counter
    fn init(start)
        self.value = start
    end

    fn increment(by)
        self.value = self.value + by
    end

    fn get()
        return self.value
    end
end
```

```c
/* Run the file */
tea_load_file(T, "counter.tea", NULL);
tea_call(T, 0);

/* Construct a Counter instance: push the class, push the argument, call */
tea_get_global(T, "Counter");
tea_push_number(T, 0);
tea_call(T, 1); /* Counter(0) */

/* The instance is now on top. Keep it at index 1 for convenience */

/* Call instance.increment(5) */
tea_get_attr(T, -1, "increment"); /* push the method */
tea_push_value(T, -2);            /* push self */
tea_push_number(T, 5);            /* push argument */
tea_call(T, 2);
tea_pop(T, 1);                    /* pop nil return value */

/* Call instance.get() */
tea_get_attr(T, -1, "get");
tea_push_value(T, -2);
tea_call(T, 1);

printf("counter = %g\n", tea_get_number(T, -1)); /* 5 */
tea_pop(T, 2); /* pop result and instance */
```

## Protected Calls

`tea_call` is unprotected. If the called function raises an error, it propagates immediately up the C call stack as a `longjmp`, bypassing any cleanup you might have between the `tea_call` site and whatever `setjmp` Teascript set up earlier. If there is no enclosing protected context, the panic handler fires and the process terminates.

In practice, calling Teascript from C almost always means using **protected calls** instead:

```c
int tea_pcall(tea_State* T, int n);
```

`tea_pcall` behaves identically to `tea_call` in the success case: it pops the function and arguments and pushes the return values. The difference is in the failure case. If the called function raises an error, `tea_pcall` catches it via `setjmp`, pushes the error message onto the stack, and returns a non-zero status code rather than unwinding through your code. Your C stack frames are preserved and you can handle the error however you like.

```c
tea_get_global(T, "add");
tea_push_number(T, 10);
tea_push_number(T, 32);

int status = tea_pcall(T, 2);
if(status != TEA_OK)
{
    fprintf(stderr, "error: %s\n", tea_get_string(T, -1));
    tea_pop(T, 1);
}
else
{
    printf("result: %g\n", tea_get_number(T, -1));
    tea_pop(T, 1);
}
```

There is a second variant for calling a C function in a protected context:

```c
int tea_pccall(tea_State* T, tea_CFunction func, void* ud);
```

`tea_pccall` runs `func(T)` under the same `setjmp` guard. The `ud` pointer is passed to `func` via the registry or a known stack position — typically you push whatever state `func` needs onto the stack before calling. This is useful when you need to perform a sequence of Teascript API calls that might fail, and you want to wrap the whole sequence in a single protected region rather than checking every individual call.

A typical pattern is to push all the setup work into a single `tea_CFunction` and run it with `tea_pccall`:

```c
static void do_setup(tea_State* T)
{
    tea_load_file(T, "init.tea", NULL);
    tea_call(T, 0);

    tea_get_global(T, "setup");
    tea_call(T, 0);
}

int status = tea_pccall(T, do_setup, NULL);
if(status != TEA_OK)
{
    fprintf(stderr, "setup failed: %s\n", tea_get_string(T, -1));
    tea_pop(T, 1);
}
```

If any call inside `do_setup` raises an error, `tea_pccall` catches it and returns the error code. Without this wrapper, a failure in the middle of `do_setup` would longjmp past your error handling entirely.

## Error Handling

When `tea_pcall` or `tea_pccall` catches an error, the top of the stack holds the error value. In most cases this is a string — the message passed to `tea_error` or formatted by the runtime — but Teascript allows throwing any value, so you should not assume it is always a string.

The error codes map to the `TEA_ERROR_*` constants defined in `tea.h`:

| Code | Meaning |
|---|---|
| `TEA_OK` | No error |
| `TEA_ERROR_SYNTAX` | Compilation failed |
| `TEA_ERROR_RUNTIME` | Runtime error inside the called code |
| `TEA_ERROR_MEMORY` | Allocator returned `NULL` |
| `TEA_ERROR_FILE` | File could not be opened or read |
| `TEA_ERROR_ERROR` | Error raised inside an error handler |

`TEA_ERROR_MEMORY` is worth singling out. A memory allocation failure is thrown as an error like any other, so `tea_pcall` will catch it and return `TEA_ERROR_MEMORY` with a string on the stack. However, the state is potentially degraded after an OOM — the GC may not have been able to run cleanly. Treat `TEA_ERROR_MEMORY` as unrecoverable in most embedding scenarios and tear down the state.

To raise errors from C, use `tea_error`:

```c
int tea_error(tea_State* T, const char* fmt, ...);
```

`tea_error` formats a message using `printf`-style specifiers, pushes the string onto the stack, and throws. It does not return. Call it only from within a protected context — either from a `tea_CFunction` registered with the runtime (which is always under a `setjmp` guard), or from inside a `tea_pccall`. Calling `tea_error` outside any protected context will longjmp into the void.

For argument validation in C functions, prefer the more specific helpers:

```c
int tea_arg_error(tea_State* T, int narg, const char* msg);
int tea_type_error(tea_State* T, int narg, const char* xname);
```

These format the error message to include the argument position, which makes the message significantly more useful to a script author:

```
bad argument #1 (number expected, got string)
```

rather than a bare message they would have to trace back to the right call themselves.

A complete error handling loop for an interactive interpreter might look like this:

```c
const char* line;
while((line = read_input()) != NULL)
{
    int status = tea_load_buffer(T, line, strlen(line), "=(stdin)");
    if(status == TEA_OK)
        status = tea_pcall(T, 0);

    if(status != TEA_OK)
    {
        if(tea_is_string(T, -1))
            fprintf(stderr, "%s\n", tea_get_string(T, -1));
        tea_pop(T, 1);
    }
    else
    {
        /* Print any return values left on the stack */
        int n = tea_get_top(T);
        for(int i = 0; i < n; i++)
        {
            if(tea_is_string(T, i))
                printf("%s\n", tea_get_string(T, i));
        }
        tea_set_top(T, 0);
    }
}
```

We check `tea_load_buffer` first because a syntax error at compile time never reaches `tea_pcall` — the loader returns `TEA_ERROR_SYNTAX` directly with the error message already on the stack. Only if loading succeeds do we proceed to the protected call.
