---
title: OS Module
number: 9.
weight: 900
---

The `os` module provides functions and values for interacting with the operating system.

---

## Attributes

### os.name

```tea
os.name
```

The basic name of the operating system Teascript is being ran on.

The currently available name strings are:
- `windows`
- `linux`
- `osx`
- `bsd`
- `posix`
- `browser`
- `other`

#### Example
```tea
import os

print("Operating system:", os.name)
```

---

### os.arch

```tea
os.arch
```

The architecture of the operating system Teascript is being ran on.

The currently available name strings are:
- `x86`
- `x64`
- `arm`
- `arm64`
- `wasm`

#### Example
```tea
import os

print("Architecture:", os.arch)
```

---

### os.env

```tea
os.env
```

A map containing all environment variables and their values.

#### Example
```tea
import os

// Access a specific environment variable
print("Home directory:", os.env["HOME"])

// Iterate over all environment variables
for const key, value in os.env
{
    print(key + " = " + value)
}
```

---

## Functions

### os.getenv()

```tea
function os.getenv(name, def=nil)
```

The function `getenv` retrieves the value of an environment variable.

#### Arguments
- `name`: The name of the environment variable
- `default`: (Optional) The value to use if the environment variable does not exist

#### Example
```tea
import os

// Get an environment variable
var path = os.getenv("PATH")
print("PATH:", path)

// Get with a default value
var config = os.getenv("APP_CONFIG", "default.json")
print("Config:", config)
```

---

### os.setenv()

```tea
function os.setenv(name, value)
```

The function `setenv` sets or unsets an environment variable.

#### Arguments
- `name`: The name of the environment variable
- `value`: The value to set, or `nil` to unset the variable

#### Example
```tea
import os

// Set an environment variable
os.setenv("MY_VAR", "hello")
print(os.getenv("MY_VAR"))  // hello

// Unset an environment variable
os.setenv("MY_VAR", nil)
print(os.getenv("MY_VAR"))  // nil
```

---

### os.execute()

```tea
function os.execute(command)
```

The function `execute` runs a shell command.

#### Arguments
- `command`: The command to execute

#### Example
```tea
import os

// Execute a shell command
var status = os.execute("ls -la")
print("Command exited with status:", status)
```

---

### os.remove()

```tea
function os.remove(filename)
```

The function `remove` deletes a file.

#### Arguments
- `filename`: The path to the file to delete

#### Example
```tea
import os

// Remove a file
var success = os.remove("temp.txt")
if success
{
    print("File deleted successfully")
}
else
{
    print("Failed to delete file")
}
```

---

### os.rename()

```tea
function os.rename(fromname, toname)
```

The function `rename` renames or moves a file.

#### Arguments
- `fromname`: The current path of the file
- `toname`: The new path of the file

#### Example
```tea
import os

// Rename a file
var success = os.rename("old.txt", "new.txt")
if success
{
    print("File renamed successfully")
}
else
{
    print("Failed to rename file")
}
```

---

### os.mkdir()

```tea
function os.mkdir(dir)
```

The function `mkdir` creates a new directory.

#### Arguments
- `dir`: The path of the directory to create

#### Example
```tea
import os

// Create a new directory
os.mkdir("new_folder")
print("Directory created")
```
