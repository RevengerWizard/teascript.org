---
title: Function and Method Registration
weight: 1400
---

This section covers the functions used to register C functions and methods into Teascript modules and classes. These helpers iterate over arrays of `tea_Reg` or `tea_Methods` descriptors, pushing a C closure (or method) for each entry and binding it to the object on the stack, optionally capturing upvalues shared across all registered functions.

---

## tea_set_funcs()

```c
void tea_set_funcs(tea_State* T, const tea_Reg* reg, int nup);
```

{{< stack before="...,obj" after="...,obj" >}}

Registers a list of C functions into the module (or other object) at the top of the stack. For each entry in the `tea_Reg` array, a C closure is created with `nup` upvalues (copied from the `nup` values currently on top of the stack), pushed, and then set as an attribute named `reg->name` on the object. After all entries are processed, the `nup` upvalues are all popped.

The `reg` array must be terminated by an entry with a `NULL` name.

#### Arguments
- `T`: Teascript state
- `reg`: Array of `tea_Reg` descriptors, terminated by a `NULL` name entry.
- `nup`: Number of upvalues to capture for each registered function (must match the values on top of the stack)

#### Example
```c
static const tea_Reg mathlib[] = {
    {"add", math_add, 2, 0},
    {"sub", math_sub, 2, 0},
    {NULL, NULL, 0, 0}
};

/* Stack: [module] */
tea_set_funcs(T, mathlib, 0);

/* Register with one shared upvalue */
tea_push_integer(T, 42);
tea_set_funcs(T, mathlib, 1);   /* upvalue 42 captured, then popped */
```

#### See Also
tea_set_methods, tea_create_module, tea_push_cclosure

---

## tea_set_methods()

```c
void tea_set_methods(tea_State* T, const tea_Methods* reg, int nup);
```

{{< stack before="...,obj" after="...,obj" >}}

Registers a list of C methods into the class at the top of the stack. Each entry in `tea_Methods` array specifies a `type` string that determines how the method is bound:
- `"method"`: An instance method
- `"static"`: A static function
- `"getter"`: An attribute getter
- `"setter"`: An attribute setter

For each entry, a C closure is created with `nup` upvalues (copied from the `nup` values on top of the stack), pushed, and bound under the entry's `name`. After all entries are processed, the `nup` upvalues are all popped.

The `reg` array must be terminated by an entry with a `NULL` name.

#### Arguments
- `T`: Teascript state
- `reg`: Array of `tea_Methods` descriptors, terminated by a `NULL` name entry
- `nup`: Number of upvalues to capture for each registered method

#### Errors
Raises an error if an entry has unrecognized `type` string.

#### Example
```c
static const tea_Methods point_methods[] = {
    {"new",   point_new,   "method", 2, 0},
    {"x",     point_getx,  "getter", 0, 0},
    {"x",     point_setx,  "setter", 1, 0},
    {"zero",  point_zero,  "static", 0, 0},
    {NULL, NULL, NULL, 0, 0}
};

/* Stack: [class Point] */
tea_set_methods(T, point_methods, 0);

/* With one upvalue captured by every method */
tea_push_integer(T, 100);
tea_set_methods(T, point_methods, 1);   /* upvalue 100 captured, then popped */
```

#### See Also
tea_set_funcs, tea_create_class, tea_push_cclosure
