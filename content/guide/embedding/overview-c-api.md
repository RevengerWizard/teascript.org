---
title: Overview of the C API
number: 10.
weight: 3100
---

While Teascript is a _scripting_ language, the language has been designed from the ground up to also live inside other applications. We call this process _embedding_.

When you embed Teascript, you are in full control. You decide which functions and modules are registered, which C functions are exposed to scripts, and what the language is even allowed to do. A game engine might expose a rich set of scene and entity APIs while leaving out much of the standard library — modules like `io` and `os` that have no place in a sandboxed environment. A configuration system might load only a minimal subset of the language. The interpreter does nothing you have not explicitly told it to do.

The entire relationship between a host application and the Teascript interpreter is mediated through the C API: a collection of C functions, macros, and conventions that let you create interpreter states, load and execute scripts, call Tea functions from C, register C functions that scripts can call, and inspect or manipulate any value the interpreter holds.

The API is intentionally low-level. It gives you direct, explicit control over what the interpreter is doing. If you have embedded Lua before, the design will feel immediately familiar. Teascript's C API follows a stack-based model. All communication between C and Teascript goes through a virtual stack: to pass a value to a Teascript function you push it, and to read a value the interpreter returned you query it by its position in the stack. This keeps the API simple and uniform, and it addresses two fundamental impedance mismatches between C and Teascript. The first is memory management: Teascript is garbage collected, while C requires explicit allocation and deallocation. The second is typing: Teascript is dynamically typed, while C is statically typed. The stack mediates both.

The header that exposes the C API is `tea.h`. Everything you need for normal embedding is declared there. A companion header, `teaconf.h`, holds build-time configuration and is included by `tea.h` automatically.

## A First Example

The simplest meaningful use of the C API is opening an interpreter state, running a script, and cleaning up. Here is what that looks like:

```c
#include <stdlib.h>
#include <stdio.h>

#include <tea.h>

int main(int argc, char** argv)
{
    tea_State* T = tea_open();
    tea_set_argv(T, argc, argv, 0);

    if(tea_dofile(T, "hello.tea"))
    {
        const char* err = tea_to_string(T, -1);
        fputs(err, stderr);
        fputc('\n', stderr);
        tea_pop(T, 1);
    }
    tea_pop(T, 1);

    tea_close(T);

    return EXIT_SUCCESS;
}
```

Every API call takes a pointer to a `tea_State` as its first argument. The state is an opaque structure that holds everything associated with one instance of the interpreter: the value stack, the global environment, the garbage collector, the loaded modules, and any registered C functions. You can create as many states as you like — they are fully independent from each other — but in practice most applications use only one.

`tea_open` allocates and initializes a new state. `tea_set_argv` forwards the program's argument vector to the interpreter so that scripts can read it through `sys.argv`. `tea_dofile` compiles and executes the given file; it returns a non-zero value if an error occurred, in which case the error message is left on top of the stack. We retrieve it with `tea_to_string`, print it to `stderr`, and pop it.
Finally, `tea_close` releases all resources associated with the state.

You are responsible for creating the state before calling any API function, and for closing it when you are done.

Notice that in case of errors this program simply prints the error message to the standard error stream. Real error handling can be quite complex in C and how to do it depends on the nature of your application. Teascript never writes anything directly to any output stream; it signals errors by returning error codes and error messages. Each application can handle these signals in a way appropriate for its needs.

While you can compile Teascript both as C and C++ code, `tea.h` doesn't include the necessary adjustments to compile if you're using C++. To remediate that, you can follow along by simply including `tea.hpp`.

## The Stack

### Pushing Elements

### Querying Elements

### Other Stack Operations
