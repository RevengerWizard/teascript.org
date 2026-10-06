---
title: Error Handling
weight: 2000
---

This section covers the functions used to raise errors from C functions. All errors in Teascript propagate as values on the stack; when an error is raised inside a protected call (`tea_pcall`, `tea_pccall`), control returns to the caller with the error value pushed. `tea_error` and its relatives format a message, push it onto the stack, and then trigger the error unwinding. They are declared as returning `int`, even though they never actually return normally.

---

## tea_throw()

```c
void tea_throw(tea_State* T);
```

{{< stack before="...,errobj" after="..." >}}

Raises an error using the value currently at the top of the stack as the error object. The value may be of any type (typically a string). The stack top is consumed as part of the error raising.

This is the lowest-level error-raising primitive; `tea_error` and friends are built on top of it. Use `tea_throw` when you want to raise a non-string error object or one that has already been prepared on the stack.

#### Arguments
- `T`: Teascript state

#### Errors
Always raises an error; never returns normally.

#### Example
```c
static int fail_with_table(tea_State* T)
{
    tea_new_map(T);
    tea_push_string(T, "unknown field");
    tea_set_key(T, -2, "message");
    tea_throw(T);
    return 0;   /* unreachable */
}
```

#### See Also
tea_error, tea_pcall

---

## tea_error()

```c
int tea_error(tea_State* T, const char* fmt, ...);
```

{{< stack before="..." after="...,errobj" >}}

Raises an error with a formatted message. The format string `fmt` and the following arguments are processed like `tea_push_fstring` to build the error message, which is then raised via `tea_throw`.

Like all error-raising functions, this never returns normally when called from within a protected context.

#### Arguments
- `T`: Teascript state
- `fmt`: `printf`-style format string
- `...`: Arguments for `fmt`

#### Errors
Always raises an error; does not return normally.

#### Example
```c
static int divide(tea_State* T)
{
    tea_Number a = tea_check_number(T, 1);
    tea_Number b = tea_check_number(T, 2);
    if(b == 0.0)
        return tea_error(T, "division by zero: %g / %g", a, b);
    tea_push_number(T, a / b);
    return 1;
}
```

#### See Also
tea_throw, tea_arg_error, tea_type_error

---

## tea_arglimit_error()

```c
int tea_arglimit_error(tea_State* T, int narg, const char* msg);
```

{{< stack before="..." after="...,errobj" >}}

Raises an error indicating the argument `narg` is out of the acceptable range (for example, when a numeric argument exceeds a permitted maximum). `msg` is a message describing the limit. The `narg` is included in the standard "bad argument #N" prefix.

#### Arguments
- `T`: Teascript state
- `narg`: One-based argument index
- `msg`: Message describing the violated limit

#### Errors
Always raises an error; does not return normally.

#### Example
```c
static int set_quality(tea_State* T)
{
    tea_Integer q = tea_check_integer(T, 1);
    if(q < 0 || q > 100)
        return tea_arglimit_error(T, 1, "quality must be in range [0, 100]");
    /* ... */
    return 0;
}
```

#### See Also
tea_arg_error, tea_type_error

---

## tea_arg_error()

```c
int tea_arg_error(tea_State* T, int narg, const char* msg);
```

{{< stack before="..." after="...,errobj" >}}

Raises a generic "bad argument #narg" error with the given message. This is the general-purpose argument error, used for issues that are not type mismatches (for which `tea_type_error` is more appropriate).

#### Arguments
- `T`: Teascript state
- `narg`: One-based argument index
- `msg`: Message describing the problem

#### Errors
Always raises an error; does not return normally.

#### Example
```c
static int set_name(tea_State* T)
{
    const char* name = tea_check_string(T, 1);
    if(name[0] == '\0')
        return tea_arg_error(T, 1, "name must not be empty");
    /* ... */
    return 0;
}
```

#### See Also
tea_type_error, tea_arglimit_error

---

## tea_type_error()

```c
int tea_type_error(tea_State* T, int narg, const char* xname);
```

{{< stack before="..." after="...,errobj" >}}

Raises a "bad argument #narg" error specialized for type mismatches. `xname` is the name of the expected type or userdata class, and is inserted into the standard message (for example, `"string expected, got number"`).

#### Arguments
- `T`: Teascript state
- `narg`: One-based argument index
- `xname`: Name of the expected type or class

#### Errors
Always raises an error; does not return normally.

#### Example
```c
static int connect(tea_State* T)
{
    if(!tea_test_udata(T, 1, "Socket"))
        return tea_type_error(T, 1, "Socket");
    /* ... */
    return 0;
}
```

#### See Also
tea_arg_error, tea_arglimit_error
