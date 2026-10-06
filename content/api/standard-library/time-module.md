---
title: Time Module
number: 12.
weight: 1202
---

The `time` module provides functions to interact with time.

---

## Functions

### time.sleep()

```tea
function time.sleep(stop)
```

The function `sleep` suspends the execution of the program for a specified number of seconds.

#### Arguments
- `stop`: The number of seconds to sleep. This can be a floating-point value for sub-second precision.

#### Example
```tea
import time

// Sleep for 2 seconds
print("Starting...")
time.sleep(2)
print("Done!")

// Sleep for half a second (500 milliseconds)
time.sleep(0.5)

// Practical example: rate limiting
for const i in 1..6
{
    print("Request " + i)
    time.sleep(1)  // Wait 1 second between requests
}

// Practical example: animation delay
var frames = ["|", "/", "-", "\\"]
for const frame in frames
{
    print(frame)
    time.sleep(0.1)
}
```

---

### time.clock()

```tea
function time.clock()
```

The function `clock` provides the amount of processor time used by the program since it started, in seconds.

#### Arguments
None.

#### Example
```tea
import time

// Measure execution time of a computation
var start = time.clock()
var sum = 0
for const i in 1..1000001
{
    sum += i
}
var elapsed = time.clock() - start
print("Sum:", sum)
print("Time taken:", elapsed, "seconds")

// Benchmark a function
function fibonacci(n)
{
    if n <= 1
    {
        return n
    }
    return fibonacci(n - 1) + fibonacci(n - 2)
}

var t0 = time.clock()
var result = fibonacci(25)
var t1 = time.clock()
print("fibonacci(25) =", result)
print("CPU time:", t1 - t0, "seconds")

// Compare algorithm performance
var t_start = time.clock()
var list = []
for const i in 0..100000
{
    list.add(i)
}
var t_end = time.clock()
print("Building list took:", t_end - t_start, "seconds")
```

---

### time.format()

```tea
function time.format(format, timestamp)
function time.format(format)
```

The function `format` converts a time value into a string according to a specified format.

#### Arguments
- `format`: A string describing the output format. Use `%` codes as in C's `strftime`. If the string starts with `!`, the time is formatted as UTC instead of local time. The special string `"*t"` produces a map with individual date/time fields.
- `timestamp`: (Optional) The time value to format, as returned by `time.time()`. If omitted, the current time is used.

#### Format Codes
The following conversion specifiers are supported:

| Code | Description | Example |
|------|-------------|---------|
| `%a` | Abbreviated weekday name | `Mon` |
| `%A` | Full weekday name | `Monday` |
| `%b` | Abbreviated month name | `Jan` |
| `%B` | Full month name | `January` |
| `%c` | Date and time representation | `Mon Jan  1 12:00:00 2024` |
| `%d` | Day of the month (01-31) | `01` |
| `%H` | Hour in 24-hour format (00-23) | `13` |
| `%I` | Hour in 12-hour format (01-12) | `01` |
| `%j` | Day of the year (001-366) | `001` |
| `%m` | Month (01-12) | `01` |
| `%M` | Minute (00-59) | `30` |
| `%p` | AM/PM designation | `PM` |
| `%S` | Second (00-59) | `45` |
| `%U` | Week number, Sunday first (00-53) | `01` |
| `%w` | Weekday as number (0-6, Sunday=0) | `1` |
| `%W` | Week number, Monday first (00-53) | `01` |
| `%x` | Date representation | `01/01/24` |
| `%X` | Time representation | `12:00:00` |
| `%y` | Year without century (00-99) | `24` |
| `%Y` | Year with century | `2024` |
| `%Z` | Timezone name | `UTC` |
| `%%` | Literal `%` character | `%` |

#### Example
```tea
import time

// Format current time
print(time.format("%Y-%m-%d %H:%M:%S"))  // 2024-01-15 14:30:45

// Format a specific timestamp
var timestamp = time.time()
print(time.format("%A, %B %d, %Y", timestamp))  // Monday, January 15, 2024

// UTC formatting (prefix with !)
print(time.format("!%Y-%m-%d %H:%M:%S"))  // 2024-01-15 14:30:45 (UTC)

// Get individual fields as a map
var t = time.format("*t")
print("Year:", t.year)
print("Month:", t.month)
print("Day:", t.day)
print("Hour:", t.hour)
print("Minute:", t.min)
print("Second:", t.sec)
print("Weekday:", t.wday)  // 1-7, Sunday=1
print("Yearday:", t.yday)  // 1-366

// Practical example: log timestamp
function log(message)
{
    var timestamp = time.format("%Y-%m-%d %H:%M:%S")
    print("[" + timestamp + "] " + message)
}

log("Application started")
time.sleep(1)
log("Processing data...")
time.sleep(1)
log("Done")

// ISO 8601 format
var iso = time.format("%Y-%m-%dT%H:%M:%S")
print("ISO 8601:", iso)

// Custom readable format
var readable = time.format("%B %d, %Y at %I:%M %p")
print(readable)  // January 15, 2024 at 02:30 PM

// Extract date components
var now = time.format("*t")
var date_string = now.year + "-" + now.month + "-" + now.day
print("Date:", date_string)

// Check daylight saving time
var t = time.format("*t")
if t.isdst
{
    print("Daylight saving time is active")
}
else
{
    print("Standard time")
}
```

