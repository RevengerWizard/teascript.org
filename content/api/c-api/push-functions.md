---
title: Push Functions
weight: 700
---

This section covers functions used to push values onto the Tea value stack from C. These are the primary means of passing data from C code into Teascript, whether as arguments to functions, fields in tables, or standalone values. All push functions increment the stack top and may raise a memory error if allocation fails.

---

## tea_push_nil()

```c
void tea_push_nil(tea_State* T);
```

{{< stack before="..." after="...,nil" >}}

Pushes a `nil` value onto the stack.

#### Arguments
- `T`: Teascript state

#### Example
```c
tea_push_nil(T);    /* [nil] */
```

#### See Also
tea_push_bool, tea_push_number

---

## tea_push_true()

```c
void tea_push_true(tea_State* T);
```

{{< stack before="..." after="...,true" >}}

Pushes the boolean value `true` (1 in C) onto the stack. Equivalent to calling `tea_push_bool(T, true)`.

#### Arguments
- `T`: Teascript state

#### Example
```c
tea_push_true(T);
```

#### See Also
tea_push_false, tea_push_bool

---

## tea_push_false()

```c
void tea_push_false(tea_State* T);
```

{{< stack before="..." after="...,false" >}}

Pushes the boolean value `false` (0 in C) onto the stack. Equivalent to calling `tea_push_bool(T, false)`;

#### Arguments
- `T`: Teascript state

#### Example
```c
tea_push_false(T);  /* [false] */
```

#### See Also
tea_push_true, tea_push_bool

---

## tea_push_bool()

```c
void tea_push_bool(tea_State* T, bool b);
```

{{< stack before="..." after="...,true" >}}
{{< stack before="..." after="...,false" >}}

Pushes a boolean value onto the stack. If `b` is non-zero, pushes `true`; otherwise pushes `false`.

#### Arguments
- `T`: Teascript state
- `b`: The boolean value to push

#### Example
```c
tea_push_bool(T, false);    /* [false] */
tea_push_bool(T, true);     /* [false, true] */
```

#### See Also
tea_push_true, tea_push_false

---

## tea_push_number()

```c
void tea_push_number(tea_State* T, tea_Number n);
```

{{< stack before="..." after="...,num" >}}

Pushes a number (IEEE double) onto the stack.

If `n` is a NaN, it may be normalized into another NaN form.

#### Arguments
- `T`: Teascript state
- `n`: The number to push

#### Example
```c
tea_push_number(T, 547.98);
```

#### See Also
tea_push_integer

---

## tea_push_integer()

```c
void tea_push_integer(tea_State* T, tea_Integer n);
```

{{< stack before="..." after="...,integer" >}}

Pushes an integer value onto the stack. The integer is stored internally as a double, so large integers may lose precision.

#### Arguments
- `T`: Teascript state
- `n`: The integer value to push

#### Example
```c
tea_push_integer(T, 987);
```

#### See Also
tea_push_number

---

## tea_push_pointer()

```c
void tea_push_pointer(tea_State* T, void* p);
```

{{< stack before="..." after="...,ptr" >}}

Pushes a raw C pointer onto the stack. The pointer is not managed by the garbage collector and must be kept alive by the caller.

#### Arguments
- `T`: Teascript state
- `p`: The pointer to push

#### Example
```c
int data = 42;
tea_push_pointer(T, &data);     /* [ptr] */
```

#### See Also
tea_push_userdata, tea_new_userdata

---

## tea_push_lstring()

```c
const char* tea_push_lstring(tea_State* T, const char* s, size_t len);
```

{{< stack before="..." after="...,str" >}}

Pushes a string of explicit length `len` onto the stack. Unlike `tea_push_string()`, this function can handle strings containing embedded NUL characters.

#### Arguments
- `T`: Teascript state
- `s`: Pointer to the string data
- `len`: Length of the string in bytes

#### Returns
A pointer to the interned string data on the stack.

#### Example
```c
const char* str = "foo\0bar";
tea_push_lstring(T, str, 7);    /* ["foo\0bar"] */
```

#### See Also
tea_push_string, tea_push_fstring

---

## tea_push_string()

```c
const char* tea_push_string(tea_State* T, const char* s);
```

{{< stack before="..." after="...,str" >}}

Pushes a NUL-terminated C string onto the stack. The string length is determined automatically using a `strlen` equivalent. A pointer to the interned string data is returned.

If input string might contain internal NUL characters, use `tea_push_lstring()` instead.

#### Arguments
- `T`: Teascript state
- `s`: Pointer to the NUL-terminated string

#### Returns
A pointer to the interned string data on the stack.

