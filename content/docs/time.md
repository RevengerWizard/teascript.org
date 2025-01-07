---
title: time
weight: 150
toc: true
---

The `time` module provides functions for working with time, including the ability to get the current time in seconds since the epoch and the current processor time in seconds.

---

## time.sleep

The `time.sleep` function sleeps for a specified number of seconds.

#### Syntax

```tea
time.sleep(seconds)
```

#### Parameters

-   `seconds`: The number of seconds to sleep.

#### Return Value

None.

#### Example

Here are some examples of how to use the `time.sleep` function:

```tea
import time

// Sleep for 2 seconds
time.sleep(2)

// Sleep for a fraction of a second
time.sleep(0.5)
```

---

## time.time

The `time.time` function returns the current time in seconds since the epoch (the beginning of the year 1970).

#### Syntax

```tea
time.time()
```

#### Return Value

The current time in seconds since the epoch.

#### Example

```tea
import time

// Get the current time in seconds
var current_time = time.time()
print(current_time)  // [current time in seconds]
```

---

## time.clock

The `time.clock` function returns the current processor time as a floating point number of seconds. The processor time is defined as the time spent executing instructions of the program.

#### Syntax

```tea
time.clock()
```

#### Return Value

The current processor time in seconds.

#### Example

```tea
import time

// Calculate the elapsed processor time between two points in time
var start_time = time.clock()

// Perform some operation here
var end_time = time.clock()
elapsed_time = end_time - start_time
print(elapsed_time)
```