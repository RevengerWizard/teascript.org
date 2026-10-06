---
title: List Methods
number: 4.
weight: 400
---

The `List` type represents an ordered collection of Tea values.

---

## Attributes

### List:len

The attribute `len` allows to receive the number of elements in a Tea list.

#### Example
```tea
const fruits = ["apple", "banana", "cherry"]
print(fruits.len)  // 3

print([].len)  // 0
```

---

## Methods

### List:new()

```tea
function List:new(size=0)
```

The `new` method creates a new list, optionally pre-allocated with a given size. This is useful when you know in advance how many elements the list will hold, as it can improve performance by reducing the number of internal reallocations.

#### Arguments
- `size`: An optional number indicating the initial capacity of the list. If not specified, defaults to `0`.

#### Example
```tea
var empty = List:new()
print(empty.len)  // 0

var preallocated = List:new(10)
print(preallocated.len)  // 0, but capacity is pre-allocated

// Building a list of squares with known size
var squares = List:new(5)
for i in 1..5 {
    squares.add(i * i)
}
print(squares)  // [1, 4, 9, 16, 25]
```

---

### List:add()

```tea
function List:add(value, ...)
```

The `add` method appends one or more values to the end of the list.

#### Arguments
- `value`: The first value to append to the list.
- `...`: Additional values to append, if any.

#### Returns
The method returns the list itself, allowing for method chaining.

#### Example
```tea
var shopping = ["milk", "eggs"]
shopping.add("bread")
print(shopping)  // ["milk", "eggs", "bread"]

// Add multiple items at once
shopping.add("butter", "cheese", "jam")
print(shopping)  // ["milk", "eggs", "bread", "butter", "cheese", "jam"]

// Chaining
var nums = [1, 2]
nums.add(3).add(4).add(5)
print(nums)  // [1, 2, 3, 4, 5]
```

---

### List:remove()

```tea
function List:remove(value)
```

The `remove` method removes the first occurrence of a specified value from the list. If the value is not found, an error is raised.

#### Arguments
- `value`: The value to remove from the list.

#### Example
```tea
var guests = ["Alice", "Bob", "Charlie", "Bob"]
guests.remove("Bob")
print(guests)  // ["Alice", "Charlie", "Bob"] (only first Bob removed)

guests.remove("Charlie")
print(guests)  // ["Alice", "Bob"]

// Removing a non-existent value raises an error
// guests.remove("Dave")  // Error: Value does not exist within the list
```

---

### List:delete()

```tea
function List:delete(index)
```

The `delete` method removes the element at the specified index from the list. All subsequent elements are shifted down by one position. If the index is out of bounds, an error is raised.

#### Arguments
- `index`: The zero-based index of the element to remove.

#### Example
```tea
var playlist = ["Song A", "Song B", "Song C", "Song D"]
playlist.delete(1)
print(playlist)  // ["Song A", "Song C", "Song D"]

playlist.delete(0)
print(playlist)  // ["Song C", "Song D"]

// Deleting from an empty list is a no-op
var empty = []
empty.delete(0)
print(empty)  // []

// Out-of-bounds access raises an error
// playlist.delete(10)  // Error: Index out of bounds
```

---

### List:clear()

```tea
function List:clear()
```

The `clear` method removes all elements from the list, leaving it empty.

#### Arguments
The method takes no arguments.

#### Example
```tea
var cart = ["laptop", "mouse", "keyboard"]
cart.clear()
print(cart)  // []

// Clearing an already empty list is safe
cart.clear()
print(cart)  // []
```

---

### List:insert()

```tea
function List:insert(value, index)
```

The `insert` method inserts a value at the specified index in the list. All elements at and after that index are shifted up by one position. If the index is out of bounds, an error is raised.

#### Arguments
- `value`: The value to insert into the list.
- `index`: The zero-based index at which to insert the value.

#### Example
```tea
var queue = ["first", "third", "fourth"]
queue.insert("second", 1)
print(queue)  // ["first", "second", "third", "fourth"]

queue.insert("zeroth", 0)
print(queue)  // ["zeroth", "first", "second", "third", "fourth"]

// Inserting at the end is equivalent to add
queue.insert("fifth", queue.len - 1)
print(queue)  // ["zeroth", "first", "second", "third", "fourth", "fifth"]
```

