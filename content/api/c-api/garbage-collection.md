---
title: Garbage Collection
weight: 1700
---

This section covers functions related to Teascript's automatic memory management. The runtime uses a garbage collector to reclaim memory occupied by objects (strings, lists, maps, classes, userdata, and so on) that are no longer reachable from the stack, registry, or the globals. Normally the collector runs automatically, but the API exposes an explicit trigger for advanced or specific use cases.

---

## tea_gc()

```c
int tea_gc(tea_State* T);
```

Performs a full garbage collection cycle immediately. This walks the reachable object graph, marks everything that is still in use, and sweeps away the rest, invoking any registered finalizers on the objects that are freed.

The return value is the amount of memory reclaimed, expressed in kilobytes KiB (bytes divided by 1024). This is useful for diagnostics or for benchmarking allocator behavior.

#### Arguments
- `T`: Teascript state

#### Returns
The number of kibibytes of memory reclaimed by this collection cycle.

#### Example
```c
/* Build and drop a large amount of garbage */
tea_new_list(T, 0);
for(int i = 0; i < 100000; i++)
{
    tea_push_integer(T, i);
    tea_add_item(T, -2);
}
tea_pop(T, 1);

int kb = tea_gc(T);
printf("Reclaimed %d KB\n", kb);
```

#### See Also
tea_set_finalizer, tea_free
