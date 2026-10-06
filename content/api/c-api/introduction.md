---
title: Introduction
number: 1.
weight: 100
---

The Teascript API, mainly defined in `tea.h`, is a set of constants and API calls which allow C and C++ programs to interface with Tea code and shields them from internal details like value representation.

This API page provides a coincise reference for the Teascript API and its core concepts. If you're new to Teascript the language, please read the [Teascript Guide](TODO) first.

## Searching and Organization

## Example C program

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