---

### List:extend()

```tea
function List:extend(other)
```

The `extend` method appends all elements from another list to the end of the original list.

#### Arguments
- `other`: The list whose elements will be appended.

#### Example
```tea
var first = [1, 2, 3]
var second = [4, 5, 6]
first.extend(second)
print(first)  // [1, 2, 3, 4, 5, 6]

// Extending with an empty list does nothing
first.extend([])
print(first)  // [1, 2, 3, 4, 5, 6]

// Merging multiple lists
var combined = ["a"]
combined.extend(["b", "c"])
combined.extend(["d", "e"])
print(combined)  // ["a", "b", "c", "d", "e"]
```

---

### List:reverse()

```tea
function List:reverse()
```

The `reverse` method reverses the order of elements in the list in place.

#### Arguments
The method takes no arguments.

#### Example
```tea
var countdown = [5, 4, 3, 2, 1]
countdown.reverse()
print(countdown)  // [1, 2, 3, 4, 5]

var letters = ["a", "b", "c", "d"]
letters.reverse()
print(letters)  // ["d", "c", "b", "a"]

// Reversing a single-element list has no effect
var single = [42]
single.reverse()
print(single)  // [42]
```

---

### List:contains()

```tea
function List:contains(value)
```

The `contains` method checks whether the specified value is present in the list.

#### Arguments
- `value`: The value to search for within the list.

#### Returns
The method returns `true` if the value is found in the list, or `false` otherwise.

#### Example
```tea
var inventory = ["sword", "shield", "potion"]
print(inventory.contains("shield"))  // true
print(inventory.contains("bow"))     // false

// Works with different types
var mixed = [1, "two", 3.0, true]
print(mixed.contains("two"))   // true
print(mixed.contains(3))       // false (3 is not 3.0)
print(mixed.contains(true))    // true
```

---

### List:count()

```tea
function List:count(value)
```

The `count` method counts the number of occurrences of a specified value within the list.

#### Arguments
- `value`: The value to count within the list.

#### Returns
The method returns the number of times the value appears in the list.

#### Example
```tea
var votes = ["yes", "no", "yes", "yes", "abstain", "no"]
print(votes.count("yes"))      // 3
print(votes.count("no"))       // 2
print(votes.count("abstain"))  // 1
print(votes.count("maybe"))    // 0

// Counting duplicates in a list of numbers
var nums = [1, 2, 2, 3, 3, 3, 4]
print(nums.count(3))  // 3
```

---

### List:fill()

```tea
function List:fill(value)
```

The `fill` method replaces every element in the list with the specified value.

#### Arguments
- `value`: The value to fill the list with.

#### Example
```tea
var grid = [0, 0, 0, 0, 0]
grid.fill(1)
print(grid)  // [1, 1, 1, 1, 1]

var board = ["empty", "empty", "empty"]
board.fill("X")
print(board)  // ["X", "X", "X"]

// Filling with a list reference
var buckets = [nil, nil, nil]
buckets.fill([])
print(buckets)  // [[], [], []] (all elements reference the same list)
```

---

### List:sort()

```tea
function List:sort(comparator=nil)
```

The `sort` method sorts the elements of the list in place. If no comparator is provided, the elements are sorted in ascending order (numeric comparison). If a comparator function is provided, it must take two arguments and return `true` if the first should come before the second.

#### Arguments
- `comparator`: An optional function that takes two elements and returns a boolean indicating their order. If not specified, numerical ascending order is used.

#### Example
```tea
var scores = [88, 42, 95, 67, 73]
scores.sort()
print(scores)  // [42, 67, 73, 88, 95]

// Sorting in descending order with a custom comparator
var descending = [3, 1, 4, 1, 5, 9, 2, 6]
descending.sort(function(a, b) {
    return a > b
})
print(descending)  // [9, 6, 5, 4, 3, 2, 1, 1]

// Sorting strings by length
var words = ["banana", "apple", "cherry", "date"]
words.sort(function(a, b) {
    return a.len < b.len
})
print(words)  // ["date", "apple", "banana", "cherry"]
```

