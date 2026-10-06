---
title: Type Testing
weight: 1499
---

This section covers functions for querying and comparing values on the Tea stack. These functions allow C code to inspect the type of a value, obtain readable type names and test for specific categories of values.

---

## tea_get_mask()

```c
int tea_get_mask(tea_State* T, int index);
```

Returns a bitmask corresponding to the type of the value at `index`. The mask is a single bit set in the position associated with the value's type (e.g. `TEA_MASK_NUMBER`, `TEA_MASK_STRING`). If the slot has no value (i.e. it is empty), `TEA_MASK_NONE` is returned.

This is useful for accepting multiple types in a single check, by OR-ing each type mask together.

#### Arguments
- `T`: Teascript state
- `index`: Stack index of the value to inspect

#### Returns
A single-bit type mask, or `TEA_MASK_NONE` if the slot is non-existent.

#### Example
```c
tea_push_number(T, 3.14);
tea_push_string(T, "tea");   /* [3.14, "tea"] */

if(tea_get_mask(T, -1) & (TEA_MASK_STRING | TEA_MASK_NUMBER))
{
    /* Either a string or a number: accepted */
}
```

#### See Also
tea_get_type, tea_is_mask, tea_typeof

---

## tea_get_type()

```c
int tea_get_type(tea_State* T, int index);
```

Returns the type of the value at `index` as one of the `TEA_TYPE_*` constants. If the slot is empty, `TEA_TYPE_NONE` is returned.

#### Arguments
- `T`: Teascript state
- `index`: Stack index of the value to inspect

#### Returns
The `TEA_TYPE_*` constant describing the value's type, or `TEA_TYPE_NONE` if the slot has no value.

#### Example
```c
tea_push_integer(T, 42);

if(tea_get_type(T, -1) == TEA_TYPE_NUMBER)
{
    tea_Number n = tea_get_number(T, -1);
}
```

#### See Also
tea_get_mask, tea_typeof, tea_check_type

---

## tea_is_object()

```c
bool tea_is_object(tea_State* T, int index);
```

Gives `true` if the value at `index` is a garbage-collected object (string, list, map, function, module, class, instance, userdata, etc.), and `false` otherwise. Primitive values such as numbers, booleans, pointers and nil are not considered objects.

#### Arguments
- `T`: Teascript state
- `index`: Stack index of the value to test

#### Returns
`true` if the value is a GC object, `false` otherwise.

#### Example
```c
tea_push_string(T, "hello");
tea_push_integer(T, 123);

bool a = tea_is_object(T, -2);  /* true  */
bool b = tea_is_object(T, -1);  /* false */
```

#### See Also
tea_is_cfunction, tea_get_type

---

## tea_is_cfunction()

```c
bool tea_is_cfunction(tea_State* T, int index);
```

Gives `true` if the value at `index` is a C function (a function created via `tea_push_cfunction`, `tea_push_cclosure`, or one of the registration helpers), and `false` otherwise. Teascript functions written in Tea are not considered C functions.

#### Arguments
- `T`: Teascript state
- `index`: Stack index of the value to test

#### Returns
`true` if the value is a C function, `false` otherwise.

#### Example
```c
tea_push_cfunction(T, my_callback, 0, 0);

if(tea_is_cfunction(T, -1))
{
    tea_CFunction fn = tea_to_cfunction(T, -1);
    /* ... */
}
```

#### See Also
tea_is_object, tea_to_cfunction, tea_check_cfunction

---

## tea_typeof()

```c
const char* tea_typeof(tea_State* T, int index);
```

Provides a human-readable, NUL terminated C string describing the type of the value at `index` (e.g. `"number"`, `"string"`, `"list"`). If the slot has no value, the string `"no value"` is given. The provided string is owned by the interpreter and must not be modified.

This is primarily intended for diagnostics, error messages, and debugging output.

#### Arguments
- `T`: Teascript state
- `index`: Stack index of the value to inspect

#### Returns
A constant string naming the value's type, or `"no value"` if the slot is non-existent.

#### Example
```c
tea_push_map(T);

tea_push_fstring(T, "unexpected type: %s", tea_typeof(T, -2));
/* Pushes "unexpected type: map" */
```

#### See Also
tea_get_type, tea_get_mask

---

## tea_equal()

```c
bool tea_equal(tea_State* T, int index1, int index2);
```

Provides `true` if the values at `index1` and `index2` are equal, following Teascript equality semantics. This may invoke user-defined `+` operator method for instances and userdata, and therefore is not guaranteed to be side-effect free.

Both indices must refer to valid stack slots.

#### Arguments
- `T`: Teascript state
- `index1`: Stack index of the first (left) value
- `index2`: Stack index of the second (right) value

#### Returns
`true` if the values are equal, `false` otherwise.

#### Example
```c
tea_push_integer(T, 10);
tea_push_integer(T, 10);
tea_push_integer(T, 20);

bool ab = tea_equal(T, -3, -2);  /* true  */
bool ac = tea_equal(T, -3, -1);  /* false */
```

#### See Also
tea_rawequal

---

## tea_rawequal()

```c
bool tea_rawequal(tea_State* T, int index1, int index2);
```

Provides `true` if the values at `index1` and `index2` are equal without invoking any defined operator method. For object types, this performs a reference comparison (identity), not a structural one. This function never calls user code and has no side effects.

Both indices must refer to valid stack slots.

#### Arguments
- `T`: Teascript state
- `index1`: Stack index of the first (left) value
- `index2`: Stack index of the second (right) value

#### Returns
`true` if the values are raw-equal, `false` otherwise.

#### Example
```c
tea_push_string(T, "tea");
tea_push_string(T, "tea");   /* Interned strings: same object */
tea_push_string(T, "coffee");

bool a = tea_rawequal(T, -3, -2);  /* true  */
bool b = tea_rawequal(T, -3, -1);  /* false */
```

#### See Also
tea_equal, tea_get_type
