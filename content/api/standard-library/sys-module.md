---
title: Sys Module
number: 12.
weight: 1200
---

The `sys` module provides access to system-specific parameters and functions.

---

## Attributes

### sys.bits

```tea
sys.bits
```

The number of bits in a Teascript integer, either 32 or 64 depending on the architecture.

#### Example
```tea
import sys

// Check architecture word size
print("Word size: " + sys.bits + " bits")

// Use for bitwise operations
if sys.bits == 64
{
    print("Running on 64-bit architecture")
    var large_number = 1 << 40
    print("Large number:", large_number)
}
else
{
    print("Running on 32-bit architecture")
}
```

---

### sys.byteorder

```tea
sys.byteorder
```

A string representing the byte order of the system, either "little" or "big".

#### Example
```tea
import sys

// Check system byte order
print("Byte order: " + sys.byteorder)

// Handle binary data appropriately
if sys.byteorder == "little"
{
    print("Little-endian system")
}
else
{
    print("Big-endian system")
}

// Practical example: network byte order conversion
var is_little_endian = sys.byteorder == "little"
print("Needs byte swapping for network: " + is_little_endian)
```

---

### sys.argv

```tea
sys.argv
```

A list of command-line arguments passed to the Teascript program.

#### Example
```tea
import sys

// Print all arguments
print("Arguments:")
for const arg in sys.argv
{
    print("  " + arg)
}

// Check for specific flags
var verbose = false
for const arg in sys.argv
{
    if arg == "--verbose" or arg == "-v"
    {
        verbose = true
    }
}

if verbose
{
    print("Verbose mode enabled")
}

// Access specific arguments
if sys.argv.length > 0
{
    print("First argument: " + sys.argv[0])
}
```

---

### sys.version

```tea
sys.version
```

A map containing the version information of the Teascript interpreter.

#### Attributes
- `major`: The major version number
- `minor`: The minor version number
- `patch`: The patch version number

#### Example
```tea
import sys

// Display version information
print("Teascript version: " + sys.version.major + "." + sys.version.minor + "." + sys.version.patch)

// Check for minimum version
var required_major = 1
var required_minor = 0

if sys.version.major > required_major or (sys.version.major == required_major and sys.version.minor >= required_minor)
{
    print("Version requirement satisfied")
}
else
{
    print("Please upgrade Teascript")
}

// Feature detection based on version
if sys.version.major >= 2
{
    print("Using modern features")
}
```

---

### sys.loaders

```tea
sys.loaders
```

A list of module loaders available to the Teascript runtime.

#### Example
```tea
import sys

// Display available loaders
print("Available loaders:")
for const loader in sys.loaders
{
    print("  " + loader)
}

// Check loader availability
var has_custom_loader = false
for const loader in sys.loaders
{
    if loader == "custom"
    {
        has_custom_loader = true
    }
}

if has_custom_loader
{
    print("Custom loader is available")
}
```

---

## Functions

### sys.exit()

```tea
function sys.exit(status)
```

The function `exit` terminates the program with the given status.

#### Arguments
- `status`: An optional boolean or integer exit status. If `true` or omitted, exits with success (0). If `false`, exits with failure (1). If an integer, uses that as the exit code.

#### Example
```tea
import sys

// Exit with success
if condition_met
{
    sys.exit(true)
}

// Exit with failure
if error_occurred
{
    sys.exit(false)
}

// Exit with specific code
if critical_error
{
    sys.exit(42)
}

// Default success exit
sys.exit()
```
