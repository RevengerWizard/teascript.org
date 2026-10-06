---
title: Random Module
number: 11.
weight: 1100
---

The `random` module provides access to functions used to work with pseudo-random number generation.

---

## Functions

### random.seed()

```tea
function random.seed(x)
```

The function `seed` initializes the random number generator with a starting value. Using the same seed will produce the same sequence of random numbers.

#### Arguments
- `x`: A number used as the seed value

#### Example
```tea
import random

// Seed with a specific value for reproducible results
random.seed(42)
var a = random.random()
var b = random.random()

// Reset to the same seed
random.seed(42)
var c = random.random()
var d = random.random()

print(a == c)  // true
print(b == d)  // true

// Seed with current time for different results each run
random.seed(12345)
print("Random value:", random.random())
```

---

### random.random()

```tea
function random.random()
```

The function `random` provides a random floating-point number between 0 (inclusive) and 1 (exclusive).

#### Arguments
None

#### Example
```tea
import random

// Generate a random decimal
var value = random.random()
print("Random value:", value)  // e.g. 0.723456789

// Generate multiple random values
for const i in 0..5
{
    print(random.random())
}

// Scale to a custom range
var percentage = random.random() * 100
print("Random percentage:", percentage)
```

---

### random.bool()

```tea
function random.bool()
```

The function `bool` provides a random boolean value, either `true` or `false`, with equal probability.

#### Arguments
None

#### Example
```tea
import random

// Flip a coin
var coin = random.bool()
print("Heads or tails:", coin)

// Simulate a series of coin flips
var heads = 0
var tails = 0
for const i in 0..100
{
    if random.bool()
    {
        heads += 1
    }
    else
    {
        tails += 1
    }
}
print("Heads: " + heads + ", Tails: " + tails)

// Random decision
if random.bool()
{
    print("Taking the left path")
}
else
{
    print("Taking the right path")
}
```

---

### random.int()

```tea
function random.int(a, b)
```

The function `int` provides a random integer between `a` and `b`, inclusive.

#### Arguments
- `a`: The lower bound (inclusive)
- `b`: The upper bound (inclusive)

#### Returns
A random integer in the range `[a, b]`

#### Example
```tea
import random

// Roll a six-sided die
var roll = random.int(1, 6)
print("You rolled:", roll)

// Generate a random index
var items = ["apple", "banana", "cherry", "date"]
var idx = random.int(0, len(items) - 1)
print("Selected:", items[idx])

// Random level generation
var level = random.int(1, 100)
print("Generated level:", level)

// Simulate dice rolls
for const i in 0..5
{
    print("Roll " + (i + 1) + ": " + random.int(1, 6))
}
```

---

### random.number()

```tea
function random.number(a, b)
```

The function `number` provides a random floating-point number between `a` and `b`.

#### Arguments
- `a`: The lower bound
- `b`: The upper bound

#### Returns
A random number in the range `[a, b)`

#### Example
```tea
import random

// Random temperature between 20.0 and 30.0
var temp = random.number(20.0, 30.0)
print("Temperature:", temp)

// Random position in a game world
var x = random.number(-100.0, 100.0)
var y = random.number(-100.0, 100.0)
print("Spawn position: " + x + " " + y)

// Random probability
var chance = random.number(0.0, 1.0)
if chance < 0.25
{
    print("Rare event triggered!")
}

// Random damage calculation
var damage = random.number(10.0, 20.0)
print("Damage dealt:", damage)
```

---

### random.range()

```tea
function random.range(iter)
function random.range(start, end)
function random.range(start, end, step)
```

The function `range` provides a random number from a specified range, honoring the range's step value.

#### Arguments
- `iter`: A range, or the upper bound when used with a single numeric argument
- `start`: The start of the range (inclusive)
- `end`: The end of the range (exclusive)
- `step`: The step between values (default 1)

#### Example
```tea
import random

// Random value from a range
print(random.range(0..10))

// Random value from a range with a step
print(random.range(0..100..10))

// Single numeric argument
print(random.range(50))

// Two numeric arguments
print(random.range(10, 20))

// Three numeric arguments
print(random.range(0, 100, 5))

// Random even number between 0 and 20
print(random.range(0, 20, 2))

// Random multiple of 25 between 0 and 200
print(random.range(0, 200, 25))
```

---

### random.choice()

```tea
function random.choice(list)
```

The function `choice` provides a random element from a given list.

#### Arguments
- `list`: The list from which to choose an element

#### Returns
A randomly selected element from the list

#### Example
```tea
import random

// Pick a random color
var colors = ["red", "green", "blue", "yellow"]
print("Selected color:", random.choice(colors))

// Pick a random card
var deck = ["Ace", "King", "Queen", "Jack", "10", "9", "8"]
print("Drawn card:", random.choice(deck))

// Random reward from a loot table
var loot = ["gold", "silver", "gem", "potion", "scroll"]
print("You found:", random.choice(loot))

// Random enemy encounter
var enemies = ["goblin", "orc", "troll", "dragon"]
var enemy = random.choice(enemies)
print("A wild " + enemy + " appears!")
```

---

### random.shuffle()

```tea
function random.shuffle(list)
```

The function `shuffle` randomly reorders the elements of a list in place.

#### Arguments
- `list`: The list to shuffle

#### Example
```tea
import random

// Shuffle a deck of cards
var deck = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
random.shuffle(deck)
print("Shuffled deck:", deck)

// Randomize player order
var players = ["Alice", "Bob", "Charlie", "Diana"]
random.shuffle(players)
print("Turn order:", players)

// Shuffle quiz answers
var answers = ["A", "B", "C", "D"]
random.shuffle(answers)
print("Answer order:", answers)

// Note: A list with fewer than two elements is left unchanged
var single = [42]
random.shuffle(single)
print("Single element list:", single)  // [42]
```
