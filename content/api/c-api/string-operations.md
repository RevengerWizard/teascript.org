---
title: String Operations
weight: 2100
---

This section covers functions that operate on string values on the stack.

---

## tea_concat()

```c
void tea_concat(tea_State* T, int n);
```

{{< stack before="...,str1,...,strN" after="...,str" >}}

Concatenates the top `n` values on the stack, which must all be strings, and replaces them with the single resulting string. This implements the `+` string concatenation at the C API level.

If `n` is zero, an empty string is pushed (this is the neutral element of concatenation). If `n` is one, the function does nothing (the single value is already the result).

#### Arguments
- `T`: Teascript state
- `n`: Number of values to concatenate

#### Example
```c
tea_push_string(T, "hello");
tea_push_string(T, ", ");
tea_push_string(T, "world");
tea_concat(T, 3);               /* ["hello, world"] */

tea_concat(T, 0);               /* ["hello, world", ""] */
```

#### See Also
