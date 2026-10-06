---
title: Math Module
number: 10.
weight: 1000
---

The `math` module provides constants and functions useful when working with mathematical operations.

---

## Attributes

### math.pi

```tea
math.pi = 3.14159265358979323846
```

The mathematical constant π (pi), the ratio of a circle's circumference to its diameter.

#### Example
```tea
import math

// Calculate the area of a circle with radius 5
var radius = 5
var area = math.pi * radius * radius
print("Area of circle:", area)  // Area of circle: 78.53981633974483

// Convert 180 degrees to radians
var radians = 180 * (math.pi / 180)
print("180 degrees in radians:", radians)  // 180 degrees in radians: 3.141592653589793
```

---

### math.tau

```tea
math.tau = 6.28318530717958647692
```

The mathematical constant τ (tau), equal to 2π. Represents one full turn in radians.

#### Example
```tea
import math

// A full circle is tau radians
print("Full circle: " + math.tau + " radians")  // Full circle: 6.283185307179586 radians

// Calculate the circumference of a circle with radius 3
var circumference = math.tau * 3
print("Circumference:", circumference)  // Circumference: 18.84955592153876
```

---

### math.e

```tea
math.e = 2.71828182845904523536
```

The mathematical constant e, the base of natural logarithms.

#### Example
```tea
import math

// Continuous compound interest formula: A = P * e^(rt)
var principal = 1000
var rate = 0.05
var time = 10
var amount = principal * math.e ** (rate * time)
print("Investment after 10 years:", amount)  // Investment after 10 years: 1648.7212707001282
```

---

### math.phi

```tea
math.phi = 1.61803398874989484820
```

The golden ratio φ (phi), approximately 1.618033988749895.

#### Example
```tea
import math

// Generate a golden spiral
var a = 1
var b = 1
for i in range(10) {
    var next = a + b
    a = b
    b = next
    print("Ratio: " + (b / a) + " vs phi: " + math.phi)
}

// Output shows convergence toward phi:
// Ratio: 2 vs phi: 1.618033988749895
// Ratio: 1.5 vs phi: 1.618033988749895
// Ratio: 1.6666666666666667 vs phi: 1.618033988749895
// Ratio: 1.6 vs phi: 1.618033988749895
// ...
```

---

### math.infinity

```tea
math.infinity
```

Represents positive infinity. This is a special floating-point value that is greater than any finite number.

#### Example
```tea
import math

// Division by zero results in infinity
var result = 1 / 0
print("1/0 = " + result)  // 1/0 = inf

// Check if a value is infinite
print("Is infinity? " + math.isinfinity(result))  // Is infinity? true

// Infinity propagates through calculations
print("Infinity + 100 = " + (math.infinity + 100))  // Infinity + 100 = inf
print("Infinity * 2 = " + (math.infinity * 2))      // Infinity * 2 = inf
```

---

### math.nan

```tea
math.nan
```

Represents "Not a Number", a special floating-point value resulting from undefined operations.

#### Example
```tea
import math

// Certain operations produce NaN
var result = 0 / 0
print("0/0 = " + result)  // 0/0 = nan

// Check if a value is NaN
print("Is NaN? " + math.isnan(result))  // Is NaN? true

// NaN is not equal to itself
print("NaN == NaN: " + (math.nan == math.nan))  // NaN == NaN: false

// NaN propagates through calculations
print("NaN + 5 = " + (math.nan + 5))  // NaN + 5 = nan
```

---

### math.maxinteger

```tea
math.maxinteger
```

The maximum value that can be represented as a Teascript integer.

#### Value
The largest representable integer

#### Example
```tea
import math

print("Max integer:", math.maxinteger)

// Demonstrating overflow behavior
var max = math.maxinteger
print("Max + 1 = " + (max + 1))  // May wrap or convert to float depending on implementation

// Safe increment check
if max < math.maxinteger {
    print("Safe to increment")
} else {
    print("At maximum integer value")
}
```

---

### math.mininteger

```tea
math.mininteger
```

The minimum value that can be represented as a Teascript integer.

#### Value
The smallest representable integer

#### Example
```tea
import math

print("Min integer:", math.mininteger)

// Range of representable integers
var range_size = math.maxinteger - math.mininteger + 1
print("Number of representable integers:", range_size)

// Check for underflow
var min = math.mininteger
if min > math.mininteger {
    print("Safe to decrement")
} else {
    print("At minimum integer value")
}
```

