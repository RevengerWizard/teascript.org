---
title: Map Methods
number: 5.
weight: 500
---

The `Map` type represents an object containing key-value pairs.

---

## Attributes

### Map:count

```tea
Map.count
```

The `count` attribute returns the number of key-value pairs stored in the map.

#### Example
```tea
var inventory = {
    ["sword"] = 1,
    ["shield"] = 1,
    ["potion"] = 5,
    ["gold"] = 250
}

print(inventory.count)  // 4

var empty = {}
print(empty.count)  // 0
```

---

### Map:keys

```tea
Map.keys
```

The `keys` attribute returns a list containing all the keys present in the map.

#### Example
```tea
var player = {
    ["name"] = "Aria",
    ["class"] = "Ranger",
    ["level"] = 17,
    ["guild"] = "Silverwood"
}

var k = player.keys
print(k)  // ["name", "class", "level", "guild"]

// Iterate over a map's keys
for const key in player.keys
{
    print("Field: " + key)
}
```

---

### Map:values

```tea
Map.values
```

The `values` attribute returns a list containing all the values present in the map.

#### Example
```tea
var high_scores = {
    ["Aria"] = 9820,
    ["Bram"] = 7415,
    ["Cyrus"] = 10230
}

var v = high_scores.values
print(v)  // [9820, 7415, 10230]

// Sum all values
var total = 0
for const score in high_scores.values
{
    total += score
}
print(total)  // 27465
```

---

## Methods

### Map:new()

```tea
function Map:new()
```

The `new` method creates a new empty map.

#### Example
```tea
var party = Map.new()
party.set("tank", "Bram")
party.set("healer", "Lyra")
party.set("dps", "Cyrus")

print(party.count)  // 3
```

---

### Map:get()

```tea
function Map:get(key)
```

The `get` method retrieves the value associated with the specified key in the map. If the key does not exist, `nil` is returned.

#### Arguments
- `key`: The key to look up in the map.

#### Returns
The method returns the value associated with `key`, or `nil` if the key is not present.

#### Example
```tea
var config = {
    ["volume"] = 0.8,
    ["difficulty"] = "hard",
    ["subtitles"] = true
}

print(config.get("volume"))       // 0.8
print(config.get("difficulty"))   // "hard"
print(config.get("mouse_speed"))  // nil
```

---

### Map:set()

```tea
function Map:set(key, value)
```

The `set` method inserts or updates a key-value pair in the map. If the key already exists, its value is updated; otherwise, a new entry is created. If no value is provided, the key is set to `nil`.

#### Arguments
- `key`: The key to insert or update in the map.
- `value`: The value to associate with `key`. Optional, defaults to `nil`.

#### Example
```tea
var stats = {}

stats.set("strength", 12)
stats.set("dexterity", 18)
stats.set("intelligence", 9)

print(stats.get("dexterity"))  // 18

// Update an existing key
stats.set("strength", 15)
print(stats.get("strength"))   // 15

// Add a key with no value
stats.set("luck")
print(stats.get("luck"))       // nil
```

---

### Map:update()

```tea
function Map:update(other)
```

The `update` method merges all key-value pairs from another map into the original map, overwriting any existing keys that collide.

#### Arguments
- `other`: The map whose entries will be merged into the original map.

#### Example
```tea
var defaults = {
    ["theme"] = "dark",
    ["font_size"] = 14,
    ["auto_save"] = true
}

var user_prefs = {
    ["theme"] = "light",
    ["font_size"] = 18
}

defaults.update(user_prefs)
print(defaults)
// { "theme": "light", "font_size": 18, "auto_save": true }
```

---

### Map:clear()

```tea
function Map:clear()
```

The `clear` method removes all key-value pairs from the map, leaving it empty.

#### Example
```tea
var cart = {
    ["apples"] = 3,
    ["bread"] = 1,
    ["milk"] = 2
}

print(cart.count)  // 3
cart.clear()
print(cart.count)  // 0
print(cart)        // {}
```

---

### Map:contains()

```tea
function Map:contains(key)
```

The `contains` method checks whether a given key exists in the map.

#### Arguments
- `key`: The key to search for within the map.

#### Returns
The method returns `true` if the `key` is found in the map, or `false` otherwise.

#### Example
```tea
var spellbook = {
    ["fireball"] = 12,
    ["ice_shard"] = 8,
    ["lightning"] = 15
}

print(spellbook.contains("fireball"))   // true
print(spellbook.contains("meteor"))     // false
```

---

### Map:delete()

```tea
function Map:delete(key)
```

The `delete` method removes the key-value pair associated with the specified key from the map. If the key is not present, an error is raised.

#### Arguments
- `key`: The key to remove from the map.

#### Example
```tea
var inventory = {
    ["sword"] = 1,
    ["shield"] = 1,
    ["potion"] = 5
}

inventory.delete("potion")
print(inventory.contains("potion"))  // false
print(inventory)
// { "sword": 1, "shield": 1 }

// Deleting a missing key raises an error
inventory.delete("bow")  // error: map key not found
```

---

### Map:copy()

```tea
function Map:copy()
```

The `copy` method produces a shallow copy of the map. The new map contains the same key-value pairs, but is a separate object.

#### Example
```tea
var original = {
    ["hp"] = 100,
    ["mp"] = 50
}

var clone = original.copy()
clone.set("hp", 1)

print(original.get("hp"))  // 100
print(clone.get("hp"))     // 1
```

---

### Map:foreach()

```tea
function Map:foreach(callback)
```

The `foreach` method iterates over every key-value pair in the map, invoking the given callback function with the key and value as arguments. The callback should accept two parameters: `key` and `value`.

#### Arguments
- `callback`: A function called once per entry, receiving the entry's key and value.

#### Example
```tea
var roster = {
    ["Aria"] = "Ranger",
    ["Bram"] = "Warrior",
    ["Lyra"] = "Cleric"
}

roster.foreach(function(key, value) {
    print(key + " plays a " + value)
})
// Aria plays a Ranger
// Bram plays a Warrior
// Lyra plays a Cleric

// A callback that ignores the key can still use the value
var total = 0
var prices = {["apple"] = 2, ["banana"] = 3, ["cherry"] = 5}
prices.foreach(function(_, value) {
    total = total + value
})
print(total)  // 10
```

---

### Map:iter()

```tea
function Map:iter()
```

The `iter` method returns an iterator over the map's key-value pairs. Each step yields a two-element list `[key, value]`, which can be conveniently unpacked in a `for` loop.

#### Example
```tea
var scores = {
    ["Aria"] = 9820,
    ["Bram"] = 7415,
    ["Cyrus"] = 10230
}

for const entry in scores.iter() {
    print(tostring(entry[0]) + " scored " + tostring(entry[1]))
}
// Aria scored 9820
// Bram scored 7415
// Cyrus scored 10230
```

---

### + Operator

```tea
operator Map:+(other)
```

The `+` operator creates a new map containing all key-value pairs from both the original map and `other`. When the same key appears in both maps, the value from the right-hand map (`other`) wins.

#### Arguments
- `other`: The map to combine with the original map.

#### Example
```tea
var base_stats = {
    ["hp"] = 100,
    ["mp"] = 50,
    ["atk"] = 10
}

var buffs = {
    ["atk"] = 25,
    ["def"] = 15
}

var final_stats = base_stats + buffs
print(final_stats)
// { "hp": 100, "mp": 50, "atk": 25, "def": 15 }

// The original maps are unchanged
print(base_stats.get("atk"))  // 10
print(buffs.get("atk"))       // 25
```
