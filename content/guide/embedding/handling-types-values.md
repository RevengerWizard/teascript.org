---
title: Handling Types and Values
number: 13.
weight: 3400
---

The previous chapters covered how to call Teascript from C and how to expose C functions and types back to Teascript. This chapter fills in the remaining gap: how to manipulate Teascript's built-in compound types — lists, maps, objects, and modules — directly from C. These operations let you construct data structures to pass into Teascript, inspect structures that Teascript passes to you, and integrate C code into the module system.

## List Operations

Lists are Teascript's ordered, resizable sequence type. From C, you create an empty list with `tea_new_list`, passing a size hint for the initial backing allocation:

```c
void tea_new_list(tea_State* T, size_t n);
```

The hint is purely an optimization — the list will grow as needed regardless. Pass `0` if you do not know the final size upfront. The new list is pushed onto the stack.

To build a list and hand it to Teascript:

```c
tea_new_list(T, 3);           /* push a new list, hint capacity 3 */

tea_push_number(T, 1.0);
tea_add_item(T, -2);          /* append 1.0 to the list at index -2 */

tea_push_number(T, 2.0);
tea_add_item(T, -2);

tea_push_number(T, 3.0);
tea_add_item(T, -2);

tea_set_global(T, "nums");    /* pops the list and sets it as a global */
```

`tea_add_item` pops the value on top of the stack and appends it to the list at the given index. The list index must refer to an actual list; passing the wrong type raises an error.

Reading and writing by position use `tea_get_item` and `tea_set_item`. Both take the list's stack index and an integer position. `tea_get_item` pushes the element at that position onto the stack and returns `true`, or returns `false` if the index is out of bounds. `tea_set_item` pops the top of the stack and stores it at the given position:

```c
/* Read the first element */
if(tea_get_item(T, list_index, 0))
{
    double v = tea_get_number(T, -1);
    tea_pop(T, 1);
}

/* Overwrite the second element */
tea_push_string(T, "replaced");
tea_set_item(T, list_index, 1);
```

`tea_insert_item` inserts the top of the stack at a given position, shifting subsequent elements up. `tea_delete_item` removes the element at a position, shifting subsequent elements down, and returns `true` on success:

```c
tea_push_string(T, "inserted");
tea_insert_item(T, list_index, 0); /* prepend */

tea_delete_item(T, list_index, 2); /* remove element at position 2 */
```

To get the number of elements in a list (or the length of any other object that defines a length), use `tea_len`:

```c
int n = tea_len(T, list_index);
```

A common pattern when receiving a list from Teascript and iterating over it:

```c
/* Assume the list was passed as argument 0 */
tea_check_list(T, 0);

int n = tea_len(T, 0);
for(int i = 0; i < n; i++)
{
    tea_get_item(T, 0, i);
    process(tea_get_number(T, -1));
    tea_pop(T, 1);
}
```

## Map Operations

Maps are Teascript's associative type, mapping arbitrary keys to values. Create an empty map with `tea_new_map`:

```c
void tea_new_map(tea_State* T);
```

The most common operations use string keys. `tea_get_key` pushes the value associated with a string key onto the stack, returning `true` if the key exists. `tea_set_key` pops the top of the stack and associates it with the given key:

```c
tea_new_map(T);

tea_push_number(T, 42.0);
tea_set_key(T, -2, "answer");

tea_push_bool(T, true);
tea_set_key(T, -2, "active");

tea_set_global(T, "config");
```

Reading back:

```c
tea_get_global(T, "config");

if(tea_get_key(T, -1, "answer"))
{
    printf("answer = %g\n", tea_get_number(T, -1));
    tea_pop(T, 1);
}
tea_pop(T, 1); /* pop config */
```

For non-string keys, `tea_get_field` and `tea_set_field` use whatever key is on top of the stack. Push the key, then call the function — `tea_set_field` additionally pops the value from below the key:

```c
/* map[some_key] = value, using an arbitrary key type */
tea_push_string(T, "some_key"); /* key */
tea_get_field(T, map_index);    /* pushes map["some_key"] */
tea_pop(T, 1);

tea_push_number(T, 99.0);       /* value */
tea_push_string(T, "some_key"); /* key */
tea_set_field(T, map_index);    /* map[key] = value, pops both */
```

For integer keys specifically, `tea_get_fieldi` and `tea_set_fieldi` avoid the push:

```c
tea_get_fieldi(T, map_index, 7);  /* push map[7] */
tea_push_string(T, "seven");
tea_set_fieldi(T, map_index, 7);  /* map[7] = "seven" */
```