---

## Functions

### math.min()

```tea
function math.min(...)
function math.min(iter)
```

The function `min` provides the smallest value among its given arguments.

#### Arguments
- `...`: Two or more numbers, or a single list of numbers

#### Returns
The minimum value

#### Example
```tea
import math

// Find minimum among multiple arguments
print(math.min(5, 2, 8, 1, 9))  // 1

// Find minimum in a list
var temperatures = [72, 68, 75, 65, 80, 63]
print("Lowest temperature:", math.min(temperatures))  // 63

// Practical example: find the coldest day
var weekly_temps = [72, 68, 75, 65, 80, 63, 70]
var coldest = math.min(weekly_temps)
print("Coldest day was " + coldest + " degrees")  // Coldest day was 63 degrees

// Compare player scores
var player1_score = 1500
var player2_score = 2300
var player3_score = 1800
print("Lowest score:", math.min(player1_score, player2_score, player3_score))  // 1500
```

---

### math.max()

```tea
function math.max(...)
function math.max(iter)
```

The function `max` provides the largest value among its arguments.

#### Arguments
- `...`: Two or more numbers, or a single list of numbers

#### Returns
The maximum value

#### Example
```tea
import math

// Find maximum among multiple arguments
print(math.max(5, 2, 8, 1, 9))  // 9

// Find maximum in a list
var high_scores = [1200, 3400, 2800, 4100, 3900]
print("High score:", math.max(high_scores))  // 4100

// Practical example: find the hottest day
var weekly_temps = [72, 68, 75, 65, 80, 63, 70]
var hottest = math.max(weekly_temps)
print("Hottest day was " + hottest + " degrees")  // Hottest day was 80 degrees

// Compare player scores
var player1_score = 1500
var player2_score = 2300
var player3_score = 1800
print("Highest score:", math.max(player1_score, player2_score, player3_score))  // 2300
```

---

### math.mid()

```tea
function math.mid(x, y, z)
```

The function `mid` provides the middle value among three numbers.

#### Arguments
- `x`: The first number
- `y`: The second number
- `z`: The third number

#### Returns
The middle value

#### Example
```tea
import math

// Basic usage
print(math.mid(1, 2, 3))   // 2
print(math.mid(3, 1, 2))   // 2
print(math.mid(2, 3, 1))   // 2

// Practical example: find the median price
var price_a = 45.99
var price_b = 32.50
var price_c = 67.25
print("Median price:", math.mid(price_a, price_b, price_c))  // 45.99

// Find the middle value in a sorted range
var low = 10
var high = 100
var value = 55
var middle = math.mid(low, value, high)
print("Middle value:", middle)  // 55

// Useful for clamping values to a range
var player_x = 150
var min_x = 0
var max_x = 100
var clamped_x = math.mid(min_x, player_x, max_x)
print("Clamped position:", clamped_x)  // 100
```

---

### math.clamp()

```tea
function math.clamp(d, min, max)
```

The function `clamp` restricts a numeric value to a specified range.

#### Arguments
- `d`: The value to clamp
- `min`: The minimum allowed value
- `max`: The maximum allowed value

#### Returns
The clamped value

#### Example
```tea
import math

// Basic clamping
print(math.clamp(5, 1, 10))    // 5
print(math.clamp(-5, 1, 10))   // 1
print(math.clamp(15, 1, 10))   // 10

// Practical example: limit player health
var health = 150
var max_health = 100
var min_health = 0
health = math.clamp(health, min_health, max_health)
print("Health after healing:", health)  // 100

// Damage calculation with clamping
var current_hp = 50
var damage = 75
var new_hp = math.clamp(current_hp - damage, 0, 100)
print("HP after damage:", new_hp)  // 0

// Clamp color values to valid range
var red = 300
var green = -50
var blue = 128
var r = math.clamp(red, 0, 255)     // 255
var g = math.clamp(green, 0, 255)   // 0
var b = math.clamp(blue, 0, 255)    // 128
print("RGB: " + r + " " + g + " " + b)  // RGB: 255 0 128
```

---

### math.floor()

```tea
function math.floor(x)
```

The function `floor` provides the largest integer less than or equal to a number.

#### Arguments
- `x`: A number

#### Returns
The floor of `x`

