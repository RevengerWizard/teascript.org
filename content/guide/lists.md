---
title: Lists
weight: 150
toc: true
---

A list is a compound object that holds a collection of elements identified by integer index. You can create a list by placing a sequence of comma separated expressions inside square brackets:

```tea
[1, 'apple', true]
```

Here, we've created a list of three elements. Notice that the elements don’t have to be the same type.

## Accessing elements

You can access an element from a list by using the subscript operator on it with the index of the element you want. Like most languages, indexes start at zero:

```tea
var cups = [
    "Chamomile",
    "Matcha",
    "Peppermint",
    "Chai"
]

print(cups[0])   // Chamomille
print(cups[1])   // Matcha
```

Negative indices count backwards from the end:

```tea
print(cups[-1])  // Chai
print(cups[-2])  // Peppermint
```

It's a runtime error to pass an index outside of the bounds of the list. If you don't know what those bounds are, you can find out using `len`:

```tea
print(cups.len)  // 4
```

## Adding elements

Lists are *mutable*, meaning their contents can be changed. You can swap out an existing element in the list using the subscript setter:

```tea
cups[1] = "Rooibos"
print(cups[1])  // Rooibos
```

It's an error to set an element that’s out of bounds. To grow a list, you can use `add` to append a single item to the end:

```tea
cups.add("Herbal")
print(cups.len)
```

You can insert a new element at a specific position using `insert`:

```tea
cups.insert(2, "Oolong")
```

The first argument is the index to insert at, and the second is the value to insert. All elements following the inserted one will be pushed down to make room for it.

It’s valid to "insert" after the last element in the list, but only right after it. Like other methods, you can use a negative index to count from the back. Doing so counts back from the size of the list after it’s grown by one:

```tea
var letters = ["a", "b", "c"]
letters.insert(3, "d")  // Inserts at end
print(letters)  // [a, b, c, d]
letters.insert(-2, "e") // Counts back from size after insert
print(letters)   // [a, b, c, e, d]
```

## Removing elements

The opposite of `insert` is `delete`. It removes a single element from a given position in the list.

To remove a specific value instead, use remove. The first value that matches using regular equality will be removed.

In both cases, all following items are shifted up to fill in the gap.

```tea
var letters = ["a", "b", "c", "d"]
letters.delete(1)
print(letters)  // [a, c, d]
letters.remove("a")
print(letters)  // [c, d]
```

Both the `remove` and `delete` method return the removed item:

```tea
print(letters.delete(1))  // c
```

If `remove` couldn't find the value in the list, it throws a runtime error.

If you want to remove everything from the list, you can clear it:

```tea
cups.clear()
print(cups)    // []
```