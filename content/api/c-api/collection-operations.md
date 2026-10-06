---
title: Collection Operations
weight: 1000
---

This section covers the functions used to manipulate collection objects from the C API. This mainly includes lists. Lists are ordered, indexable collections (similar to arrays) and are one of Teascript's fundamental container types. These functions let you query length, add, get, set, insert, and delete items, as well as iteration.

---

## tea_len()

```c
int tea_len(tea_State* T, int index);
```

Returns the length of the object at `index`. For strings, this is the number of bytes; for lists, the number of items; for maps, the number of key-value pairs; for userdata, the raw data size in bytes. Gives `-1` if the value at `index` is not one of these types.

#### Arguments
- `T`: Teascript state
- `index`: Stack index of the object whose length is queried

#### Returns
The length of the object, or `-1` if the type has no length.

#### Example
```c
tea_new_list(T, 0);
tea_push_integer(T, 10);
tea_add_item(T, -2);
tea_push_integer(T, 20);
tea_add_item(T, -2);        /* [list(10, 20)] */

int n = tea_len(T, -1);     /* n = 2 */
```

#### See Also
tea_get_item, tea_add_item

---

## tea_add_item()

```c
void tea_add_item(tea_State* T, int list);
```

{{< stack before="...,list,...,val" after="...,list,..." >}}

Appends the value at the top of the stack at the end of the list at index `list`, then pops that value.

#### Arguments
- `T`: Teascript state
- `list`: Stack index of the target list

#### Example
```c
tea_new_list(T, 0);         /* [] */
tea_push_string(T, "a");
tea_add_item(T, -2);        /* ["a"] */
tea_push_string(T, "b");
tea_add_item(T, -2);        /* ["a", "b"] */
```

#### See Also
tea_insert_item, tea_set_item

---

## tea_get_item()

```c
bool tea_get_item(tea_State* T, int list, int index);
```

{{< stack before="...,list,..." after="...,list,...,list(index)" >}}

Pushes the item at position `index` (0-based) of the list at `list` onto the stack. Returns `true` on success; if `index` is out of range, returns `false` and nothing is pushed onto the stack.

#### Arguments
- `T`: Teascript state
- `list`: Stack index of the list
- `index`: Zero-based position of the item to retrieve

#### Returns
`true` if the item was found and pushed; `false` otherwise.

#### Example
```c
tea_new_list(T, 0);
tea_push_string(T, "x");
tea_add_item(T, -2);
tea_push_string(T, "y");
tea_add_item(T, -2);        /* ["x", "y"] */

bool ok = tea_get_item(T, -1, 1);   /* ok = true, pushes "y" */
ok = tea_get_item(T, -2, 5);        /* ok = false, nothing pushed */
```

#### See Also
tea_set_item, tea_len

---

## tea_set_item()

```c
bool tea_set_item(tea_State* T, int list, int index);
```

{{< stack before="...,list,...,val" after="...,list,..." >}}

Sets the item at position `index` (0-based) of the list at `list` to the value at the top of the stack, then pops that value. Returns `true` on success; if `index` is out of range, returns `false` and leaves the stack unchanged.

#### Arguments
- `T`: Teascript state
- `list`: Stack index of the list
- `index`: Zero-based position in the list to assign

#### Returns
`true` if the item was set; `false` otherwise.

#### Example
```c
tea_new_list(T, 0);
tea_push_string(T, "a");
tea_add_item(T, -2);
tea_push_string(T, "b");
tea_add_item(T, -2);        /* ["a", "b"] */

tea_push_string(T, "B");
bool ok = tea_set_item(T, -2, 1);   /* ok = true, list is ["a", "B"] */
```

#### See Also
tea_get_item, tea_insert_item

---

## tea_delete_item()

```c
bool tea_delete_item(tea_State* T, int list, int index);
```

{{< stack before="...,list,..." after="...,list,..." >}}

Removes the item at position `index` (0-based) from the list at `list`. Returns `true` on success; if `index` is out of range, returns `false`.

#### Arguments
- `T`: Teascript state
- `list`: Stack index of the list
- `index`: Zero-based position of the item to delete

#### Returns
`true` if the item was deleted; `false` otherwise.

#### Example
```c
tea_new_list(T, 0);
tea_push_string(T, "a");
tea_add_item(T, -2);
tea_push_string(T, "b");
tea_add_item(T, -2);
tea_push_string(T, "c");
tea_add_item(T, -2);        /* ["a", "b", "c"] */

bool ok = tea_delete_item(T, -1, 1);   /* ok = true, list is ["a", "c"] */
```

#### See Also
tea_insert_item, tea_remove

---

## tea_insert_item()

```c
bool tea_insert_item(tea_State* T, int list, int index);
```

{{< stack before="...,list,...,val" after="...,list,..." >}}

Inserts the value at the top of the stack at position `index` (0-based) of the list at `list`, shifting items at and after `index` up by one, then pops the value. Returns `true` on success; if `index` is out of range, returns `false`.

#### Arguments
- `T`: Teascript state
- `list`: Stack index of the list
- `index`: Zero-based position where the item will be inserted

#### Returns
`true` if the item was inserted; `false` otherwise.

#### Example
```c
tea_new_list(T, 0);
tea_push_string(T, "a");
tea_add_item(T, -2);
tea_push_string(T, "c");
tea_add_item(T, -2);        /* ["a", "c"] */

tea_push_string(T, "b");
bool ok = tea_insert_item(T, -2, 1);   /* ok = true, list is ["a", "b", "c"] */
```

#### See Also
tea_add_item, tea_delete_item

---

## tea_next()

```c
int tea_next(tea_State* T, int obj);
```

Advances to the next key-value pair in the map at `obj`. On entry, the key at the top of the stack specifies the current position; on exit, the stack contains the next key and value (with the value on top). Returns `1` if a pair was found and pushed, `0` if iteration is complete (in which case the key is popped), or throws an error if the key is invalid.

#### Arguments
- `T`: Teascript state
- `obj`: Stack index of the map to iterate

#### Returns
- `1` if another key-value pair is produced (key and value pushes)
- `0` if iteration finished (key popped)

#### Errors
Raises a runtime error if the value at `obj` is not a map, or if the current key is not valid for the map.

#### Example
```c
tea_new_map(T);             /* [map] */
tea_push_string(T, "a");
tea_push_integer(T, 1);
tea_set_key(T, -3, "a");    /* map["a"] = 1 */
tea_push_string(T, "b");
tea_push_integer(T, 2);
tea_set_key(T, -3, "b");    /* map["b"] = 2 */

tea_push_nil(T);            /* initial key for iteration */
while(tea_next(T, -3))      /* map, key, value on stack */
{
    const char* key = tea_get_string(T, -2);
    tea_Integer val = tea_get_integer(T, -1);
    /* process key and val */
    tea_pop(T, 1);          /* pop value, keep key for next call */
}
tea_pop(T, 1);              /* pop map */
```

#### See Also
tea_set_key, tea_get_key, tea_new_map