#### Example
```tea
import math

// Basic usage
print(math.floor(3.7))    // 3
print(math.floor(3.2))    // 3
print(math.floor(-3.2))   // -4
print(math.floor(-3.7))   // -4

// Practical example: convert to grid coordinates
var pixel_x = 157
var tile_size = 32
var tile_x = math.floor(pixel_x / tile_size)
print("Tile X coordinate:", tile_x)  // 4

// Calculate pages needed for pagination
var total_items = 47
var items_per_page = 10
var total_pages = math.floor(total_items / items_per_page) + 1
print("Pages needed:", total_pages)  // 5

// Convert seconds to minutes
var seconds = 185
var minutes = math.floor(seconds / 60)
var remaining = seconds % 60
print(minutes + " minutes and " + remaining + " seconds")  // 3 minutes and 5 seconds
```

---

### math.ceil()

```tea
function math.ceil(x)
```

The function `ceil` provides the smallest integer greater than or equal to a number.

#### Arguments
- `x`: A number

#### Returns
The ceiling of `x`

#### Example
```tea
import math

// Basic usage
print(math.ceil(3.2))    // 4
print(math.ceil(3.7))    // 4
print(math.ceil(-3.2))   // -3
print(math.ceil(-3.7))   // -3

// Practical example: calculate shipping boxes needed
var items = 47
var items_per_box = 10
var boxes_needed = math.ceil(items / items_per_box)
print("Boxes needed:", boxes_needed)  // 5

// Calculate minimum servers needed
var requests_per_second = 15000
var capacity_per_server = 2000
var servers = math.ceil(requests_per_second / capacity_per_server)
print("Servers needed:", servers)  // 8

// Calculate needed storage
var data_size_gb = 47.5
var disk_size_gb = 10
var disks = math.ceil(data_size_gb / disk_size_gb)
print("Disks needed:", disks)  // 5
```

---

### math.round()

```tea
function math.round(x)
```

The function `round` rounds `x` to the nearest integer.

#### Arguments
- `x`: A number

#### Returns
The rounded value

#### Example
```tea
import math

// Basic usage
print(math.round(3.4))    // 3
print(math.round(3.5))    // 4
print(math.round(3.6))    // 4
print(math.round(-3.5))   // -4

// Practical example: round prices
var price = 19.995
var rounded_price = math.round(price * 100) / 100
print("Rounded price:", rounded_price)  // 20.0

// Round game scores
var score = 1567.8
print("Rounded score:", math.round(score))  // 1568

// Round to specific decimal places
var pi_approx = math.pi
var rounded_pi = math.round(pi_approx * 1000) / 1000
print("Pi to 3 decimals:", rounded_pi)  // 3.142
```

---

### math.acos()

```tea
function math.acos(x)
```

The function `acos` provides the arc cosine of a number in radians.

#### Arguments
- `x`: A number between -1 and 1

#### Returns
The arc cosine in radians

#### Example
```tea
import math

// Basic usage
print(math.acos(1))      // 0
print(math.acos(0))      // 1.5707963267948966 (π/2)
print(math.acos(-1))     // 3.141592653589793 (π)

// Practical example: calculate angle from adjacent/hypotenuse
var adjacent = 3
var hypotenuse = 5
var angle = math.acos(adjacent / hypotenuse)
print("Angle:", math.deg(angle), "degrees")  // 53.13010235415598 degrees

// Find angle between two vectors (dot product method)
var dot_product = 0.5
var angle = math.acos(dot_product)
print("Angle between vectors:", math.deg(angle), "degrees")  // 60 degrees
```

---

### math.acosh()

```tea
function math.acosh(x)
```

The function `acosh` provides the inverse hyperbolic cosine of a number.

#### Arguments
- `x`: A number greater than or equal to 1

#### Returns
The inverse hyperbolic cosine

#### Example
```tea
import math

// Basic usage
print(math.acosh(1))      // 0
print(math.acosh(2))      // 1.3169578969248166

// Practical example: calculate cable length in a catenary curve
var height = 5
var distance = 10
var a = height
var length = 2 * a * math.acosh(distance / (2 * a))
print("Cable length:", length)
```

---

### math.cos()

```tea
function math.cos(x)
```

The function `cos` provides the cosine of a number, where the number is in radians.

#### Arguments
- `x`: An angle in radians

