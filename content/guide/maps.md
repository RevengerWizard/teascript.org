---
title: Maps
weight: 140
toc: true
---

A map is an *associative* collection. It holds a set of entries, each of which maps a *key* to a *value*. The same data structure has a variety of names in other languages: hash table, dictionary, association, table, etc.

You can create a map by placing a series of comma-separated entries inside curly braces. Each entry is a key and a value separated by an equal sign:

```tea
var tee = {
    green = "Light and refreshing",
    black = "Bold and robust",
    white = "Delicate and floral",
    oolong = "Semi-oxidized",
    herbal = "Caffeine-free infusions"
}
```

This creates a map that associates a type of tea (key) to a description (value). Syntactically, in a map literal, keys can be single name or any kind of expression wrapped in square brackets. Values can be any expression.

```tea
var fruits = {
    ["Red Apple"] = "fruit",
    ["Carrot"] = "vegetable",
    ["Banana"] = "fruit"
}
```

In Teascript, keys and values can be of any type and multiple keys may map to the same value. This means that you can use nil, numbers, bools, strings, ranges and even functions.

## Adding entries

You can add new key-value pairs to the map using the subscript operator:

```tea
var capitals = {}
    capitals["Texas"] = "Austin"
    capitals["Montana"] = "Helena"
    capitals["Oregon"] = "Salem"
```

If the key isn’t already present, this adds it and associates it with the given value. If the key is already there, this just replaces its value.

## Looking up values

To find the value associated with some keys, again you use the subscript operator:

```tea
print(capitals["Oregan"])   // Salem
```

If the key is present, this returns its value. Otherwise, it throws an error.
To tell definitely if a key exists, you can use the `in` operator:

```tea
var capitals = {
    ["California"] = "Sacramento",
    ["Texas"] = "Austin",
    ["New York"] = "Albany"
}

print("Oregon" in capitals) // false
print("California" in capitals) // true
```

You can see how many entries a map contains using `count`:

```tea
print(capitals.count)   // 3
```

## Removing entries

To remove an entry from a map, call `delete` and pass in the key for the entry you want to delete:

```tea
capitals.delete("Texas")
print("Maine" in capitals)
```

If you want to remove *everything* from the map, like with lists, you call `clear`:

```tea
capitals.clear()
print(capitals.count)
```

## Iterating over the contents

The subscript operator works well for finding values when you know the key you're looking for, but sometimes you want to see everything that's in the map. You can use a regular for in loop to iterate the contents, and map exposes two additional methods to access the contents: `keys` and `values`.

Regardless of how you iterate, the *order* that things are iterated in isn't defined. Teascript makes no promises about what order keys and values are iterated. All it promises is that every entry will appear exactly once.

When you iterate a map with `for`, you'll be handed a list entry containing key and value which can be unpacked in two variables for easy access.

```tea
var states = {
    ["California"] "Green tea",
    ["New York"] = "Black tea",
    ["Texas"] = "Sweet tea",
    ["Oregon"] = "Herbal tea",
    ["South Carolina"] = "Iced tea",
    ["Vermont"] = "Chamomile tea",
}

for(var key, value in states)
{
    print("Popular tea in ${key} is ${value}")
}
```