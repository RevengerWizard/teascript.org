---
title: Getting Started
weight: 50
toc: true
---

Teascript is a lightweight, embeddable scripting language designed for simplicity and speed. It is dynamically typed and small enough to learn in an _afternoon_.

This is intended as an introductory resource into the various aspects of Teascript, from the language to its standard library and embedding capabilities.

The Guide is split into *four* main parts:
- **Part I** covers the language itself
- **Part II** covers data structures and objects
- **Part III** is for embedders and covers the C API
- **Part IV** tours the standard library

<!--
If you want to skip ahead and try something, the [Playground](/playground) runs Teascript in your browser.
-->

## What is Teascript?

You may be asking, what exactly is Teascript?

Well, Teascript is a small programming language built to be fairly easy to read, easy to learn, and simple to fit inside other software. Its syntax will feel familiar if you have already written code in a scripting language before, and it aims to keep the number of concepts you must be hold to a minimum. A handful of types, a small set of statements, and first-class functions go a long way.

Teascript can be used in two ways. You can run it directly on its own, writing scripts to automate tasks, process text and files, or explore ideas quickly. 

Or, if you're advanced enough, you can _embed_ it in a larger program, and use it as a scripting layer: the host application exposes its own functionality to Teascript, and the people using such application can customize its behavior without having to re-compile everything every time. Think of a game engine, a UI framework, or a graphical program.

Under the hood, Teascript does not interpret your source text directly. Your code is first translated by a parser into a compact binary form, called _bytecode_, which is then executed by a small virtual machine (VM). This two-step design is in large part the reason of why Teascript starts quickly and runs quite efficiently. Memory is entirely managed for you by the interpreter, so you never have to worry about allocating and freeing anything by hand.

### Installing

To run Teascript programs, you will need a standalone Teascript interpreter.

<!--
Prebuilt binaries for [platforms] are available on the [download page](/download).
-->

TODO

### Building from source

If there no pre-built binaries are available for your platform of choice, or you want to hack on the interpreter, or you want the very latest development version, the source code and build instructions are available in the [project repository](TODO-REPO-URL).

TODO

### Embedding

Teascript is designed to live inside other programs. If you want to use it as a scripting language for your own C application, skip ahead to [Part III](/guide/embedding/overview-c-api), which provides a general overview of the C API. You do not need to read Parts I and II in full first, but you will want to be comfortable with the language itself.

## First Program

Teascript programs are plain (UTF-8) text files. By convention, Teascript source files use the `.tea` file extension. To get started, create a new file named `hello.tea`, containing a single line:

```tea
print("Hello World, Teascript!")
```

You can then run the newly created program by passing the file name to the Teascript interpreter:

```console
$ tea hello.tea
Hello World, Teascript!
```

That's a complete program. As you may notice, the interpreter program `tea` compiles the file, runs it, and exits.

### The REPL

If you start the Teascript interpreter program without passing it a file name, it will open a simple interactive prompt, also known as the REPL (read-eval-print-loop). You type a line, Teascript runs it, and you see the result immediately:

```console
$ tea
> print("Hello World, Teascript!")
Hello World, Teascript!
```

The REPL is the quickest way to experiment while you work through this guide. Most of the examples in the chapters ahead can be directly typed into this REPL, so feel free to try variations as you read along.

With that, you are ready to start on the language itself.