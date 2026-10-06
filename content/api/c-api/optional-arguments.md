---
title: Optional Arguments
weight: 1600
---

This section covers the functions used to read optional arguments from the stack. Each function behaves like their `tea_check_*` counterpart when a value is present, but return a caller-supplied default value when the argument is absent or `nil`. This makes them ideal for C functions that accept optional parameters, allowing Teascript callers to omit arguments they don't need without raising any errors.

The concept of "absent" here includes both a stack slot that resolves to "no value" (out-of-range index) and an explicit `nil`. Use `tea_is_nonenil` internally to decide which branch applies.

---

## tea_opt_nil()

```c
void tea_opt_nil(tea_State* T, int index);
```

If the value at `index` is absent, pushes `nil` onto the stack. Otherwise, the function is a no-op.

This is useful for normalizing an optional argument slot so that later stack operations can rely on a concrete value being present.

#### Arguments
- `T`: The Teascript state
- `index`: Stack index to normalize

#### Example
```c
tea_opt_nil(T, 2);  /* ensures slot 2 holds at least nil */
```

#### See Also
tea_check_any, tea_push_nil

---

## tea_opt_bool()

```c
bool tea_opt_bool(tea_State* T, int index, bool def);
```

Returns the boolean at `index`, or `def` if the argument is absent.

#### Arguments
- `T`: Teascript state
- `index`: Stack index of the argument
- `def`: Default value returned when the argument is absent

#### Returns
The boolean value at `index`, or `def`.

#### Example
```c
static int cmd_greet(tea_State* T)
{
    const char* name = tea_check_string(T, 1);
    bool loud = tea_opt_bool(T, 2, false);
    if(loud)
        tea_push_fstring(T, "HELLO, %s!", name);
    else
        tea_push_fstring(T, "Hello, %s.", name);
    return 1;
}
```

#### See Also
tea_check_bool

---

## tea_opt_number()

```c
tea_Number tea_opt_number(tea_State* T, int index, tea_Number def);
```

Returns the number at `index` as a `tea_Number`, or `def` if the argument is absent.

#### Arguments
- `T`: Teascript state
- `index`: Stack index of the argument
- `def`: Default value returned when the argument is absent

#### Returns
The numeric value at `index`, or `def`.

#### Example
```c
static int cmd_step(tea_State* T)
{
    tea_Number dx = tea_opt_number(T, 1, 1.0);
    tea_Number dy = tea_opt_number(T, 2, 1.0);
    tea_push_number(T, dx * dy);
    return 1;
}
```

#### See Also
tea_check_number, tea_opt_integer

---

## tea_opt_integer()

```c
tea_Integer tea_opt_integer(tea_State* T, int index, tea_Integer def);
```

Returns the number at `index` truncated to a `tea_Integer`, or `def` if the argument is absent.

#### Arguments
- `T`: Teascript state
- `index`: Stack index of the argument
- `def`: Default value returned when the argument is absent

#### Returns
The integer value at `index`, or `def`.

#### Example
```c
static int cmd_repeat(tea_State* T)
{
    const char* s = tea_check_string(T, 1);
    tea_Integer n = tea_opt_integer(T, 2, 1);
    for(tea_Integer i = 0; i < n; i++)
        tea_push_string(T, s);
    return (int)n;
}
```

#### See Also
tea_check_integer, tea_opt_number

---

## tea_opt_pointer()

```c
const void* tea_opt_pointer(tea_State* T, int index, void* def);
```

Returns the pointer at `index`, or `def` if the argument is absent.

#### Arguments
- `T`: Teascript state
- `index`: Stack index of the argument
- `def`: Default value returned when the argument is absent

#### Returns
The pointer value at `index`, or `def`.

#### Example
```c
static int cmd_open(tea_State* T)
{
    const char* path = tea_check_string(T, 1);
    const void* ctx = tea_opt_pointer(T, 2, NULL);
    /* ... open path using ctx if provided ... */
    return 0;
}
```

#### See Also
tea_check_pointer

---

## tea_opt_lstring()

```c
const char* tea_opt_lstring(tea_State* T, int index, const char* def, size_t* len);
```

Returns the string at `index` along with its length in `*len`, or `def` (and its `strlen`, or 0 if `def` is `NULL`) if the argument is absent.

Use this when the string may contain embedded NUL bytes.

#### Arguments
- `T`: Teascript state
- `index`: Stack index of the argument
- `def`: Default string returned when the argument is absent, or `NULL`
- `len`: Output for the string length, or `NULL`

#### Returns
The string pointer at `index`, or `def`.

#### Example
```c
size_t len;
const char* sep = tea_opt_lstring(T, 2, ", ", &len);
/* sep is ", " with len 2 if argument 2 is absent */
```

#### See Also
tea_check_lstring, tea_opt_string

---

## tea_opt_string()

```c
const char* tea_opt_string(tea_State* T, int index, const char* def);
```

Returns the string at `index`, or `def` if the argument is absent.

Use `tea_opt_lstring` if the string may contain contain NUL characters.

#### Arguments
- `T`: Teascript state
- `index`: Stack index of the argument
- `def`: Default string returned when the argument is absent, or `NULL`

#### Example
```c
static int cmd_log(tea_State* T)
{
    const char* msg = tea_check_string(T, 1);
    const char* prefix = tea_opt_string(T, 2, "[info]");
    tea_push_fstring(T, "%s %s", prefix, msg);
    return 1;
}
```

#### See Also
tea_check_string, tea_opt_lstring

---

## tea_opt_userdata()

```c
void* tea_opt_userdata(tea_State* T, int index, void* def);
```

Returns a pointer to the raw data of the userdata at `index`, or `def` if the argument is absent or `nil`.

This does not check a specific class name; use `tea_test_udata`/`tea_check_udata` when a specific class is required.

#### Arguments
- `T`: Teascript state
- `index`: Stack index of the argument
- `def`: Default pointer returned when the argument is absent

#### Returns
Pointer to the raw userdata block, or `def`.

#### Example
```c
static int cmd_attach(tea_State* T)
{
    void* widget = tea_check_userdata(T, 1);
    void* parent = tea_opt_userdata(T, 2, NULL);
    attach_widget(widget, parent);  /* parent may be NULL */
    return 0;
}
```

#### See Also
tea_check_userdata, tea_opt_pointer

---

## tea_opt_cfunction()

```c
tea_CFunction tea_opt_cfunction(tea_State* T, int index, tea_CFunction def);
```

Returns the C function pointer stored in the value at `index`, or `def` if the argument is absent.

#### Arguments
- `T`: Teascript state
- `index`: Stack index of the argument
- `def`: Default function pointer returned when the argument is absent

#### Returns
The `tea_CFunction` at `index`, or `def`.

#### Example
```c
static int cmd_walk(tea_State* T)
{
    tea_CFunction visit = tea_opt_cfunction(T, 1, NULL);
    /* call visit on each element if non-NULL */
    return 0;
}
```

#### See Also
tea_check_cfunction
