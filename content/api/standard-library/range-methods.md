---
title: Range Methods
number: 6.
weight: 600
---

The `Range` type represents a sequence of numbers, starting from a start value, up to an end value, using a specified step interval. It is commonly used to iterate over a sequence of numbers in a loop.

---

## Attributes

### Range:start

The attribute `start` allows to receive the start value of a Tea range.

#### Example
```tea
const r = 1..10..2
print(r.start)  // 1
```

---

### Range:end

The attribute `end` allows to receive the end value of a Tea range.

#### Example
```tea
const r = 1..10..2
print(r.end)  // 10
```

---

### Range:step

The attribute `step` allows to receive the step value of a Tea range.

#### Example
```tea
const r = 1..10..2
print(r.step)  // 2
```

---

### Range:len

The attribute `len` allows to receive the number of elements in a Tea range.

#### Example
```tea
const r = 1..10..2
print(r.len)  // 4.5
```

---

## Methods

### Range:new()

```tea
function Range:new(start, end, step=1)
```

The `new` method creates a new Tea range.

#### Arguments
- `start`: The starting value of the range.
- `end`: The ending value of the range.
- `step`: An optional number that specifies the increment between each value in the range. If `step` is not specified, the default value is `1`.

#### Example
```tea
var r = 1..10
print(r.start)  // 1
print(r.end)    // 10
print(r.step)   // 1
```

---

### Range:contains()

```tea
function Range:contains(number)
```

The `contains` method checks whether the specified number is found within the original range.

#### Arguments
- `number`: The number to search for within the original range.

#### Returns
The method returns `true` if the `number` is found within the original range, or `false` otherwise.

#### Example
```tea
var r = 1..10..2
var result = r.contains(3)
print(result)  // true

result = r.contains(4)
print(result)  // false
```

---

### Range:reverse()

```tea
function Range:reverse()
```

The `reverse` method reverses the original range in place.

#### Arguments
The method takes no arguments.

#### Example
```tea
var r = 1..10..2
r.reverse()
print(r.start)  // 10
print(r.end)    // 1
print(r.step)   // -2
```

---

### Range:copy()

```tea
function Range:copy()
```

The `copy` method produces a new Tea range copy of the original range.

#### Arguments
The method takes no arguments.

#### Example
```tea
var r = 1..10..2
var r2 = r.copy()
print(r2.start)  // 1
print(r2.end)    // 10
print(r2.step)   // 2
```

---

### Range:iter()

```tea
function Range:iter()
```

The `iter` method produces an iterator for the original range.

#### Arguments
The method takes no arguments.

#### Example
```tea
var r = 1..5
for const value in r.iter()
{
    print(value)  // 1, 2, 3, 4
}
```
