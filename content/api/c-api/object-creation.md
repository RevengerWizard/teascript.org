---
title: Object Creation
weight: 800
---

This section covers functions for creating Teascript objects from C: userdata (both anonymous and named), lists, maps, classes, and modules. All of these functions push the newly created object onto the stack.

---

## tea_new_userdatav()

```c
void* tea_new_userdatav(tea_State* T, size_t size, int nuvs);
```

{{< stack before="..." after="...,userdata" >}}

Creates a new userdata object with `size` bytes of payload and `nuvs` user values (initially `nil`), and pushes it onto the stack. Unlike `tea_new_udatav`, the userdata is not associated with a registered class name.

#### Arguments
- `T`: Teascript state
- `size`: Size of the raw payload in bytes
- `nuvs`: Number of user values to allocate for the userdata

#### Returns
A pointer to the raw userdata payload block. This pointer remains valid until the userdata is garbage collected.

#### Example
```c
/* Create a userdata holding a single int, with one user value */
int* p = (int*)tea_new_userdatav(T, sizeof(int), 1);
*p = 42;
```

#### See Also
tea_new_userdata, tea_new_udatav, tea_set_finalizer

---

## tea_new_udatav()

```c
void* tea_new_udatav(tea_State* T, size_t size, int nuvs, const char* name);
```

{{< stack before="..." after="...,userdata" >}}

Creates a new userdata object with `size` bytes of payload and `nuvs` user values, and pushes it onto the stack. The userdata is associated with the class registered under `name` (typically via `tea_create_class` or `tea_new_class`), which enables type-checking via `tea_check_udata()` and `tea_test_udata()`.

#### Arguments
- `T`: Teascript state
- `size`: Size of the raw payload in bytes
- `nuvs`: Number of user values to allocate for the userdata
- `name`: Name of the registered class to associated with the userdata

#### Returns
A pointer to the raw userdata payload block.

#### Example
```c
/* Create a named userdata of type "RingBuffer" with 2 user values */
RingBuffer* rb = (RingBuffer*)tea_new_udatav(T, sizeof(RingBuffer), 2, "RingBuffer");
rb->capacity = 16;
```

#### See Also
tea_new_userdatav, tea_new_udata, tea_check_udata, tea_create_class

---

## tea_new_userdata()

```c
void* tea_new_userdata(tea_State* T, size_t size);
```

{{< stack before="..." after="...,userdata" >}}

Creates a new anonymous userdata object with `size` bytes of payload (and no user values), and pushes it onto the stack. Equivalent to `tea_new_userdatav(T, size, 0)`.

#### Arguments
- `T`: Teascript state
- `size`: Size of the raw payload in bytes

#### Returns
A pointer to the raw userdata payload block.

#### Example
```c
/* Allocate a zeroed buffer of 256 bytes as userdata */
void* buf = tea_new_userdata(T, 256);
memset(buf, 0, 256);
```

#### See Also
tea_new_userdatav, tea_new_udata

---

## tea_new_udata()

```c
void* tea_new_udata(tea_State* T, size_t size, const char* name);
```

{{< stack before="..." after="...,userdata" >}}

Creates a new named userdata object with `size` bytes of payload (and no user values), and pushes it onto the stack. The userdata is associated with the class registered under `name`. Equivalent to `tea_new_udatav(T, size, 0, name)`.

#### Arguments
- `T`: Teascript state
- `size`: Size of the raw payload in bytes
- `name`: Name of the registered class to associate with the userdata

#### Returns
A pointer to the raw userdata payload block.

#### Example
```c
/* Create a named "File" userdata */
FILE** f = (FILE**)tea_new_udata(T, sizeof(FILE*), "File");
*f = fopen("data.txt", "r");
```

#### See Also
tea_new_udatav, tea_new_userdata, tea_check_udata

---

## tea_new_list()

```c
void tea_new_list(tea_State* T, size_t n);
```

{{< stack before="..." after="...,list" >}}

Creates a new empty list with a prepared capacity of `n` elements, and pushes it onto the stack. The capacity is a hint to avoid re-allocations during subsequent `tea_add_item()` calls.

#### Arguments
- `T`: Teascript state
- `n`: Initial capacity hint for the list

#### Example
```c
tea_new_list(T, 4);         /* [] with capacity 4 */

for(int i = 0; i < 3; i++)
{
    tea_push_integer(T, i * 10);
    tea_add_item(T, -2);
}
/* list is now [0, 10, 20] */
```

#### See Also
tea_new_map, tea_add_item, tea_insert_item

---

## tea_new_map()

```c
void tea_new_map(tea_State* T);
```

{{< stack before="..." after="...,map" >}}

Creates a new empty map and pushes it onto the stack.

#### Arguments
- `T`: Teascript state

#### Example
```c
tea_new_map(T);                 /* {} */
tea_push_string(T, "hello");
tea_set_key(T, -2, "greeting"); /* {greeting = "hello"} */
```

#### See Also
tea_new_list, tea_set_key, tea_set_field

