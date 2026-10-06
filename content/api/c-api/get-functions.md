---
title: Get Functions
weight: 400
---

This section covers functions that read values from the Teascript stack and convert them into C types. These functions assume the value at the given index is already of the expected type; they perform an API check and will raise an internal error if the type does no match, Unlike the `tea_check_*` functions, they do not perform user-facing errors, and unlike `tea_to_*` they do not coerce values.

---

## tea_get_bool()

```c
bool tea_get_bool(tea_State* T, int index);
```

Retrieves the boolean value at `index`. The value must be a boolean.

#### Arguments
- `T`: Teascript state
- `index`: Stack index of the value to retrieve

#### Returns
The boolean value at the given index.

#### Errors
Raises an internal API error if the value at `index` is not a boolean.

#### Example
```c
bool val = tea_get_bool(T, -3);
if(val)
{
    printf("value is true\n");
}
else
{
    printf("value is false\n");
}
```

#### See Also
tea_to_bool, tea_check_bool, tea_is_bool

---

## tea_get_number()

```c
tea_Number tea_get_number(tea_State* T, int index);
```

Retrieves the numeric value (a `double`) at `index`. The value must be a number.

#### Arguments
- `T`: Teascript state
- `index`: Stack index of the value to retrieve

#### Returns
The number at the given index as a `tea_Number`.

#### Errors
Raises an internal API error if the value at `index` is not a number.

#### Example
```c
tea_push_number(T, 3.14159);
tea_Number pi = tea_get_number(T, -1);
printf("value %lf\n", pi);
```

#### See Also
tea_get_integer, tea_to_number, tea_check_number

---

## tea_get_integer()

```c
tea_Integer tea_get_integer(tea_State* T, int index);
```

Retrieves the numeric value at `index` converted to a `tea_Integer`. The value must be a number; the conversion truncates any fractional part.

#### Arguments
- `T`: Teascript state
- `index`: Stack index of the value to retrieve

#### Returns
The number at the given index truncated to a `tea_Integer`.

#### Errors
Raises an internal API error if the value at `index` is not a number.

#### Example
```c
tea_push_number(T, 42.9);
tea_Integer n = tea_get_integer(T, -1);  /* n = 42 */
printf("int value %ld\n", (int32_t)n);
```

#### See Also
tea_get_number, tea_to_integer, tea_check_integer

---

## tea_get_pointer()

```c
const void* tea_get_pointer(tea_State* T, int index);
```

Retrieves the pointer value at `index`. The value must be a pointer.

#### Arguments
- `T`: Teascript state
- `index`: Stack index of the value to retrieve

#### Returns
The pointer stored at the given index.

#### Errors
Raises an internal API error if the value at `index` is not a pointer.

#### Example
```c
void* handle = get_some_handle();
tea_push_pointer(T, handle);
const void* ptr = tea_get_pointer(T, -1);
printf("my pointer is %p\n", ptr);
```

#### See Also
tea_to_pointer, tea_check_pointer, tea_push_pointer

---

## tea_get_range()

```c
void tea_get_range(tea_State* T, int index, tea_Number* start, tea_Number* end, tea_Number* step);
```

Retrieves the components of the range value at `index`. The value must be a range.

Any of the output pointers may be `NULL`, in which case the corresponding component is not written.

#### Arguments
- `T`: Teascript state
- `index`: Stack index of the range to retrieve
- `start`: Output for the range start value, or `NULL`
- `end`: Output for the range end value, or `NULL`
- `step`: Output for the range step value, or `NULL`

#### Errors
Raises an internal API error if the value at `index` is not a range.

#### Example
```c
tea_push_range(T, 0, 10, 2);
tea_Number start, end, step;
tea_get_range(T, -1, &start, &end, &step);  /* 0, 10, 2 */
```

#### See Also
tea_check_range, tea_push_range, tea_is_range

---

## tea_get_lstring()

```c
const char* tea_get_lstring(tea_State* T, int index, size_t* len);
```

Retrieves the string value at `index` as a C string. The value must be a string. The returned pointer refers to the internal string data held by the Tea state and remains valid as long as the value remains on the stack.

If `len` is not `NULL`, the string length is written to `*len`. Teascript strings may contain embedded zero bytes, so always use the returned length to determine the string size.

NOTE: A non-NULL return value is guaranteed even for zero length strings.

#### Arguments
- `T`: Teascript state
- `index`: Stack index of the string to retrieve
- `len`: Output for the string length, or `NULL`

#### Returns
A pointer to the string data.

#### Errors
Raises an internal API error if the value at `index` is not a string.

#### Example
```c
tea_push_lstring(T, "hello\0world", 11);
size_t len;
const char* s = tea_get_lstring(T, -1, &len);  /* len = 11 */
printf("my string %s, %llu bytes\n", s, len);
```

#### See Also
tea_get_string, tea_to_lstring, tea_check_lstring

---

## tea_get_string()

```c
const char* tea_get_string(tea_State* T, int index);
```

Retrieves the string value at `index` as a C string. The value must be a string. This is equivalent to `tea_get_lstring(T, index, NULL)`.

Because Teascript strings can contain embedded zeros, use `tea_get_lstring` if you need the pre-determined length.

#### Arguments
- `T`: Teascript state
- `index`: Stack index of the string to retrieve

#### Returns
A pointer to the string data (may contain embedded zeros).

#### Errors
Raises an internal API error if the value at `index` is not a string.

#### Example
```c
tea_push_string(T, "tea");
const char* name = tea_get_string(T, -1);  /* "tea" */
```

#### See Also
tea_get_lstring, tea_to_string, tea_check_string

---

## tea_get_userdata()

```c
void* tea_get_userdata(tea_State* T, int index);
```

Retrieves the raw userdata block at `index`. The value must be a userdata. Unlike `tea_check_userdata`, this function does not verify a class name.

#### Arguments
- `T`: Teascript state
- `index`: Stack index of the userdata to retrieve

#### Returns
A pointer to the userdata memory block

#### Errors
Raises an internal API error if the value at `index` is not a userdata.

#### Example
```c
MyBuffer* buf = (MyBuffer*)tea_new_userdata(T, sizeof(MyBuffer));
/* ... */
MyBuffer* p = (MyBuffer*)tea_get_userdata(T, -1);
```

#### See Also
tea_to_userdata, tea_check_userdata, tea_test_udata, tea_new_userdata