#### Example
```c
tea_push_string(T, "foo");      /* ["foo"] */
tea_push_string(T, "foo\0bar"); /* ["foo", "foo"] */
tea_push_string(T, "");         /* ["foo", "foo", ""] */
```

#### See Also
tea_push_lstring, tea_push_fstring

---

## tea_push_fstring()

```c
const char* tea_push_fstring(tea_State* T, const char* fmt, ...);
```

{{< stack before="..." after="...,str" >}}

Pushes a formatted string onto the stack using a `printf`-style format string and variadic arguments. This is a convenience function that internally calls `tea_push_vfstring`.

#### Arguments
- `T`: Teascript state
- `fmt`: Format string (limited `printf`-like syntax)
- `...`: Variable arguments corresponding to the format specifiers

#### Returns
A pointer to the interned string data on the stack.

#### Example
```c
tea_push_fstring(T, "Hello, %s! You have %d messages.", "Alice", 5);
/* ["Hello, Alice! You have 5 messages."] */
```

#### See Also
tea_push_vfstring, tea_push_string

---

## tea_push_vfstring()

```c
const char* tea_push_vfstring(tea_State* T, const char* fmt, va_list args);
```

{{< stack before="..." after="...,str" >}}

Pushes a formatted string onto the stack using a `printf`-style format string and a `va_list` of arguments. This is the `va_list` variant of `tea_push_fstring`.

#### Arguments
- `T`: Teascript state
- `fmt`: Format string (limited `printf`-like syntax)
- `args`: A `va_list` containing the arguments

#### Returns
A pointer to the interned string data on the stack.

#### Example
```c
void log_message(tea_State* T, const char* fmt, ...)
{
    va_list args;
    va_start(args, fmt);
    tea_push_vfstring(T, fmt, args);
    va_end(args);
    /* ... use the string on the stack ... */
}
```

#### See Also
tea_push_fstring

---

## tea_push_range()

```c
void tea_push_range(tea_State* T, tea_Number start, tea_Number end, tea_Number step);
```

{{< stack before="..." after="...,range" >}}

Pushes a range object onto the stack. A range represents a numeric sequence defined by a `start` value, an `end` value, and a `step` increment.

#### Arguments
- `T`: Teascript state
- `start`: The starting value of the range
- `end`: The ending value of the range
- `step`: The step increment between values

#### Example
```c
tea_push_range(T, 1, 10, 2);    /* [1..10 step 2] */
tea_push_range(T, 0, 1, 0.1);   /* [0..1 step 0.1] */
```

#### See Also
tea_get_range, tea_check_range

---

## tea_push_cclosure()

```c
void tea_push_cclosure(tea_State* T, tea_CFunction fn, int nupvalues, int nargs, int nopts);
```

{{< stack before="...,upval1,...,upvalN" after="...,cclosure" >}}

Pushes a new C closure onto the stack. A C closure is a C function together with a set of upvalues. The `nupvalues` values at the top of the stack are all popped and stored as the closure's upvalues.

The `nargs` parameter specifies the number of required arguments, and `nopts` specifies the number of optional arguments. Use `TEA_VARG` for variadic functions.

#### Arguments
- `T`: Teascript state
- `fn`: The C function to be called the closure is invoked
- `nupvalues`: Number of upvalues to pop from the top of the stack
- `nargs`: Number of required arguments
- `nopts`: Number of optional arguments, or `TEA_VARG` for variadic

#### Example
```c
tea_push_integer(T, 100);   /* upvalue 1 */
tea_push_integer(T, 200);   /* upvalue 2 */
tea_push_cclosure(T, my_func, 2, 1, 0);
/* [cclosure] with upvalues [100, 200] */
```

#### See Also
tea_push_cfunction, tea_set_funcs

---

## tea_push_cfunction()

```c
void tea_push_cfunction(tea_State* T, tea_CFunction fn, int nargs, int nopts);
```

{{< stack before="..." after="...,cfunction" >}}

Pushes a new C function onto the stack. This is a convenience function equivalent to calling `tea_push_cclosure` with zero upvalues.

The `nargs` parameter specifies the number of required arguments, and `nopts` specifies the number of optional arguments. Use `TEA_VARG` for variadic functions.

#### Arguments
- `T`: Teascript state
- `fn`: The C function to push
- `nargs`: Number of required arguments
- `nopts`: Number of optional arguments, or `TEA_VARG` for variadic

#### Example
```c
tea_push_cfunction(T, my_func, 2, 1);   /* [cfunction] */
```

#### See Also
tea_push_cclosure, tea_set_funcs