#### Returns
The cosine of `x`, between -1 and 1

#### Example
```tea
import math

// Basic usage
print(math.cos(0))           // 1
print(math.cos(math.pi))     // -1
print(math.cos(math.pi / 2)) // 0

// Practical example: circular motion
var angle = math.pi / 4
var radius = 10
var x = radius * math.cos(angle)
var y = radius * math.sin(angle)
print("Position: " + x + " " + y)  // 7.0710678118654755 7.0710678118654755

// Generate a cosine wave
for const i in 0..360..45
{
    var rad = math.rad(i)
    print("cos(" + i + "°) = " + tostring(math.cos(rad)))
}
```

---

### math.cosh()

```tea
function math.cosh(x)
```

The function `cosh` provides the hyperbolic cosine of a number.

#### Arguments
- `x`: A number

#### Returns
The hyperbolic cosine of `x`

#### Example
```tea
import math

// Basic usage
print(math.cosh(0))     // 1
print(math.cosh(1))     // 1.5430806348152437

// Practical example: catenary curve (hanging cable)
var a = 10
var x = 5
var y = a * math.cosh(x / a)
print("Cable height at x=5:", y)
```

---

### math.asin()

```tea
function math.asin(x)
```

The function `asin` provides the arc sine of a number in radians.

#### Arguments
- `x`: A number between -1 and 1

#### Returns
The arc sine in radians

#### Example
```tea
import math

// Basic usage
print(math.asin(0))      // 0
print(math.asin(1))      // 1.5707963267948966 (π/2)
print(math.asin(-1))     // -1.5707963267948966 (-π/2)

// Practical example: calculate angle from opposite/hypotenuse
var opposite = 4
var hypotenuse = 5
var angle = math.asin(opposite / hypotenuse)
print("Angle:", math.deg(angle), "degrees")  // 53.13010235415598 degrees

// Find launch angle for projectile
var vertical_velocity = 20
var total_velocity = 25
var angle = math.asin(vertical_velocity / total_velocity)
print("Launch angle:", math.deg(angle), "degrees")  // 53.13010235415598 degrees
```

---

### math.asinh()

```tea
function math.asinh(x)
```

The function `asinh` provides the inverse hyperbolic sine of a number.

#### Arguments
- `x`: A number

#### Returns
The inverse hyperbolic sine

#### Example
```tea
import math

// Basic usage
print(math.asinh(0))     // 0
print(math.asinh(1))     // 0.881373587019543

// Practical example: signal processing
var value = 2.5
var result = math.asinh(value)
print("asinh(" + value + ") = " + result)
```

---

### math.sin()

```tea
function math.sin(x)
```

The function `sin` provides the sine of a number, where the number is in radians.

#### Arguments
- `x`: An angle in radians

#### Returns
The sine of `x`, between -1 and 1

#### Example
```tea
import math

// Basic usage
print(math.sin(0))           // 0
print(math.sin(math.pi / 2)) // 1
print(math.sin(math.pi))     // 0 (approximately)

// Practical example: generate a sine wave
for const i in 0..360..45
{
    var rad = math.rad(i)
    var bar = ""
    var value = math.sin(rad)
    var height = math.round((value + 1) * 10)
    for const j in 0..height
    {
        bar += "*"
    }
    print(i + "°: " + bar)
}

// Calculate vertical position in circular motion
var angle = math.pi / 6
var radius = 5
var y = radius * math.sin(angle)
print("Y position:", y)  // 2.5
```

---

### math.sinh()

```tea
function math.sinh(x)
```

The function `sinh` provides the hyperbolic sine of a number.

#### Arguments
- `x`: A number

#### Returns
The hyperbolic sine of `x`

#### Example
```tea
import math

// Basic usage
print(math.sinh(0))     // 0
print(math.sinh(1))     // 1.1752011936438014

// Practical example: hyperbolic functions
var x = 2
print("sinh(2) = " + math.sinh(x))
print("cosh(2) = " + math.cosh(x))
print("cosh² - sinh² = " + (math.cosh(x) ** 2 - math.sinh(x) ** 2))  // Should be 1
```

---

### math.atan()

```tea
function math.atan(x)
```

The function `atan` provides the arc tangent of a number in radians.

#### Arguments
- `x`: A number

#### Returns
The arc tangent in radians

