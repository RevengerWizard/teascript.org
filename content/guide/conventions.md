---
title: Conventions
weight: 40
toc: true
---

Before diving in, this short page explains how the Guide looks and reads, so that nothing in the chapters ahead comes as a surprise.

## Code

Teascript code appears in blocks like the one here below. When a block is a complete file, its first line is a comment with the file name:

```tea
// hello.tea
print("Hello World, Teascript!")
```

Examples made of several files give each file its own name, with folders as part of it. A block without a file name is just a fragment, and `// ...` inside it stands for code left out for brevity.

Terminal sessions are shown as `console` blocks. Lines starting with `$` are commands you type, without the `$` itself. Anything else is output:

```console
$ tea hello.tea
Hello World, Teascript!
```

Sessions in the REPL work the same way, but with `>` as the prompt:

```console
> print(6 * 7)
42
```

Short examples that show a single idea usually use the REPL, so you can type them as you read. Longer examples are written as files.

C code is shown in its own blocks, and is only found in [Part III](/guide/embedding/overview-c-api):

```c
#include "tea.h"
```

## Text

- `Monospaced text` is code: a keyword, a name, a file name, or something you type.
- _Italic text_ marks a new term the first time it is explained.
- **Bold text** is used for emphasis.

Functions and methods are written with parentheses, like `print()`, while properties are written without them, like `buf.len`.

## Examples are Meant to be Run

Every example in this Guide is meant to work as written. You will learn far more by typing them in and changing them than by just reading, so experiment freely. If an example does not behave as described, it might be a bug in the Guide, and a report to the [project repository](TODO-REPO-URL) is highly appreciated.

You shall continue to [Getting Started](/guide/getting-started).