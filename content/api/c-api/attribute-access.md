---
title: Attribute Access
weight: 1200
---

This section covers functions for accessing and modifying object attributes using the C API and following Teascript's special method rules. Unlike raw map operations, these functions respect the special methods `getattr` and `setattr`, as well as operator overload methods `[]` and `[]=` defined on classes to be used for instances and userdata. They provide the same semantics as the `obj.key` and `obj[key]` syntax in Tea code.

---

## tea_has_attr()

```c
bool tea_has_attr(tea_State* T, int obj, const char* key);
```

Checks whether the object at `obj` has an attribute named `key`.

#### Arguments
- `T`: Teascript state
- `obj`: Stack index of the object to query
- `key`: Name of the attribute to loop up

#### Returns
`true` if the attribute exists; `false` otherwise.

#### Example
```c
tea_new_map(T);
tea_push_integer(T, 42);
tea_set_attr(T, -2, "answer");

bool has = tea_has_attr(T, -1, "answer");  /* has = true */
has = tea_has_attr(T, -1, "missing");      /* has = false */
```

#### See Also
tea_get_attr, tea_set_attr, tea_delete_attr

---

## tea_get_attr()

```c
void tea_get_attr(tea_State* T, int obj, const char* key);
```

{{< stack before="...,obj,..." after="...,obj,...,value" >}}

Pushes the value of the attribute named `key` of the object at `obj` onto the stack. This respect the object's special methods, so it may invoke getter methods.

#### Arguments
- `T`: Teascript state
- `obj`: Stack index of the object
- `key`: Name of the attribute to retrieve

#### Example
```c
tea_new_module(T, "mymod");
tea_push_integer(T, 7);
tea_set_attr(T, -2, "version");

tea_get_attr(T, -1, "version");   /* pushes 7 */
```

#### See Also
tea_set_attr, tea_has_attr, tea_get_key

---

## tea_set_attr()

```c
void tea_set_attr(tea_State* T, int obj, const char* key);
```

{{< stack before="...,obj,...,value" after="...,obj,..." >}}

Pops the value from the top of the stack and assigns it to the attribute named `key` of the object at `obj`. This respects the object's special methods, so it may invoke setter methods or fail silently if the attribute is read-only.

#### Arguments
- `T`: Teascript state
- `obj`: Stack index of the object
- `key`: Name of the attribute to set

#### Example
```c
tea_new_module(T, "mymod");       /* [module] */
tea_push_integer(T, 1);
tea_set_attr(T, -2, "version");   /* module.version = 1 */
tea_push_string(T, "beta");
tea_set_attr(T, -2, "channel");   /* module.channel = "beta" */
```

#### See Also
tea_get_attr, tea_delete_attr, tea_set_key

---

## tea_delete_attr()

```c
void tea_delete_attr(tea_State* T, int obj, const char* key);
```

{{< stack before="...,obj,..." after="...,obj,..." >}}

Deletes the attribute named `key` from the object at `obj`.

#### Arguments
- `T`: Teascript state
- `obj`: Stack index of the object
- `key`: Name of the attribute to delete

#### Example
```c
tea_new_module(T, "mymod");
tea_push_integer(T, 1);
tea_set_attr(T, -2, "version");

tea_delete_attr(T, -1, "version");   /* module.version removed */
```

#### See Also
tea_set_attr, tea_has_attr, tea_delete_key

---

## tea_get_index()

```c
void tea_get_index(tea_State* T, int obj);
```

{{< stack before="...,obj,...,key" after="...,obj,...,obj(key)" >}}

Pops the key from the top of the stack and pushes the value obtained by indexing the object at `obj` with that key, using the `[]` operator method if defined (i.e. equivalent to `obj[key]` in Teascript).

#### Arguments
- `T`: Teascript state
- `obj`: Stack index of the object to index

#### Example
```c
tea_new_map(T);
tea_push_string(T, "name");
tea_push_string(T, "Tea");
tea_set_key(T, -3, "name");       /* map["name"] = "Tea" */

tea_push_string(T, "name");
tea_get_index(T, -2);             /* pushes "Tea" */
```

#### See Also
tea_set_index, tea_get_key, tea_get_field

---

## tea_set_index()

```c
void tea_set_index(tea_State* T, int obj);
```

{{< stack before="...,obj,...,key,value" after="...,obj,..." >}}

Pops the key and value from the top of the stack and performs `obj[key] = value`, using the `[]=` operator method if defined.

#### Arguments
- `T`: Teascript state
- `obj`: Stack index of the object to index

#### Example
```c
tea_new_map(T);                   /* [map] */
tea_push_string(T, "lang");
tea_push_string(T, "Tea");
tea_set_index(T, -3);             /* map["lang"] = "Tea" */
tea_pop(T, 1);                    /* [map] */
```

#### See Also
tea_get_index, tea_set_key, tea_set_field