#### Example
```tea
import math

// Basic usage
print(math.atan(0))      // 0
print(math.atan(1))      // 0.7853981633974483 (π/4)

// Practical example: calculate angle from opposite/adjacent
var opposite = 3
var adjacent = 4
var angle = math.atan(opposite / adjacent)
print("Angle:", math.deg(angle), "degrees")  // 36.86989764584402 degrees

// Slope to angle conversion
var slope = 0.5
var angle = math.atan(slope)
print("Slope angle:", math.deg(angle), "degrees")  // 26.56505117707799 degrees
```

---

### math.atanh()

```tea
function math.atanh(x)
```

The function `atanh` provides the inverse hyperbolic tangent of a number.

#### Arguments
- `x`: A number between -1 and 1

#### Returns
The inverse hyperbolic tangent

#### Example
```tea
import math

// Basic usage
print(math.atanh(0))     // 0
print(math.atanh(0.5))   // 0.5493061443340549

// Practical example: rapidity in special relativity
var velocity = 0.5  // fraction of speed of light
var rapidity = math.atanh(velocity)
print("Rapidity:", rapidity)
```

---

### math.atan2()

```tea
function math.atan2(y, x)
```

The function `atan2` provides the arc tangent of of two numbers representing the coordinates in radians, using the signs of both arguments to determine the correct quadrant.

#### Arguments
- `y`: The y-coordinate
- `x`: The x-coordinate

#### Returns
The angle in radians, in the range `[-π, π]`

#### Example
```tea
import math

// Basic usage
print(math.atan2(1, 1))    // 0.7853981633974483 (π/4)
print(math.atan2(1, -1))   // 2.356194490192345 (3π/4)
print(math.atan2(-1, -1))  // -2.356194490192345 (-3π/4)

// Practical example: calculate direction to target
var player_x = 5
var player_y = 5
var target_x = 10
var target_y = 8

var dx = target_x - player_x
var dy = target_y - player_y
var angle = math.atan2(dy, dx)
print("Direction to target:", math.deg(angle), "degrees")  // 30.96375653207352 degrees

// Convert Cartesian to polar coordinates
var x = 3
var y = 4
var r = math.sqrt(x * x + y * y)
var theta = math.atan2(y, x)
print("Polar coordinates: r=" + r + ", theta=" + math.deg(theta) + "°")
```

---

### math.tan()

```tea
function math.tan(x)
```

The function `tan` provides the tangent of a number, where the number is in radians.

#### Arguments
- `x`: An angle in radians

#### Returns
The tangent of `x`

#### Example
```tea
import math

// Basic usage
print(math.tan(0))           // 0
print(math.tan(math.pi / 4)) // 0.9999999999999999 (approximately 1)

// Practical example: calculate height using tangent
var distance = 100
var angle = math.rad(30)
var height = distance * math.tan(angle)
print("Height:", height)  // 57.73502691896258

// Calculate slope
var angle = math.rad(45)
var slope = math.tan(angle)
print("Slope at 45°:", slope)  // 0.9999999999999999
```

---

### math.tanh()

```tea
function math.tanh(x)
```

The function `tanh` provides the hyperbolic tangent of number.

#### Arguments
- `x`: A number

#### Returns
The hyperbolic tangent of `x`, between -1 and 1

#### Example
```tea
import math

// Basic usage
print(math.tanh(0))      // 0
print(math.tanh(1))      // 0.7615941559557649

// Practical example: activation function in neural networks
var input = 2.5
var output = math.tanh(input)
print("tanh(" + input + ") = " + output)

// Sigmoid-like behavior
for const i in -3..4
{
    print("tanh(" + i + ") = " + math.tanh(i))
}
```

---

### math.sign()

```tea
function math.sign(x)
```

The function `sign` provides the sign of a number.

#### Arguments
- `x`: A number

#### Returns
-1 if `x` is negative, 1 if `x` is positive, and 0 if `x` is zero

#### Example
```tea
import math

// Basic usage
print(math.sign(42))    // 1
print(math.sign(-42))   // -1
print(math.sign(0))     // 0

// Practical example: determine direction
var velocity = -15
var direction = math.sign(velocity)
if direction < 0
{
    print("Moving left")
}
else if direction > 0
{
    print("Moving right")
}
else
{
    print("Stationary")
}

// Compare two values
var a = 10
var b = 20
var comparison = math.sign(a - b)
print("Comparison:", comparison)  // -1 (a < b)
```