---

## tea_new_class()

```c
void tea_new_class(tea_State* T, const char* name);
```

{{< stack before="..." after="...,class" >}}

Creates a new empty class named `name` and pushes it onto the stack. Methods can then be added with `tea_set_methods()` or directly via `tea_set_attr()`.

#### Arguments
- `T`: Teascript state
- `name`: Name of the class

#### Example
```c
tea_new_class(T, "Point");

/* Add a "new" method */
tea_push_cfunction(T, point_new, 2, 0);
tea_set_attr(T, -2, "new");
```

#### See Also
tea_create_class, tea_new_udatav, tea_set_methods

---

## tea_new_module()

```c
void tea_new_module(tea_State* T, const char* name);
```

{{< stack before="..." after="...,module" >}}

Creates a new module named `name` and pushes it onto the stack. The module's path is set to its name. Members can be added with `tea_set_attr()`.

#### Arguments
- `T`: Teascript state
- `name`: Name of the module

#### Example
```c
tea_new_module(T, "mathx");

tea_push_cfunction(T, mathx_sqrt, 1, 0);
tea_set_attr(T, -2, "sqrt");
```

#### See Also
tea_create_module, tea_new_submodule

---

## tea_new_submodule()

```c
void tea_new_submodule(tea_State* T, const char* name);
```

{{< stack before="..." after="...,module" >}}

Creates a new submodule named `name` and pushes it onto the stack. A submodule is a module intended to be nested inside another module.

#### Arguments
- `T`: Teascript state
- `name`: Name of the submodule

#### Example
```c
tea_new_submodule(T, "path");

tea_push_cfunction(T, path_join, TEA_VARG, 0);
tea_set_attr(T, -2, "join");
```

#### See Also
tea_new_module, tea_create_submodule

---

## tea_create_class()

```c
void tea_create_class(tea_State* T, const char* name, const tea_Methods* klass);
```

{{< stack before="..." after="...,class" >}}

Creates a new class named `name`, registers all methods described by the `tea_Methods` array `klass`, and pushes the class onto the stack. Each entry in `klass` specifies a method name, a type (`"method"`, `"static"`, `"getter"`, or `"setter"`), the C function, and the expected arguments counts.

#### Arguments
- `T`: Teascript state
- `name`: Name of the class
- `klass`: NULL-terminated array of `tea_Methods` descriptors. May be `NULL` to create an empty class

#### Example
```c
static const tea_Methods point_methods[] =
{
    {"new",    "method", point_new,    2, 0},
    {"length", "method", point_length, 0, 0},
    {"x",      "getter", point_getx,   0, 0},
    {NULL, NULL, NULL, 0, 0}
};

tea_create_class(T, "Point", point_methods);
tea_set_global(T, "Point");
```

#### See Also
tea_new_class, tea_set_methods, tea_new_udatav

---

## tea_create_module()

```c
void tea_create_module(tea_State* T, const char* name, const tea_Reg* module);
```

{{< stack before="..." after="...,module" >}}

Creates a new module named `name`, populates it with the functions described by the `tea_Reg` array `module`, and pushes the module onto the stack. Each entry in `module` specifies a name, a C function, and argument counts. An entry with a `NULL` function pushes `nil` under that name (useful for placeholder values).

#### Arguments
- `T`: Teascript state
- `name`: Name of the module
- `module`: NULL-terminated array of `tea_Reg` descriptors. May be `NULL` to create an empty module

#### Example
```c
static const tea_Reg mathx_lib[] =
{
    {"sqrt", mathx_sqrt, 1, 0},
    {"pi",   NULL,       0, 0},
    {NULL, NULL, 0, 0}
};

tea_create_module(T, "mathx", mathx_lib);
tea_push_number(T, 3.14159);
tea_set_attr(T, -2, "pi");
tea_set_global(T, "mathx");
```

#### See Also
tea_new_module, tea_create_submodule, tea_set_funcs

---

## tea_create_submodule()

```c
void tea_create_submodule(tea_State* T, const char* name, const tea_Reg* module);
```

{{< stack before="..." after="...,module" >}}

Creates a new submodule named `name`, populates it with the functions described by the `tea_Reg` array `module`, and pushes it onto the stack. Behaves like `tea_create_module()` but creates a submodule suitable for nesting inside another module.

#### Arguments
- `T`: Teascript state
- `name`: Name of the submodule
- `module`: NULL-terminated array of `tea_Reg` descriptors. May be `NULL` to create an empty submodule

#### Example
```c
static const tea_Reg path_lib[] =
{
    {"join",  path_join,  TEA_VARG, 0},
    {"split", path_split, 1,        0},
    {NULL, NULL, 0, 0}
};

tea_create_submodule(T, "path", path_lib);

/* Nest it inside an existing "os" module */
tea_get_global(T, "os");
tea_insert(T, -2);
tea_set_attr(T, -2, "path");
tea_pop(T, 1);
```

#### See Also
tea_new_submodule, tea_create_module
