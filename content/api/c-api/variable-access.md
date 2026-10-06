---
title: Variable Access
weight: 1300
---

This section covers functions for reading and writing global variables and module variables from the C API. Globals are stored in the state's global table, while module variables live in the exports table of a named module. These functions are convenient shortcuts for accessing those tables without pushing keys manually.

---

## tea_get_global()

```c
bool tea_get_global(tea_State* T, const char* name);
```

{{< stack before="..." after="...,value" >}}

Pushes the global variable `name` onto the stack. Returns `true` if the variable exists and was pushed; returns `false` and pushes nothing if no such global exists.

#### Arguments
- `T`: Teascript state
- `name`: Name of the global variable to retrieve

#### Returns
`true` if the global exists and its value was pushed; `false` otherwise.

#### Example
```c
tea_push_integer(T, 42);
tea_set_global(T, "answer");        /* globals["answer"] = 42 */

bool ok = tea_get_global(T, "answer");  /* ok = true, stack: [42] */
ok = tea_get_global(T, "missing");      /* ok = false, nothing pushed */
```

#### See Also
tea_set_global, tea_get_var

---

## tea_set_global()

```c
void tea_set_global(tea_State* T, const char* name);
```

{{< stack before="...,value" after="..." >}}

Pops the value at the top of the stack and assigns it to the global variable `name`, creating or overwriting the global as needed.

#### Arguments
- `T`: Teascript state
- `name`: Name of the global variable to set

#### Example
```c
tea_push_string(T, "hello");
tea_set_global(T, "greeting");      /* globals["greeting"] = "hello" */

tea_push_integer(T, 7);
tea_set_global(T, "count");         /* globals["count"] = 7 */
```

#### See Also
tea_get_global, tea_set_var

---

## tea_get_var()

```c
bool tea_get_var(tea_State* T, const char* name, const char* var);
```

{{< stack before="..." after="...,value" >}}

Pushes the variable `var` from the exports table of the module named `name` onto the stack. Returns `true` if the module exists and the variable was found and pushed; returns `false` and pushes nothing otherwise.

#### Arguments
- `T`: Teascript state
- `name`: Name of the module that owns the variable
- `var`: Name of the exported variable to retrieve

#### Returns
`true` if the module and variable exists and the value was pushed; `false` otherwise.

#### Example
```c
/* Assume module "mathx" is loaded and has exported "pi" */
bool ok = tea_get_var(T, "mathx", "pi");    /* ok = true, stack: [3.14159...] */
ok = tea_get_var(T, "mathx", "tau");        /* ok = false, nothing pushed */
```

#### See Also
tea_set_var, tea_get_global

---

## tea_set_var()

```c
void tea_set_var(tea_State* T, const char* name, const char* var);
```

{{< stack before="...,value" after="..." >}}

Pops the value at the top of the stack and assigns it to the variable `var` in the exports table of the module named `name`, creating or overwriting the entry as needed.

#### Arguments
- `T`: Teascript state
- `name`: Name of the module that owns the variable
- `var`: Name of the exported variable to set

#### Example
```c
/* Assume module "config" exists */
tea_push_bool(T, true);
tea_set_var(T, "config", "debug");      /* config.debug = true */

tea_push_string(T, "1.0.0");
tea_set_var(T, "config", "version");    /* config.version = "1.0.0" */
```

#### See Also
tea_get_var, tea_set_global