---

### math.abs()

```tea
function math.abs(x)
```

The function `abs` provides the absolute value of number.

#### Arguments
- `x`: A number

#### Returns
The absolute value of `x`

#### Example
```tea
import math

// Basic usage
print(math.abs(5))     // 5
print(math.abs(-5))    // 5
print(math.abs(0))     // 0

// Practical example: calculate distance
var x1 = 10
var x2 = 25
var distance = math.abs(x2 - x1)
print("Distance:", distance)  // 15

// Error margin check
var expected = 100
var actual = 95
var error = math.abs(expected - actual)
print("Error:", error)  // 5

// Temperature difference
var temp1 = -10
var temp2 = 15
var diff = math.abs(temp1 - temp2)
print("Temperature difference: " + diff + " degrees")  // 25 degrees
```

---

### math.sqrt()

```tea
function math.sqrt(x)
```

The function `sqrt` provides the square root of a number.

#### Arguments
- `x`: A non-negative number

#### Returns
The square root of `x`

#### Example
```tea
import math

// Basic usage
print(math.sqrt(16))    // 4
print(math.sqrt(25))    // 5
print(math.sqrt(2))     // 1.4142135623730951

// Practical example: calculate distance between points
var x1 = 0
var y1 = 0
var x2 = 3
var y2 = 4
var distance = math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
print("Distance:", distance)  // 5

// Calculate hypotenuse
var a = 6
var b = 8
var c = math.sqrt(a * a + b * b)
print("Hypotenuse:", c)  // 10

// Standard deviation calculation
var values = [2, 4, 4, 4, 5, 5, 7, 9]
var mean = 5
var sum_sq_diff = 0
for const v in values
{
    sum_sq_diff = sum_sq_diff + (v - mean) ** 2
}
var std_dev = math.sqrt(sum_sq_diff / values)
print("Standard deviation:", std_dev)  // 2.0
```

---

### math.deg()

```tea
function math.deg(x)
```

The function `deg` converts an angle from radians to degrees.

#### Arguments
- `x`: An angle in radians

#### Returns
The angle in degrees

#### Example
```tea
import math

// Basic usage
print(math.deg(math.pi))       // 180
print(math.deg(math.pi / 2))   // 90
print(math.deg(math.pi / 4))   // 45

// Practical example: display angles in degrees
var angles_rad = [0, math.pi/6, math.pi/4, math.pi/3, math.pi/2]
for const rad in angles_rad
{
    print(math.deg(rad) + " degrees")
}

// Convert rotation to degrees
var rotation_rad = 1.5
print("Rotation: " + math.deg(rotation_rad) + " degrees")  // 85.94366926962348 degrees
```

---

### math.rad()

```tea
function math.rad(x)
```

The function `rad` converts an angle from degrees to radians.

#### Arguments
- `x`: An angle in degrees

#### Returns
The angle in radians

#### Example
```tea
import math

// Basic usage
print(math.rad(180))    // 3.141592653589793
print(math.rad(90))     // 1.5707963267948966
print(math.rad(45))     // 0.7853981633974483

// Practical example: use degrees in trigonometric functions
var angle_deg = 30
var angle_rad = math.rad(angle_deg)
print("sin(30°) = " + math.sin(angle_rad))  // 0.49999999999999994

// Rotate a point
var x = 10
var y = 0
var rotation_deg = 45
var rotation_rad = math.rad(rotation_deg)
var new_x = x * math.cos(rotation_rad) - y * math.sin(rotation_rad)
var new_y = x * math.sin(rotation_rad) + y * math.cos(rotation_rad)
print("Rotated point: " + new_x + " " + new_y)  // 7.0710678118654755 7.0710678118654755
```

---

### math.exp()

```tea
function math.exp(x)
```

The function `exp` provides e raised to the power of a number.

#### Arguments
- `x`: A number

#### Returns
e^x

#### Example
```tea
import math

// Basic usage
print(math.exp(0))     // 1
print(math.exp(1))     // 2.718281828459045
print(math.exp(2))     // 7.38905609893065

// Practical example: exponential growth
var initial = 100
var rate = 0.05
for const year in 1..11
{
    var value = initial * math.exp(rate * year)
    print("Year " + year + ": $" + math.round(value * 100) / 100)
}

// Radioactive decay
var half_life = 5.0
var time = 10.0
var remaining = math.exp(-0.693 * time / half_life)
print("Remaining fraction:", remaining)  // 0.25 (approximately)
```