To remove an entry, use `tea_delete_key` for string keys or `tea_delete_field` for arbitrary keys on the stack:

```c
tea_delete_key(T, map_index, "answer");
```

To iterate over all entries in a map, use `tea_next`. It works similarly to a cursor: push the map index and call `tea_next` with the map's stack index. On each call it pushes the next key-value pair and returns `true`. When there are no more entries it returns `false` and pushes nothing. Start iteration by pushing `nil` before the first call:

```c
tea_push_nil(T);                    /* initial key: nil means start */
while(tea_next(T, map_index))
{
    /* key at -2, value at -1 */
    const char* key = tea_to_string(T, -2);
    printf("  %s\n", key);
    tea_pop(T, 1);                  /* pop value, leave key for next call */
}
```

Do not modify the map while iterating over it. Insertions or deletions during traversal produce undefined iteration order and may skip or repeat entries.

## Object Operations

Instance attributes are accessed through `tea_get_attr` and `tea_set_attr`. These go through the full Teascript attribute dispatch — getter and setter methods are invoked if defined, exactly as they would be from a script:

```c
void tea_get_attr(tea_State* T, int obj, const char* key);
void tea_set_attr(tea_State* T, int obj, const char* key);
```

`tea_get_attr` pushes the attribute value. `tea_set_attr` pops the top of the stack and stores it. Both raise an error if the attribute does not exist and no `getattr`/`setattr` handler is defined on the object.

If you want to check for the presence of an attribute without raising an error, use `tea_has_attr`:

```c
if(tea_has_attr(T, obj_index, "name"))
{
    tea_get_attr(T, obj_index, "name");
    printf("name: %s\n", tea_get_string(T, -1));
    tea_pop(T, 1);
}
```

Subscript access — the `[]` operator — goes through `tea_get_index` and `tea_set_index`. Push the key onto the stack, then call the function with the object's index:

```c
/* obj[key] */
tea_push_string(T, "key");
tea_get_index(T, obj_index);   /* replaces key with obj["key"] */

/* obj[key] = value */
tea_push_string(T, "key");     /* push key */
tea_push_number(T, 1.0);       /* push value */
tea_set_index(T, obj_index);   /* obj[key] = value, pops both */
```

`tea_get_index` and `tea_set_index` both go through the `get`/`set` special method protocol, so operator overloading defined in Teascript is respected here too.

## Module Operations

Modules in Teascript are values like any other. From C you can create them directly, add entries to them, and make them importable by the runtime.

`tea_new_module` creates an empty named module and pushes it:

```c
void tea_new_module(tea_State* T, const char* name);
```

Once a module is on the stack, populate it with `tea_set_key`, `tea_set_funcs`, `tea_set_methods`, or `tea_create_class`, then register it so that `import` statements can find it. The typical pattern inside an open function is to let `tea_create_module` handle all of this in one step, as we saw in chapter 12. But when you need more control — conditionally registering entries, building the module in stages, or combining multiple `tea_Reg` arrays — you can manage the module yourself:

```c
TEA_API void tea_import_mymod(tea_State* T)
{
    tea_new_module(T, "mymod");

    /* Add a constant */
    tea_push_number(T, 3.14159);
    tea_set_key(T, -2, "PI");

    /* Add a submodule */
    tea_create_submodule(T, "util", util_funcs);

    /* Add functions with shared upvalue */
    tea_push_integer(T, 0);                 /* shared counter upvalue */
    tea_set_funcs(T, counted_funcs, 1);     /* distributes upvalue to all */
}
```

Variable access across module boundaries uses `tea_get_var` and `tea_set_var`. These look up a named variable inside a named module, without requiring you to first push the module onto the stack:

```c
bool tea_get_var(tea_State* T, const char* module, const char* var);
void tea_set_var(tea_State* T, const char* module, const char* var);
```

`tea_get_var` pushes the variable's value and returns `true` if found. `tea_set_var` pops the top of the stack and stores it. These are convenient when you need to read or update module-level state from deeply nested C code without threading the module value through as a parameter:

```c
/* Read mymod.version */
if(tea_get_var(T, "mymod", "version"))
{
    printf("version: %s\n", tea_get_string(T, -1));
    tea_pop(T, 1);
}

/* Set mymod.debug = true */
tea_push_bool(T, true);
tea_set_var(T, "mymod", "debug");
```

For global variables that do not belong to any module, use `tea_get_global` and `tea_set_global` as we have seen throughout the previous chapters. `tea_get_var` and `tea_set_var` with a `NULL` module name behave equivalently.