---

### List:index()

```tea
function List:index(value)
```

The `index` method finds the index of the first occurrence of a specified value within the list.

#### Arguments
- `value`: The value to search for within the list.

#### Returns
The method returns the index of the first occurrence of the value, or `-1` if the value is not found.

#### Example
```tea
var colors = ["red", "green", "blue", "green"]
print(colors.index("green"))  // 1 (first occurrence)
print(colors.index("blue"))   // 2
print(colors.index("yellow")) // -1

// Using index to check existence
if colors.index("red") != -1 {
    print("Red is in the list!")
}
```

---

### List:join()

```tea
function List:join(separator="")
```

The `join` method concatenates all elements of the list into a single string, with an optional separator between each element.

#### Arguments
- `separator`: An optional string to place between elements. If not specified, defaults to an empty string `""`.

#### Returns
The method returns a string containing all elements joined together.

#### Example
```tea
var words = ["Hello", "world", "from", "Tea"]
print(words.join(" "))   // "Hello world from Tea"
print(words.join("-"))   // "Hello-world-from-Tea"
print(words.join())      // "HelloworldfromTea"

// Joining numbers
var nums = [1, 2, 3, 4, 5]
print(nums.join(", "))   // "1, 2, 3, 4, 5"

// Building a CSV line
var row = ["Alice", "30", "Engineer"]
print(row.join(","))     // "Alice,30,Engineer"
```

---

### List:copy()

```tea
function List:copy()
```

The `copy` method creates a shallow copy of the list. The new list contains references to the same elements as the original list.

#### Arguments
The method takes no arguments.

#### Returns
The method returns a new list containing the same elements as the original.

#### Example
```tea
var original = [1, 2, 3]
var duplicate = original.copy()
duplicate.add(4)
print(original)   // [1, 2, 3]
print(duplicate)  // [1, 2, 3, 4]

// Shallow copy: nested lists are shared
var nested = [[1, 2], [3, 4]]
var shallow = nested.copy()
shallow[0].add(99)
print(nested)   // [[1, 2, 99], [3, 4]] (original affected!)
```

---

### List:find()

```tea
function List:find(predicate)
```

The `find` method returns the first element in the list for which the predicate function returns `true`. If no element satisfies the predicate, `nil` is returned.

#### Arguments
- `predicate`: A function that takes an element and returns a boolean.

#### Example
```tea
var numbers = [1, 3, 5, 8, 9, 12]
var firstEven = numbers.find(function(n) {
    return n % 2 == 0
})
print(firstEven)  // 8

// Finding a specific object
var users = [
    {name: "Alice", age: 30},
    {name: "Bob", age: 25},
    {name: "Charlie", age: 35}
]
var bob = users.find(function(user) {
    return user.name == "Bob"
})
print(bob)  // {name: "Bob", age: 25}

// No match returns nil
var none = numbers.find(function(n) { return n > 100 })
print(none)  // nil
```

---

### List:flat()

```tea
function List:flat()
```

The `flat` method creates a new list with all sub-list elements concatenated into it recursively.

#### Arguments
The method takes no arguments.

#### Returns
The method returns a new flattened list.

#### Example
```tea
var nested = [1, [2, 3], [4, [5, 6]]]
var flat = nested.flat()
print(flat)  // [1, 2, 3, 4, 5, 6]

// Deeply nested structure
var deep = [[[[1]]], [[2, [3]]]]
print(deep.flat())  // [1, 2, 3]

// Already flat lists remain unchanged
print([1, 2, 3].flat())  // [1, 2, 3]
```

---

### List:map()

```tea
function List:map(transform)
```

The `map` method creates a new list by applying a transformation function to each element of the original list.

#### Arguments
- `transform`: A function that takes an element and returns a new value.

#### Returns
The method returns a new list containing the transformed elements.

