---
title: Stack Manipulation
weight: 300
---

This section covers the fundamental operations for manipulating the Teascript value stack from C. These functions allow you to push, pop, insert, remove, and rearrange values on the stack, forming the basis for passing arguments and receiving results when interfacing with Teascript code.

---

## tea_absindex()

```c
int tea_absindex(tea_State* T, int index);
```

Converts the acceptable index `index` into an equivalent absolute index (that is, one that does not depend on the top of the stack). If the index is already absolute or a pseduo-index, it is provided unchanged.

#### Arguments
- `T`: Teascript state
- `index`: Stack index to normalize

#### Returns
The absolute index corresponding to `index`.

#### Example
```c
tea_push_integer(T, 123);
tea_push_integer(T, 456);
tea_push_integer(T, 789);   /* [123, 456, 789] */

int abs = tea_absindex(T, -2);  /* abs = 1 */
tea_push_integer(T, 101);
tea_push_value(T, abs);     /* [123, 456, 789, 101, 456] */
```

#### See Also
tea_get_top, tea_set_top

---

## tea_pop()

```c
void tea_pop(tea_State* T, int n);
```

Removes `n` elements from the top of the stack.

{{< stack before="...,val1,...,valN" after="..." >}}

#### Arguments
- `T`: Teascript state
- `n`: Number of elements to pop

#### Example
```c
tea_push_integer(T, 1);
tea_push_integer(T, 2);
tea_push_integer(T, 3);   /* [1, 2, 3] */
tea_pop(T, 2);            /* [1] */
```

#### See Also
tea_set_top, tea_remove

---

## tea_get_top()

```c
int tea_get_top(tea_State* T);
```

Provides the current number of elements on the stack (the stack top offset). This is equivalent to the difference between the current top and the base of the current frame.

#### Arguments
- `T`: Teascript state

#### Returns
The number of elements currently on the stack.

#### Example
```c
tea_push_integer(T, 42);
tea_push_integer(T, 43);
int n = tea_get_top(T);   /* n = 2 */
```

#### See Also
tea_set_top, tea_absindex

---

## tea_set_top

```c
void tea_set_top(tea_State* T, int index);
```

{{< stack before="..." after="..." >}}

Sets the stack top to `index`, normalizing negative values relative to the current top. If the new top results larger than the current one, the new slots are filled with `nil`s. If it is smaller, the values above the new top are discarded.

#### Arguments
- `T`: Teascript state
- `index`: New stack top. Negative values are relative to the current top

#### Example
```c
/* Assume stack is empty */

tea_push_integer(T, 123);   /* top = 1, [123] */
tea_set_top(T, 3);          /* top = 3, [123, nil, nil] */
tea_set_top(T, -1);         /* top = 2, [123, nil] */
tea_set_top(T, 0);          /* top = 0, [] */
```

#### See Also
tea_pop, tea_get_top

---

## tea_push_value()

```c
void tea_push_value(tea_State* T, int index);
```

{{< stack before="...,val,..." after="...,val,...,val" >}}

Pushes a copy of the value at `index` onto the top of the stack.

#### Arguments
- `T`: Teascript state
- `index`: Stack index of the value to duplicate

#### Example
```c
tea_push_integer(T, 123);
tea_push_integer(T, 398);   /* [123, 398] */
tea_push_value(T, -2);      /* [123, 398, 123] */
```

#### See Also
tea_copy, tea_replace

---

## tea_remove()

```c
void tea_remove(tea_State* T, int index);
```

{{< stack before="...,val(index),..." after="...,..." >}}

Removes the value at `index`. Elements above `index` are shifted down to fill the gap.

#### Arguments
- `T`: Teascript state
- `index`: Stack index of the value to remove

#### Example
```c
tea_push_integer(T, 123);
tea_push_integer(T, 453);
tea_push_integer(T, 987);   /* [123, 453, 987] */
tea_remove(T, -2);          /* [123, 987] */
```

#### See Also
tea_insert, tea_pop

---

## tea_insert()

```c
void tea_insert(tea_State* T, int index);
```

{{< stack before="...,old(index),...,val" after="...,val(index),old,..." >}}

Inserts the value popped from the top of the stack at position `index`, shifting up the elements at and above `index`.

NOTE: Negative indices are evaluated before the top value is popped.

#### Example
```c
tea_push_string(T, "foo");
tea_push_string(T, "tea");
tea_push_string(T, 698);
tea_push_string(T, "bar");  /* ["foo", "tea", 698, "bar"] */
tea_insert(T, -3);          /* ["foo", "tea", "bar", 698] */
```

#### See Also
tea_remove, tea_replace

---

## tea_replace()

```c
void tea_replace(tea_State* T, int index);
```

{{< stack before="...,old(index),...,val" after="...,val(index)..." >}}

Replaces the value at `index` with the value popped from the top of the stack.

NOTE: Negative indices are evaluated before the top value is popped.

#### Arguments
- `T`: Teascript state
- `index`: Stack index of the value to replace

#### Example
```c
tea_push_integer(T, 123);
tea_push_integer(T, 897);
tea_push_integer(T, 769);
tea_push_string(T, "bar");  /* [123, 897, 769, "bar"] */
tea_replace(T, -3);         /* [123, "bar", 769] */
```

#### See Also
tea_copy, tea_insert

---

## tea_copy()

```c
void tea_copy(tea_State* T, int from_index, int to_index);
```

{{< stack before="...,old(to_index),...,val(from_index),..." after="...,val(to_index),...,val(from_index),..." >}}

Copies the value at `from_index` to `to_index`, overwriting the previous value at the destination.

This is a short-hand for:

```c
to_index = tea_absindex(T, to_index);
tea_push_value(T, from_index);
tea_replace(T, to_index);
```

#### Arguments
- `T`: Teascript state
- `from_index`: Stack index of the source value
- `to_index`: Stack index of the destination slot

#### Example
```c
tea_push_integer(T, 10);
tea_push_integer(T, 20);
tea_push_integer(T, 30);
tea_copy(T, -1, 1);         /* [30, 20, 30] */
```

#### See Also
tea_push_value, tea_replace

---

## tea_swap()

```c
void tea_swap(tea_State* T, int index1, int index2);
```

{{< stack before="...,val1,...,val2,..." after="...,val2,...,val1,..." >}}

Swaps the values at `index1` and `index2`. If the indices are the same, the call is a no-op.

#### Arguments
- `T`: Teascript state
- `index1`: First stack index
- `index2`: Second stack index

#### Example
```c
tea_push_integer(T, 569);
tea_push_string(T, "foo");
tea_push_integer(T, 437);
tea_push_string(T, "bar");
tea_push_string(T, "tea");  /* [569, "foo", 437, "bar", "tea"] */
tea_swap(T, -3, -1);        /* [569, "foo", "tea", "bar", 437] */
```

#### See Also
tea_copy, tea_replace