---

### math.trunc()

```tea
function math.trunc(x)
```

The function `trunc` provides the integer part of a number by removing the fractional part.

#### Arguments
- `x`: A number

#### Returns
The truncated value

#### Example
```tea
import math

// Basic usage
print(math.trunc(3.7))    // 3
print(math.trunc(3.2))    // 3
print(math.trunc(-3.7))   // -3
print(math.trunc(-3.2))   // -3

// Difference from floor
print("floor(-3.7) = " + math.floor(-3.7))  // -4
print("trunc(-3.7) = " + math.trunc(-3.7))  // -3

// Practical example: extract integer part
var price = 19.99
var dollars = math.trunc(price)
var cents = math.round((price - dollars) * 100)
print("$" + dollars + "." + cents)  // $19.99
```

---

### math.frexp()

```tea
function math.frexp(x)
```

The function `frexp` breaks a number into a normalized fraction and an exponent.

#### Arguments
- `x`: A number

#### Returns
A list `[exponent, mantissa]` such that `x = mantissa * 2^exponent`

#### Example
```tea
import math

// Basic usage
var result = math.frexp(8)
print("Exponent:", result[0])    // 4
print("Mantissa:", result[1])    // 0.5
// 8 = 0.5 * 2^4

// Practical example: analyze floating-point representation
var value = 123.456
var parts = math.frexp(value)
print(value + " = " + parts[1] + " * 2^" + parts[0])

// Reconstruct the original value
var reconstructed = parts[1] * (2 ** parts[0])
print("Reconstructed:", reconstructed)  // 123.456
```

---

### math.ldexp()

```tea
function math.ldexp(x, exp)
```

The function `ldexp` provides x * 2^exp. This is the inverse of `frexp`.

#### Arguments
- `x`: The mantissa
- `exp`: The exponent

#### Returns
x * 2^exp

#### Example
```tea
import math

// Basic usage
print(math.ldexp(0.5, 4))    // 8
print(math.ldexp(1, 10))     // 1024

// Practical example: reconstruct from frexp
var original = 123.456
var parts = math.frexp(original)
var reconstructed = math.ldexp(parts[1], parts[0])
print("Original:", original)
print("Reconstructed:", reconstructed)  // 123.456

// Power of 2 calculations
for const i in 0..11
{
    print("2^" + i + " = " + math.ldexp(1, i))
}
```

---

### math.log()

```tea
function math.log(x)
```

The function `log` provides the natural logarithm (base e) of a certain number.

#### Arguments
- `x`: A positive number

#### Returns
The natural logarithm of `x`

#### Example
```tea
import math

// Basic usage
print(math.log(1))      // 0
print(math.log(math.e)) // 1
print(math.log(10))     // 2.302585092994046

// Practical example: calculate time for growth
var initial = 100
var target = 200
var rate = 0.05
var time = math.log(target / initial) / rate
print("Time to double: " + time + " years")  // 13.862943611198906 years

// Richter scale calculation
var amplitude = 1000
var reference = 1
var magnitude = math.log(amplitude / reference) / math.log(10)
print("Magnitude:", magnitude)  // 3.0

// Information entropy
var probability = 0.25
var information = -math.log(probability) / math.log(2)
print("Information content: " + information + " bits")  // 2.0 bits
```

---

### math.log1p()

```tea
function math.log1p(x)
```

The function `log1p` provides the natural logarithm of 1 + x. This is more accurate than `math.log(1 + x)`, when `x` is close to zero.

#### Arguments
- `x`: A number greater than -1

#### Returns
The natural logarithm of `1 + x`

#### Example
```tea
import math

// Basic usage
print(math.log1p(0))     // 0
print(math.log1p(1))     // 0.6931471805599453

// More accurate for small values
var x = 1e-10
print("log(1 + x): " + math.log(1 + x))    // May lose precision
print("log1p(x): " + math.log1p(x))        // More accurate

// Practical example: compound interest
var rate = 0.05
var periods = 1
var effective_rate = math.log1p(rate)
print("Effective continuous rate:", effective_rate)
```

---

### math.log2()

```tea
function math.log2(x)
```