#### Example
```tea
var numbers = [1, 2, 3, 4]
var squares = numbers.map(function(n) {
    return n * n
})
print(squares)  // [1, 4, 9, 16]

// Converting temperatures
var celsius = [0, 20, 37, 100]
var fahrenheit = celsius.map(function(c) {
    return c * 9 / 5 + 32
})
print(fahrenheit)  // [32, 68, 98.6, 212]

// Extracting a field from objects
var people = [
    {name: "Alice", age: 30},
    {name: "Bob", age: 25}
]
var names = people.map(function(p) { return p.name })
print(names)  // ["Alice", "Bob"]
```

---

### List:filter()

```tea
function List:filter(predicate)
```

The `filter` method creates a new list containing only the elements for which the predicate function returns `true`.

#### Arguments
- `predicate`: A function that takes an element and returns a boolean.

#### Returns
The method returns a new list with the elements that passed the test.

#### Example
```tea
var numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
var evens = numbers.filter(function(n) {
    return n % 2 == 0
})
print(evens)  // [2, 4, 6, 8, 10]

// Filtering objects
var products = [
    {name: "Laptop", price: 999, inStock: true},
    {name: "Phone", price: 699, inStock: false},
    {name: "Tablet", price: 499, inStock: true}
]
var available = products.filter(function(p) {
    return p.inStock
})
print(available.len)  // 2
```

---

### List:reduce()

```tea
function List:reduce(accumulator)
```

The `reduce` method applies a function against an accumulator and each element of the list (from left to right) to reduce it to a single value. The first element of the list is used as the initial accumulator value.

#### Arguments
- `accumulator`: A function that takes the accumulator and the current element, and returns the new accumulator value.

#### Returns
The method returns the final accumulated value.

#### Example
```tea
var numbers = [1, 2, 3, 4, 5]
var sum = numbers.reduce(function(acc, n) {
    return acc + n
})
print(sum)  // 15

// Finding the maximum value
var values = [3, 7, 2, 9, 4]
var max = values.reduce(function(acc, n) {
    if n > acc { return n }
    return acc
})
print(max)  // 9

// Building a sentence
var words = ["Tea", "is", "delicious"]
var sentence = words.reduce(function(acc, w) {
    return acc + " " + w
})
print(sentence)  // "Tea is delicious"

// Reducing an empty list returns nil
print([].reduce(function(a, b) { return a + b }))  // nil
```

---

### List:foreach()

```tea
function List:foreach(action)
```

The `foreach` method executes a provided function once for each list element.

#### Arguments
- `action`: A function to execute for each element.

#### Example
```tea
var fruits = ["apple", "banana", "cherry"]
fruits.foreach(function(fruit) {
    print("I like " + fruit)
})
// Output:
// I like apple
// I like banana
// I like cherry

// Summing with side effects
var total = 0
[10, 20, 30].foreach(function(n) {
    total = total + n
})
print(total)  // 60
```

---

### List:iter()

```tea
function List:iter()
```

The `iter` method returns an iterator function that can be used to traverse the list. Each call to the iterator returns the next element in the list, or `nil` when the iteration is complete.

#### Arguments
The method takes no arguments.

#### Example
```tea
var colors = ["red", "green", "blue"]
var iter = colors.iter()

print(iter())  // "red"
print(iter())  // "green"
print(iter())  // "blue"
print(iter())  // nil

// Using iter in a while loop
var it = [1, 2, 3].iter()
var value = it()
while value != nil {
    print(value)
    value = it()
}
// Output: 1 2 3
```

---

## Operators

### List:+()

```tea
function List:+(other)
```

The `+` operator creates a new list by concatenating two lists together.

#### Arguments
- `other`: The list to append to the original.

#### Returns
The method returns a new list containing all elements from both lists.

#### Example
```tea
var a = [1, 2, 3]
var b = [4, 5, 6]
var c = a + b
print(c)  // [1, 2, 3, 4, 5, 6]

// Original lists are unchanged
print(a)  // [1, 2, 3]
print(b)  // [4, 5, 6]

// Chaining concatenations
var combined = [1] + [2] + [3] + [4]
print(combined)  // [1, 2, 3, 4]

// Concatenating with empty lists
print([1, 2] + [])  // [1, 2]
print([] + [3, 4])  // [3, 4]
```
