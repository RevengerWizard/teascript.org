---
title: Type Checking
weight: 1500
---

This section describes the functions used to validate arguments received by C functions. They verify stack space, and assert that a value at a given stack index is of the expected type (or range of types), raising a descriptive runtime error if the check fails. Use the `tea_check_*` family to guard your C functions against ill-typed Teascript calls, and the `tea_test_*` and `tea_is_*` family when you want to probe a value without raising an error.

---

## tea_test_stack()

```c
bool tea_test_stack(tea_State* T, int size);
```

Checks whether the stack has space for at least size additional elements. If there is enough room, and `size` is positive, the stack is grown as needed and `true` is returned. Otherwise `false` is returned without changing the stack.

Unlike `tea_check_stack`, this function does not raise an error, making it suitable for gracefully handling potential stack overflows.

#### Arguments
- `T`: Teascript state
- `size`: Number of additional slots required

#### Returns
`true` if the stack can accomodate `size` more elements; `false` otherwise.

#### Example
```c
if(!tea_test_stack(T, 4))
{
    tea_error(T, "not enough stack space");
}
```

#### See Also
tea_check_stack, tea_get_top

---

## tea_check_stack()

```c
void tea_check_stack(tea_State* T, int size, const char* msg);
```

Ensures the stack has room for at least `size` additional slots, growing it if necessary. If the stack cannot grow enough.

#### Arguments
- `T`: Teascript state
- `size`: Number of free slots required
- `msg`: Descriptive message included in the error if the check fails

#### Errors
Raises a runtime error (stack overflow) using `msg` as part of the message if the requested space is not available.

#### Example
```c
static int my_push_three(tea_State* T)
{
    tea_check_stack(T, 3, "my_push_three");
    tea_push_integer(T, 1);
    tea_push_integer(T, 2);
    tea_push_integer(T, 3);
    return 3;
}```

#### See Also
tea_test_stack

---

## tea_check_type()

```c
void tea_check_type(tea_State* T, int index, int type);
```

Checks that the value at `index` has exactly the given type (one of the `TEA_TYPE_*` constants).

#### Arguments
- `T`: Teascript state
- `index`: Stack index of the value to check
- `type`: Expected type constant (`TEA_TYPE_*`)

#### Errors
Raises a type error if the value at `index` is not of the expected type.

#### Example
```c
/* Ensure argument 1 is a list */
tea_check_type(T, 1, TEA_TYPE_LIST);
```

#### See Also
tea_check_any, tea_get_type

---

## tea_check_any()

```c
void tea_check_any(tea_State* T, int index);
```

Checks that there is any value at `index`. Raises an error if the slot at `index` is out of range or resolves to "no value". Useful for validating required arguments that may be of any type.

#### Arguments
- `T`: Teascript state
- `index`: Stack index to verify

#### Errors
Raises a runtime error if the slot is empty.

#### Example
```c
/* Argument 1 is required, but may be of any type */
tea_check_any(T, 1);
```

#### See Also
tea_check_type, tea_is_none

---

## tea_check_bool()

```c
bool tea_check_bool(tea_State* T, int index);
```

Checks that the value at `index` is a boolean and returns it.

#### Arguments
- `T`: Teascript state
- `index`: Stack index of the value to check

#### Returns
The boolean value at `index`.

#### Errors
Raises a type error if the value is not a boolean.

#### Example
```c
bool verbose = tea_check_bool(T, 2);
```

#### See Also
tea_opt_bool, tea_is_bool

---

## tea_check_number()

```c
tea_Number tea_check_number(tea_State* T, int index);
```

Checks that the value at `index` is a number and returns it as a `tea_Number`.

#### Arguments
- `T`: Teascript state
- `index`: Stack index of the value to check

#### Returns
The numeric value at `index`.

#### Errors
Raises a type error if the value is not a number.

#### Example
```c
tea_Number radius = tea_check_number(T, 1);
```

#### See Also
tea_check_integer, tea_opt_number

---

## tea_check_integer()

```c
tea_Integer tea_check_integer(tea_State* T, int index);
```

Checks that the value at `index` is a number and returns it truncated to a `tea_Integer`.

#### Arguments
- `T`: Teascript state
- `index`: Stack index of the value to check

#### Returns
The integer value at `index`.

#### Errors
Raises a type error if the value is not a number.

#### Example
```c
tea_Integer count = tea_check_integer(T, 2);
```

#### See Also
tea_check_number, tea_opt_integer

---

## tea_check_pointer()

```c
const void* tea_check_pointer(tea_State* T, int index);
```

Checks that the value at `index` is a pointer and returns it.

#### Arguments
- `T`: Teascript state
- `index`: Stack index of the value to check

#### Returns
The pointer value at `index` as `const void*`.

#### Errors
Raises a type error if the value is not a pointer.

#### Example
```c
const void* handle = tea_check_pointer(T, 1);
```

#### See Also
tea_opt_pointer, tea_is_pointer

---

## tea_check_range()

```c
void tea_check_range(tea_State* T, int index, tea_Number* start, tea_Number* end, tea_Number* step);
```

Checks that the value at `index` is a range and, if so, stores its components into the provided output pointers. Any of the components may be `NULL` if not needed.

#### Arguments
- `T`: Teascript state
- `index`: Stack index of the value to check
- `start`: Output for the range start, or `NULL`
- `end`: Output for the range end, or `NULL`
- `step`: Output for the range step, or `NULL`