The function `log2` provides the base-2 logarithm of a certain number.

#### Arguments
- `x`: A positive number

#### Returns
The base-2 logarithm of `x`

#### Example
```tea
import math

// Basic usage
print(math.log2(1))     // 0
print(math.log2(2))     // 1
print(math.log2(8))     // 3
print(math.log2(1024))  // 10

// Practical example: calculate bits needed
var values = 1000
var bits = math.ceil(math.log2(values))
print("Bits needed:", bits)  // 10

// Binary tree depth
var nodes = 100
var depth = math.ceil(math.log2(nodes + 1))
print("Tree depth:", depth)  // 7

// Data compression ratio
var original_size = 1024
var compressed_size = 128
var ratio = math.log2(original_size / compressed_size)
print("Compression ratio (log2):", ratio)  // 3.0
```

---

### math.log10()

```tea
function math.log10(x)
```

The function `log10` provides the base-10 logarithm of a certain number.

#### Arguments
- `x`: A positive number

#### Returns
The base-10 logarithm of `x`

#### Example
```tea
import math

// Basic usage
print(math.log10(1))      // 0
print(math.log10(10))     // 1
print(math.log10(100))    // 2
print(math.log10(1000))   // 3

// Practical example: calculate order of magnitude
var value = 5000
var magnitude = math.floor(math.log10(value))
print("Order of magnitude:", magnitude)  // 3 (thousands)

// Decibel calculation
var power_ratio = 100
var decibels = 10 * math.log10(power_ratio)
print("Decibels:", decibels)  // 20

// pH calculation
var hydrogen_concentration = 0.001
var pH = -math.log10(hydrogen_concentration)
print("pH:", pH)  // 3.0
```

---

### math.classify()

```tea
function math.classify(x)
```

The function `classify` classifies a floating-point value into one of five categories.

#### Arguments
- `x`: A number

#### Returns
A string: "infinity", "nan", "normal", "subnormal", or "zero"

#### Example
```tea
import math

// Basic usage
print(math.classify(1.0))        // "normal"
print(math.classify(0.0))        // "zero"
print(math.classify(math.infinity))  // "infinity"
print(math.classify(math.nan))   // "nan"

// Practical example: validate numeric input
var values = [1.0, 0.0, -0.0, 1/0, -1/0, 0/0, 1e-320]
for const v in values
{
    print(v + ": " + math.classify(v))
}

// Check for valid numbers
var input = 42.5
var category = math.classify(input)
if category == "normal"
{
    print("Valid number")
}
else
{
    print("Invalid or special number: " + category)
}
```

---

### math.isinfinity()

```tea
function math.isinfinity(x)
```

The function `isinfinity` checks if `x` is positive or negative infinity.

#### Arguments
- `x`: A number

#### Returns
`true` if `x` is infinite, `false` otherwise

#### Example
```tea
import math

// Basic usage
print(math.isinfinity(1.0))          // false
print(math.isinfinity(math.infinity)) // true
print(math.isinfinity(-math.infinity)) // true
print(math.isinfinity(math.nan))     // false

// Practical example: check for overflow
var result = math.exp(1000)
if math.isinfinity(result)
{
    print("Overflow detected!")
}
else
{
    print("Result:", result)
}

// Safe division
var numerator = 10
var denominator = 0
var result = numerator / denominator
if math.isinfinity(result)
{
    print("Cannot divide by zero")
}
else
{
    print("Result:", result)
}
```

---

### math.isnan()

```tea
function math.isnan(x)
```

The function `isnan` checks if `x` is NaN (Not a Number).

#### Arguments
- `x`: A number

#### Returns
`true` if `x` is NaN, `false` otherwise.

#### Example
```tea
import math

// Basic usage
print(math.isnan(1.0))       // false
print(math.isnan(math.nan))  // true
print(math.isnan(0/0))       // true
print(math.isnan(math.infinity))  // false

// Practical example: validate calculation results
var result = math.sqrt(-1)
if math.isnan(result)
{
    print("Invalid operation: square root of negative number")
}
else
{
    print("Result:", result)
}

// Safe data processing
var data = [1, 2, 0/0, 4, 5]
var sum = 0
var count = 0
for const value in data
{
    if not math.isnan(value)
    {
        sum += value
        count += 1
    }
}
var average = sum / count
print("Average (excluding NaN):", average)  // 3.0
```