---

### time.time()

```tea
function time.time()
function time.time(table)
```

The function `time` provides the current time or converts a date/time table into a timestamp.

#### Arguments
- `table`: (Optional) A map containing date and time fields. If omitted, the current time is returned.

The table may contain the following fields:
- `sec`: Seconds (0-59)
- `min`: Minutes (0-59)
- `hour`: Hour (0-23)
- `day`: Day of the month (1-31)
- `month`: Month (1-12)
- `year`: Full year (e.g., 2024)
- `isdst`: Daylight saving time flag (boolean)

#### Example
```tea
import time

// Get current Unix timestamp
var now = time.time()
print("Current timestamp:", now)

// Create timestamp from a table
var t = {
    year = 2024,
    month = 1,
    day = 15,
    hour = 14,
    min = 30,
    sec = 0
}
var timestamp = time.time(t)
print("Timestamp:", timestamp)

// Convert current time to a table and back
var current = time.format("*t")
var reconstructed = time.time(current)
print("Original:", time.time())
print("Reconstructed:", reconstructed)

// Practical example: schedule a future event
var event = {
    year = 2024,
    month = 12,
    day = 25,
    hour = 0,
    min = 0,
    sec = 0
}
var event_time = time.time(event)
var now = time.time()
var seconds_until = event_time - now
var days_until = math.floor(seconds_until / 86400)
print("Days until Christmas:", days_until)

// Measure elapsed time
var start = time.time()
time.sleep(2.5)
var elapsed = time.time() - start
print("Elapsed:", elapsed, "seconds")

// Create a date for a specific day
var birthday = {
    year = 1990,
    month = 6,
    day = 15,
    hour = 12,
    min = 0,
    sec = 0
}
var birthday_timestamp = time.time(birthday)
print("Birthday timestamp:", birthday_timestamp)

// Add time to current timestamp
var tomorrow = time.time() + 86400  // 24 hours in seconds
var tomorrow_date = time.format("%Y-%m-%d", tomorrow)
print("Tomorrow:", tomorrow_date)
```

---

### time.diff()

```tea
function time.diff(t2, t1)
```

The function `diff` provides the difference in seconds between two time values.

#### Arguments
- `t2`: The later time value.
- `t1`: (Optional) The earlier time value. Defaults to `0` if omitted.

#### Example
```tea
import time

// Basic difference between two timestamps
var t1 = time.time()
time.sleep(2)
var t2 = time.time()
print("Difference:", time.diff(t2, t1), "seconds")

// Difference from a specific timestamp to now
var past = time.time({year = 2024, month = 1, day = 1, hour = 0, min = 0, sec = 0})
var now = time.time()
var seconds_since = time.diff(now, past)
var days_since = seconds_since / 86400
print("Days since New Year:", math.floor(days_since))

// Compare two specific dates
var date1 = time.time({year = 2024, month = 1, day = 1})
var date2 = time.time({year = 2024, month = 12, day = 31})
var diff = time.diff(date2, date1)
print("Days between dates:", diff / 86400)

// Calculate age in days
var birth = time.time({year = 1990, month = 6, day = 15})
var today = time.time()
var age_seconds = time.diff(today, birth)
var age_days = math.floor(age_seconds / 86400)
var age_years = math.floor(age_days / 365.25)
print("Age:", age_years, "years")

// Time until an event
var event = time.time({year = 2024, month = 12, day = 25})
var now = time.time()
var remaining = time.diff(event, now)
if remaining > 0
{
    print("Event in", math.floor(remaining / 86400), "days")
}
else
{
    print("Event has passed")
}

// Benchmark with diff
var start = time.time()
var sum = 0
for const i in 1..1000001
{
    sum += i
}
var stop = time.time()
print("Computation took:", time.diff(stop, start), "seconds")
```