#### Errors
Raises a type error if the value is not a range.

#### Example
```c
tea_Number start, end, step;
tea_check_range(T, 1, &start, &end, &step);
```

#### See Also
tea_get_range, tea_push_range

---

## tea_check_lstring()

```c
const char* tea_check_lstring(tea_State* T, int index, size_t* len);
```

Checks that the value at `index` is a string and returns a pointer to its data, storing its length in `*len` if provided.

The returned pointer is valid as long as the string remains on the stack, preventing it from being garbage collected.

#### Arguments
- `T`: Teascript state
- `index`: Stack index of the value to check
- `len`: Output for the string length, or `NULL`

#### Returns
Pointer to the string's byte data.

#### Errors
Raises a type error if the value is not a string.

#### Example
```c
size_t len;
const char* data = tea_check_lstring(T, 1, &len);
/* data may contain embedded NUL bytes; use len */
```

#### See Also
tea_check_string, tea_get_lstring

---

## tea_check_string()

```c
const char* tea_check_string(tea_State* T, int index);
```

Checks that the value at `index` is a string and returns a pointer to its data.

Use `tea_check_lstring` if the string may contain embedded NUL characters.

#### Arguments
- `T`: Teascript state
- `index`: Stack index of the value to check

#### Returns
Pointer to the string's byte data.

#### Errors
Raises a type error if the value is not a string.

#### Example
```c
const char* name = tea_check_string(T, 1);
```

#### See Also
tea_check_lstring, tea_opt_string

---

## tea_check_cfunction()

```c
tea_CFunction tea_check_cfunction(tea_State* T, int index);
```

Checks that the value at `index` is a C function and returns its function pointer.

#### Arguments
- `T`: Teascript state
- `index`: Stack index of the value to check

#### Returns
The `tea_CFunction` pointer stored in the value.

#### Errors
Raises a type error if the value is not a C function.

#### Example
```c
tea_CFunction cb = tea_check_cfunction(T, 2);
```

#### See Also
tea_opt_cfunction, tea_is_cfunction

---

## tea_check_userdata()

```c
void* tea_check_userdata(tea_State* T, int index);
```

Checks that the value at `index` is any userdata and returns a pointer to its raw data block.

Unlike `tea_check_udata`, this does not verify a class name.

#### Arguments
- `T`: Teascript state
- `index`: Stack index of the value to check

#### Returns
Pointer to the raw userdata block.

#### Errors
Raises a type error if the value is not a userdata.

#### Example
```c
void* buf = tea_check_userdata(T, 1);
```

#### See Also
tea_check_udata, tea_get_userdata

---

## tea_test_udata()

```c
void* tea_test_udata(tea_State* T, int idx, const char* name);
```

Tests whether the value at `idx` is userdata whose class matches the class registered under `name`. If so, returns a pointer to the raw userdata block.

This is the non-raising counterpart of `tea_check_udata`, suitable for accepting optional or polymorphic arguments.

#### Arguments
- `T`: Teascript state
- `index`: Stack index of the value to check
- `name`: Name the userdata class was registered with

#### Returns
Pointer to the raw userdata block on success; `NULL` otherwise.

#### Example
```c
void* ring = tea_test_udata(T, 1, "RingBuffer");
if(ring)
{
    /* Argument is a RingBuffer */
}
```

#### See Also
tea_check_udata, tea_new_udata

---

## tea_check_udata()

```c
void* tea_check_udata(tea_State* T, int index, const char* name)
```

Retrieves the userdata pointer at the stack position `index`, checking that it was created with the matching `name`. Raises a type error if the value at `index` is not a userdata type, or if its name does not match.

This function is safe to use in any C function that receives values from Teascript code.

#### Arguments
- `T`: Teascript state
- `index`: Stack index of the value to retrieve.
- `name`: The name the userdata was registered with (e.g. "RingBuffer").

#### Returns
A pointer to the raw userdata block. This function will never return NULL.

#### Errors
Raises a runtime error if the value is not a named userdata or if the name does not correspond.

#### Example
```c
static int ringbuffer_push(tea_State* T)
{
    RingBuffer* rb = tea_check_udata(T, 1, "RingBuffer");
    tea_Number val = tea_check_number(T, 2);
    ringbuffer_push_impl(rb, val);
    return 0;
}
```

#### See also
tea_test_udata, tea_get_userdata, tea_new_udata

---

## tea_check_option()

```c
int tea_check_option(tea_State* T, int index, const char* def, const char* const options[]);
```

Checks whether the string at `index` matches one of the strings in the NULL-terminated array `options`, returning the index of the match. If `def` is non-`NULL` and the value at `index` is `nil` or absent, `def` is used as the value instead.

This is useful for parsing enum-like string arguments in C functions.

#### Arguments
- `T`: Teascript state
- `index`: Stack index of the value to check
- `def`: Default value used when the argument is absent, or `NULL` to require the argument
- `options`: NULL-terminated array of valid option strings

#### Returns
The zero-based index of the matched option.

#### Errors
Raises a runtime error if the value is not a string or does not match any of the given options.

#### Example
```c
static const char* const modes[] = {"read", "write", "append", NULL};
int mode = tea_check_option(T, 2, "read", modes);
/* mode is 0, 1, or 2 */
```

#### See Also
tea_check_string, tea_opt_string
