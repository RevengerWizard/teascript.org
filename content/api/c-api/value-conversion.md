---
title: Value Conversion
weight: 600
---

This section covers functions that convert values on the Teascript stack to native C types. Unlike the `tea_check_*` family, these functions do **not** raise errors on type mismatches; instead, they perform lenient conversions where possible and return safe default values (such as `0`, `NULL`, or `false`) when a conversion cannot be performed. Some conversions push a new string onto the stack, so be mindful of stack balance.

---

## tea_to_bool()

```c
bool tea_to_bool(tea_State* T, int index);
```

Converts the value at `index` to a C boolean following Teascript truthiness rules. `nil` and `false` give `false`; every other value (including `0` and the empty string) yields `true`.

#### Arguments
- `T`: Teascript state
- `index`: Stack index of the value to convert.

#### Returns
The boolean result of the conversion. Returns `false` if `index` is invalid or holds no value.

#### Example
```c
tea_push_number(T, 0);
tea_push_nil(T);

bool a = tea_to_bool(T, -2);  /* a = true  (0 is truthy) */
bool b = tea_to_bool(T, -1);  /* b = false (nil is falsy) */
```

#### See Also
tea_get_bool, tea_check_bool

---

## tea_to_numberx()

```c
tea_Number tea_to_numberx(tea_State* T, int index, bool* is_num);
```

Converts the value at `index` to a number. If `is_num` is not `NULL`, it is set to `true` when the conversion succeeded and `false` otherwise. If the value cannot be converted, `0` is returned.

#### Arguments
- `T`: Teascript state
- `index`: Stack index of the value to convert.
- `is_num`: Optional output flag indicating success.

#### Returns
The converted number, or `0` on failure.

#### Example
```c
tea_push_string(T, "42");

bool ok;
tea_Number n = tea_to_numberx(T, -1, &ok);
/* n = 42, ok = true */

tea_push_string(T, "hello");
n = tea_to_numberx(T, -1, &ok);
/* n = 0, ok = false */
```

#### See Also
tea_to_number, tea_to_integerx

---

## tea_to_number()

```c
tea_Number tea_to_number(tea_State* T, int index);
```

Converts the value at `index` to a number, discarding the success flag. Equivalent to calling `tea_to_numberx(T, index, NULL)`.

#### Arguments
- `T`: Teascript state
- `index`: Stack index of the value to convert.

#### Returns
The converted number, or `0` if the value cannot be converted.

#### Example
```c
tea_push_string(T, "3.14");
tea_Number n = tea_to_number(T, -1);  /* n = 3.14 */
```

#### See Also
tea_to_numberx, tea_get_number

---

## tea_to_integerx()

```c
tea_Integer tea_to_integerx(tea_State* T, int index, bool* is_num);
```

Converts the value at `index` to a `tea_Integer` (a `ptrdiff_t`). If `is_num` is not `NULL`, it is set to `true` on success and `false` otherwise. If the value cannot be converted, `0` is returned.

#### Arguments
- `T`: Teascript state
- `index`: Stack index of the value to convert.
- `is_num`: Optional output flag indicating success.

#### Returns
The converted integer, or `0` on failure.

#### Example
```c
tea_push_number(T, 7.9);

bool ok;
tea_Integer i = tea_to_integerx(T, -1, &ok);
/* i = 7, ok = true */
```

#### See Also
tea_to_integer, tea_to_numberx

---

## tea_to_integer()

```c
tea_Integer tea_to_integer(tea_State* T, int index);
```

Converts the value at `index` to a `tea_Integer`, discarding the success flag. Equivalent to calling `tea_to_integerx(T, index, NULL)`.

#### Arguments
- `T`: Teascript state
- `index`: Stack index of the value to convert.

#### Returns
The converted integer, or `0` if the value cannot be converted.

#### Example
```c
tea_push_number(T, 10.5);
tea_Integer i = tea_to_integer(T, -1);  /* i = 10 */
```

#### See Also
tea_to_integerx, tea_get_integer

---

## tea_to_pointer()

```c
const void* tea_to_pointer(tea_State* T, int index);
```

Converts the value at `index` to a C pointer. The exact conversion rules depend on the underlying type, but strings, numbers, and pointers are typically supported. Returns `NULL` if the value cannot be converted.

#### Arguments
- `T`: Teascript state
- `index`: Stack index of the value to convert.

#### Returns
A `const void*` representing the converted value, or `NULL` on failure.

#### Example
```c
tea_push_pointer(T, (void*)0x1234);
const void* p = tea_to_pointer(T, -1);  /* p = 0x1234 */
```

#### See Also
tea_get_pointer, tea_check_pointer

---

## tea_to_userdata()

```c
void* tea_to_userdata(tea_State* T, int index);
```

Converts the value at `index` to a userdata pointer. If the value is a userdata, returns the pointer to its data block. If it is a raw pointer value, returns that pointer. Returns `NULL` for any other type or an invalid index.

#### Arguments
- `T`: Teascript state
- `index`: Stack index of the value to convert.

#### Returns
A pointer to the userdata payload, the raw pointer value, or `NULL`.

#### Example
```c
void* data = tea_new_userdata(T, sizeof(int));
*(int*)data = 99;

void* p = tea_to_userdata(T, -1);  /* p == data */
```

#### See Also
tea_get_userdata, tea_check_userdata

---

## tea_to_lstring()

```c
const char* tea_to_lstring(tea_State* T, int index, size_t* len);
```

Converts the value at `index` to a string using Teascript's generic string conversion (honoring a `__tostring` metamethod for instances and userdata). **Pushes the resulting string onto the stack** and returns its internal C buffer. If `len` is not `NULL`, it receives the string length. Returns `NULL` if `index` holds no value.

#### Arguments
- `T`: Teascript state
- `index`: Stack index of the value to convert.
- `len`: Optional output for the string length.

#### Returns
A pointer to the null-terminated string buffer, or `NULL` if the value is invalid.

#### Example
```c
tea_push_integer(T, 1234);

size_t len;
const char* s = tea_to_lstring(T, -1, &len);
/* s = "1234", len = 4, stack top now holds the string */
```

#### See Also
tea_to_string, tea_get_lstring

---

## tea_to_string()

```c
const char* tea_to_string(tea_State* T, int index);
```

Converts the value at `index` to a string using Teascript's generic string conversion. **Pushes the resulting string onto the stack** and returns its internal C buffer. Equivalent to calling `tea_to_lstring(T, index, NULL)`.

#### Arguments
- `T`: Teascript state
- `index`: Stack index of the value to convert.

#### Returns
A pointer to the null-terminated string buffer, or `NULL` if the value is invalid.

#### Example
```c
tea_push_bool(T, true);
const char* s = tea_to_string(T, -1);  /* s = "true" */
```

#### See Also
tea_to_lstring, tea_get_string

---

## tea_to_cfunction()

```c
tea_CFunction tea_to_cfunction(tea_State* T, int index);
```

Converts the value at `index` to a C function pointer. Returns the underlying C function if the value is a C function or a C closure; otherwise returns `NULL`.

#### Arguments
- `T`: Teascript state
- `index`: Stack index of the value to convert.

#### Returns
The `tea_CFunction` pointer, or `NULL` if the value is not a C function.

#### Example
```c
static void my_cfunc(tea_State* T) { /* ... */ }

tea_push_cfunction(T, my_cfunc, 0, 0);
tea_CFunction f = tea_to_cfunction(T, -1);  /* f == my_cfunc */
```

#### See Also
tea_check_cfunction, tea_is_cfunction
