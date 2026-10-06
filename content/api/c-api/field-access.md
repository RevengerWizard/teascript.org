---
title: Field Access
weight: 1100
---

This section covers functions for reading, writing, and deleting entries in Teascript map objects using the C API. These allow direct field manipulation by integer key or string key, as well as dynamic key access where the key is taken from the stack. All functions expect a map at the given stack index and raise an error otherwise.

---

## tea_get_fieldi()

```c
bool tea_get_fieldi(tea_State* T, int obj, tea_Integer i);
```

{{< stack before="...,map,..." after="...,map,...,map(i)" >}}

Pushes the value associated with the integer key `i` from the map at `obj`. Returns `true` on success, or `false` if the key is not present, in which case nothing is pushed.

#### Arguments
- `T`: Teascript state
- `obj`: Stack index of the map
- `i`: Integer key to loop up

#### Returns
`true` if the field exists and was pushed; `false` otherwise.

#### Example
```c
tea_new_map(T);             /* [map] */
tea_push_integer(T, 42);
tea_set_fieldi(T, -2, 0);   /* map[0] = 42 */

bool ok = tea_get_fieldi(T, -1, 0);   /* ok = true, pushes 42 */
ok = tea_get_fieldi(T, -2, 7);        /* ok = false, nothing pushed */
```

#### See Also
tea_set_fieldi, tea_get_key

---

## tea_set_fieldi()

```c
void tea_set_fieldi(tea_State* T, int obj, tea_Integer i);
```

{{< stack before="...,map,...val" after="...,map,..." >}}

Sets the value at the top of the stack as the entry for integer key `i` in the map at `obj`, then pops that value.

#### Arguments
- `T`: Teascript state
- `obj`: Stack index of the map
- `i`: Integer key to assign

#### Example
```c
tea_new_map(T);             /* [map] */
tea_push_string(T, "zero");
tea_set_fieldi(T, -2, 0);   /* map[0] = "zero" */
tea_push_integer(T, 100);
tea_set_fieldi(T, -2, 1);   /* map[1] = 100 */
```

#### See Also
tea_get_fieldi, tea_set_key

---

## tea_get_field()

```c
bool tea_get_field(tea_State* T, int obj);
```

{{< stack before="...,map,...,key" after="...,map,...map(key)" >}}

Pops the key at the top of the stack and pushes the associated value from the map at `obj` in its place. Returns `true` on success, or `false` if the key is not present, in which case the key is still consumed.

#### Arguments
- `T`: Teascript state
- `obj`: Stack index of the map

#### Returns
`true` if the field exists and its value was pushed; `false` otherwise.

#### Example
```c
tea_new_map(T);             /* [map] */
tea_push_string(T, "name");
tea_push_string(T, "Tea");
tea_set_field(T, -3);       /* map["name"] = "Tea" */

tea_push_string(T, "name");
bool ok = tea_get_field(T, -2);   /* ok = true, pushes "Tea" */
```

#### See Also
tea_set_field, tea_get_key

---

## tea_set_field()

```c
void tea_set_field(tea_State* T, int obj);
```

{{< stack before="...,map,...,key,value" after="...,map,..." >}}

Pops a key and a value from the stack and assigns the value to that key in the map at `obj`. The value is at the top of the stack, with the key directly below it; both are popped.

#### Arguments
- `T`: Teascript state
- `obj`: Stack index of the map

#### Example
```c
tea_new_map(T);             /* [map] */
tea_push_string(T, "count");
tea_push_integer(T, 7);
tea_set_field(T, -3);       /* map["count"] = 7 */
```

#### See Also
tea_get_field, tea_set_key

---

## tea_delete_field()

```c
bool tea_delete_field(tea_State* T, int obj);
```

{{< stack before="...,map,...,value" after="...,map,..." >}}

Pops the key at the top of the stack and removes the associated entry from the map at `obj`. Returns `true` if the key existed and was removed, `false` otherwise.

#### Arguments
- `T`: Teascript state
- `obj`: Stack index of the map

#### Returns
`true` if an entry was removed; `false` otherwise.

#### Example
```c
tea_new_map(T);
tea_push_string(T, "temp");
tea_push_integer(T, 1);
tea_set_field(T, -3);       /* map["temp"] = 1 */

tea_push_string(T, "temp");
bool removed = tea_delete_field(T, -2);   /* removed = true, map now empty */
```

#### See Also
tea_set_field, tea_delete_key

---

## tea_get_key()

```c
bool tea_get_key(tea_State* T, int obj, const char* key);
```

{{< stack before="...,map,..." after="...,map,...,map(key)" >}}

Pushes the value associated with the string `key` from the map at `obj`. Returns `true` on success, or `false` if the key is not present, in which case nothing is pushed.

#### Arguments
- `T`: Teascript state
- `obj`: Stack index of the map
- `key`: NUL-terminated string key to look up

#### Returns
`true` if the field exists and was pushed; `false` otherwise.

#### Example
```c
tea_new_map(T);
tea_push_string(T, "version");
tea_push_string(T, "1.0");
tea_set_key(T, -3, "version");   /* map["version"] = "1.0" */

bool ok = tea_get_key(T, -1, "version");   /* ok = true, pushes "1.0" */
ok = tea_get_key(T, -2, "missing");        /* ok = false */
```

#### See Also
tea_set_key, tea_get_fieldi

---

## tea_set_key()

```c
void tea_set_key(tea_State* T, int obj, const char* key);
```

{{< stack before="...,map,...,value" after="...,map,..." >}}

Sets the value at the top of the stack as the entry for string `key` in the map at `obj`, then pops that value.

#### Arguments
- `T`: Teascript state
- `obj`: Stack index of the map
- `key`: NUL-terminated string key to assign

#### Example
```c
tea_new_map(T);
tea_push_integer(T, 3);
tea_set_key(T, -2, "x");    /* map["x"] = 3 */
tea_push_integer(T, 4);
tea_set_key(T, -2, "y");    /* map["y"] = 4 */
```

#### See Also
tea_get_key, tea_set_fieldi

---

## tea_delete_key()

```c
bool tea_delete_key(tea_State* T, int obj, const char* key);
```

{{< stack before="...,map,..." after="...,map,..." >}}

Removes the entry for string `key` from the map at `obj`. Returns `true` if the key existed and was removed, `false` otherwise.

#### Arguments
- `T`: Teascript state
- `obj`: Stack index of the map
- `key`: NUL-terminated string key to delete

#### Returns
`true` if an entry was removed; `false` otherwise.

#### Example
```c
tea_new_map(T);
tea_push_integer(T, 5);
tea_set_key(T, -2, "score");   /* map["score"] = 5 */

bool removed = tea_delete_key(T, -1, "score");   /* removed = true */
removed = tea_delete_key(T, -1, "score");        /* removed = false */
```

#### See Also
tea_set_key, tea_delete_field
