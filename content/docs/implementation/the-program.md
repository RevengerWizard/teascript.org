---
title: The Program
number: "1."
weight: 1799
---

`tea` is the standalone Teascript interpreter. It's a small command-line driver, built on the public C API (`tea.h`), that creates an interpreter state, reads the command line, and then loads and runs code from a script file, a command-line string, standard input, or an interactive prompt. It is also the front-end to the bytecode dumper.

This chapter describes the program's observable behaviour. It includes how it is invoked, how its command line is read, the order in which it performs its actions, how it reports errors and which exit status it returns, how source is compiled to bytecode, and how the interactive prompt (REPL) works. The behaviour of the language itself is defined by the Language Specification and is not repeated here.

The driver is deliberately thin. Everything it does is expressed through the C API, which makes it a reference example for embedding Teascript in another program.

## Invocation

### Synopsis

```
tea [options] [scripts [args]]
```

All arguments before the first argument that does not begin with `-` are interpreted as options. That first argument is the _script_; every argument after it is a _script argument_ and is never inspected by `tea`.

The complete command line (program name, options, script and script arguments) is recorded in the interpreter state before any code runs, together with the index of the script argument. When there is no script, that index equals the argument count.

### Running a Script

```
tea script.tea [args]
```

The file is opened (in binary mode) and loaded as a chunk whose name is the file name. The directory of that name becomes the module's base path, which is what relative imports are resolved against (see the Module System chapter). The loaded chunk is then called (executed) with no arguments in protected mode.

If the file cannot be opened, or an I/O error occurs while reading it, `tea` prints a message of the form `Cannot open <file>: <reason>` (or `Cannot read ...`) and exits with the file-error status.

### Running Bytecode

```
tea script.tbc [args]
```

Source text and precompiled bytecode are both accepted anywhere a script is accepted. The loader decides which one it has been given by inspecting the beginning of the input for the bytecode signature, which is `"\033Tea"`, `TEA_SIGNATURE` in the C API. The driver does not restrict the accepted forms. It loads with no mode string, so both are allowed. Embedders can restrict loading to text `"t"` or binary `"b"` through `tea_loadx`; a chunk of the disallowed form is then rejected with a syntax error.

Bytecode files are produced with the `-b` option; see Compiling to Bytecode.

### Reading from Standard Input

Standard input is executed as a script in two ways:

- **Explicitly**, with the script argument `-`: `tea - [args]`. Script arguments may follow. If `-` appears immediately after `--`, it is instead taken as the name of an ordinary file called `-` (see Option Parsing and the `--` Terminator).
- **Implicitly**, when no script, `-e`, `-v` or `-i` is given and standard input is not a terminal. The whole of standard input is then loaded and run as one chunk.

In both cases, the chunk is named `=<stdin>`. When no script is given and standard input _is_ a terminal, `tea` prints the version banner and starts the REPL instead. Whether standard input is a terminal is determined with `isatty` on POSIX targets and `_isatty` on Windows; on any other target it is assumed to be a terminal.

## Options

### Option Reference

| Option | Description |
| --- | --- |
| `-e code` | Execute the string `code`. The code may also be attached: `-ecode` |
| `-b ...` | Compile to bytecode, or list bytecode. All remaining arguments belong to the dumper |
| `-i` | Enter interactive mode after executing the script. Implies `-v` |
| `-v` | Print version information |
| `--` | Stop handling options. The next argument is the script |
| `-` | Stop handling options and execute standard input |

`-e code` loads and runs `code` as a chunk named `=<stdin>`. The option may be repeated; the strings run in command-line order, before the script. The first failure aborts all remaining processing (including the script) and determines the exit status. The option requires an argument; if the command line ends right after `-e`, the usage message is printed.

`-b` hands the rest of the command line to the bytecode tool. It is described in Compiling to Bytecode.

`-i` enters the REPL after the script (and any `-e` strings) has run successfully. If the script fails, the REPL is not entered. As a side effect of `-i`, the script chunk is named `=<stdin>` instead of by its file name (see Chunk Names). Since `-i` also sets the version flag, the banner is printed first.

`-v` prints the Teascript version, which is `teascript v` followed by the version (for example `teascript v0.0.0`) to standard output. The banner is printed before `-e` strings or the script run. Giving `-v` suppresses the implicit REPL and the implicit execution of standard input; `tea -v` alone prints the banner and exits.

`--` and `-` are described in the next section.

Unknown options, and options with extra trailing characters where none are allowed, cause the usage message to be written to standard error:

```
usage: tea [options] [script [args]]
Available options are:
  -e code    Execute string 'code'
  -b ...     Save or list bytecode
  -i         Enter interactive mode after executing 'script'
  -v         Show version information
  --         Stop handling options
  -          Stop handling options and execute stdin
```

### Option Parsing and the `--` Terminator

The command line is scanned once, from left to right, with these rules:

1. An argument that does not start with `-` is the script. Scanning stops, and it and everything after it are left untouched.
2. The argument `--`, spelled exactly, ends option processing; the argument after it is the script (even if it begins with `-`). An argument such as `--foo` is an unknown option.
3. The argument `-` alone ends option processing and names standard input as the script. Unlike `--`, it is not consumed: the `-` is the script argument, and arguments after it are script arguments.
4. `-e` takes a value, either attached `-ecode` or as the next argument.
5. `-b` ends scanning immediately; see below.
6. Anything else is an unknown option.

The terminator is the only way to run a script whose name starts with a dash:

```
tea -- -weird-name.tea
```

For the same reason, `tea -- -` executes a file literally named `-`, whereas `tea -` executes standard input.

### Combining Options

Short options cannot be clustered. `-iv` is an unknown option, and `-i`, `-v` and `--` accept no trailing characters. Options may be freely mixed and repeated, with these exceptions:

- `-e` accepts an attached value, as in `-e'print(1)'`
- `-b` must be the first option; if any other option precedes it, the usage message is printed. Everything after it, including further options, is passed to the bytecode tool

Option _actions_ do not follow the order of _parsing_ in all cases. Regardless of where they appear, the actions are performed in this fixed order:

1. Record the command line and, if `-v` or `-i` was given, print the version.
2. Run each `-e` string (or the `-b` command), in command-line order.
3. Run the script, if one was given.
4. Enter the REPL, if `-i` was given; or, with no script and none of `-e`, `-v` and `-i`, either start the REPL (terminal) or run standard input (non-terminal).

## Script Arguments

Arguments following the script are not interpreted by `tea`. The whole argument vector, together with the position of the script argument, is stored in the interpreter state before any `-e` string or script runs, so every chunk can observe it. From C, it is available through `tea_get_argv`, and an embedding application can set it with `tea_set_argv`. The way these values are exposed to Teascript code is defined by the standard library.

```
tea -e "..." script.tea one two
```

Here `-e "..."` is an option, `script.tea` is the script. and `one` and `two` are script arguments. Arguments that look like options but follow the script, such as `-v` in `tea script.tea -v`, belong to the script.

### Chunk Names

Every chunk loaded by the driver has a name that is used for error messages and as the name of its module. The loader treats a name that starts with `?`, `=` or `<` as _volatile_. Its base path is the current directory `.` rather than a directory derived from the name. The driver uses these names:

| Source | Chunk name |
| --- | --- |
| Script file | the file name (the `=<stdin>` name when `-i` is given) |
| Standard input | `=<stdin>` |
| `-e` string | `=<stdin>` |
| REPL entry | `=<stdin>` |

Consequently, relative imports from standard input, from `-e` strings, from the REPL and from a script run with `-i` are resolved relative to the current directory, not the script's directory.

## Environment Variables

The driver itself reads no environment variables. Indirectly:

- When built with line editing (see The REPL), the GNU Readline library honors its own variables, such as `INPUTRC`.
- The `clear` REPL command runs the system command `clear` (or `cls` on Windows), which may depend on `TERM`.

<!-- TODO: list variables read by the runtime/importer (module search path etc.) once those sources are available; they belong to the Module System chapter if they affect resolution. -->

## Exit Status

| Status | Meaning |
|--------|---------|
| `0` | Success. |
| `1` | The interpreter state could not be created (`Cannot create state: not enough memory`). |
| `65` | Syntax error (including errors raised while compiling a chunk or loading malformed bytecode). |
| `70` | Runtime error. |
| `75` | File error: the script could not be opened or read. |

Error messages are written to standard error, one per message, followed by a newline. The version banner is written to standard output; the usage message goes to standard error.

After any failing chunk, a complete garbage collection is forced. When a script `-e` string fails, no further checks run.

Not every failure is reflected in the exit status. In the current implementation the following cases exit with status `0` even though a message may have been printed:

- the usage message printed for an unknown option;
- an error in a script run implicitly from non-terminal standard input (an explicit `tea -` does report its status);
- any outcome of the `-b` command;
- errors in REPL entries (the REPL always continues);
- memory errors, and errors that occur while handling an error, when reported through the standard path.

Scripts that need a specific exit code can rely on the status values above only for the cases listed in the table.

### Interrupt Handling

While a chunk is _executing_ (not while it is being compiled or while the REPL is waiting for input), `tea` installs a handler for `SIGINT`. On the first interrupt the handler restores the default disposition and raises the runtime error `Interrupted`, which unwinds like any other runtime error, can be reported with status `70`, and in the REPL returns control to the prompt. A second interrupt terminates the process in the default manner. The default disposition is also restored once the chunk returns.

## Compiling to Bytecode

```
tea -b[options] input output
tea -bl[options] input [output]
```

The `-b` option does not compile anything itself. The driver imports the `bcsave` module, written in Teascript, looks up its `docmd` function, and calls it with the remaining command-line arguments as strings. If `-b` carries trailing characters `-bl`, they become a normal option argument `-l` passed first. `-b` ends the driver's own processing, so no script or REPL follows it.

`bcsave` accepts the following options:

| Option | Description |
| --- | --- |
| `-l` | Only list the bytecode; write no bytecode |
| `-s` | Strip debug information |
| `-t type` | Set the output file type. By default it is detected from the output name |
| `-e chunk` | Use the string `chunk` as the input instead of a file name |
| `--` | Stop handling options |
| `-` | As input, read standard input; as output, write to standard output |

The parsing rules are the following:

- Short options may be clustered `-ls`. An option that takes a value `-t`, `-e` must be last in its cluster and be followed by an argument
- Options may appear before, between or after the positional arguments. After `--`, all arguments are positional. A lone `-` is always positional
- `-e` must precede all positional arguments. The chunk string is then the input argument
- An unknown option, a missing value or a wrong number of positional arguments prints the usage text to standard error and exits with status `1`. Saving takes exactlly two positional arguments (input and output); listing takes one or two.

The input is loaded with `loadfile` (or `loadstring` for `-e`), and `-` selects standard input. If the input fails to load, the error is reported in the usual way.

For programmatic use, the C API offers `tea_dump`, which writes the function on top of the stack through a caller-supplied writer.

### Output File

The output is written to the named file, or to standard output when the name is `-`. Its format is the _type_, set with `-t` or otherwise detected from the output name:

| Type names | Format |
| --- | --- |
| `raw`, `tbc` | Raw binary bytecode, loadable by `tea` and by the load functions. This is the default |
| `c`, `cc`, `cpp` | C source defining `const unsigned char NAME[]`, with the bytes as comma separated decimal values. The array is marked `extern "C"` for C++ and `__declspec(dllexport)` on Windows |
| `h` | C header defining a `static const unsigned char NAME[]` array and a macro `NAME_SIZE` holding its length in bytes |

Detection takes the text after the **first** `.` in the output name, lowercased, and looks it up among the type names; if there is no dot or the text is unknown, the type is `raw`. Output names that contain an earlier dot, such as `./output/mod.c` or `../mod.c` are therefore not recognized and produce raw bytecode unless `-t` is given. Standard output has no extension and is always `raw` without `-t`.

`NAME` is derived from the input name: the last `/`-separated component, up to its first `.` (`src/game.tea` gives `game`). It is not sanitized, and cannot be set by an option, so inputs whose names are not valid C identifiers (including `-` and `-e` strings) yield invalid C. Raw output is not affected.

### Stripping Debug Information

With `-s`, debug information is stripped from the dumped chunk. This only affects bytecode being saved. With `-l` the option is accepted and ignored.

### Listing Bytecode

With `-l`, the bytecode is written in text form to the output file, or to standard output when it is omitted or `-`. Nested functions are listed before the function that contains them, each under a header of the form `== 'name' ==`. Every instruction then occupies a line made of:

- the instruction offset, in four digits;
- the source line, or `|` when it is the same as for the previous instruction;
- the instruction name, padded to 16 characters;
- the operands, which depend on the instruction.

### Shebang Lines

When a source file starts with a shebang line (`#!`), the lexer reads it and ignores it, so that a script can be made directly executable:

```
#!/usr/bin/env tea
print("hello")
```

Bytecode files cannot carry a shebang line: they always start with the signature, which the loader checks first. A shebang in the source is dropped when it is compiled with `-b`, and the result has to be run explicitly (`tea script.tbc`).


## The REPL

The read-eval-print loop starts when `tea` is run on a terminal with no script, `-e` or when `-i` is given. It prints the prompt `> `, reads a line, compiles and runs it, reports any error, and prompts again. Despite the name, the driver does not print values (see Result Printing).

The loop ends on end of input (Ctrl-D, or Ctrl-Z on Windows), or when a line consists solely of the word `exit`. A newline is written on leaving.

Two words are recognized as commands rather than code, when they make up the whole line (no surrounding whitespace is trimmed). `exit`, which leaves the REPL, and `clear` which clears the terminal screen and prompts again. Because the check applies to every physical line, including continuation lines, a variable names `exit` or `clear` cannot be evaluated on a line by itself.

### Line Editing and History

Line editing is a build-time option. When the program is compiled with `TEA_USE_READLINE`, input is read through GNU Readline. It provides editing and a history, and each completed entry is added to the history as a single line item (multi-line entries are stored joined with newlines). The Readline name used for configuration purposes is `tea`.

Without it, the prompt is written to standard output and input is read directly from standard input with no editing or history.

### Multi-line Input

After reading a line, the driver tries to compile it. If compilation fails with a syntax error that was detected at the end of the input (the error message ends with `<eof>`), the input is considered _incomplete_; the error is discarded, the continuation prompt `...` is shown, the next line is appended after a newline, and the whole accumulated text is compiled again. This repeates until the text compiles, fails with an ordinary syntax error, or input ends.

Hence a block such as:

```
> function f(x) {
... 
```

stays open until the parser sees the construct close. Any other error is reported immediately and the accumulated text is discarded. The complete entry, not each line, is what gets compiled, which also means each entry is parsed from its first line again whenever a line is added.

### Result Printing

The driver does not print the value of an expression. Each entry is compiled as a chunk and called in protected mode with no arguments; its results are discarded when the stack is cleared before the next entry. To see a value it has to be printed explicitly, for example with the `print` function.

Errors are printed to standard error in the same form as for scripts, and do not terminate the loop. The error status is not used as an exit status.

### Interaction with Globals

Every REPL entry is compiled as a chunk named `=<stdin>`, and chunks with the same name share one module. Variables and constants declared at the top level of an entry are added to that module and stay visible to all later entries:

```
> var x = 10
> print(x + 1)
11
```

The same module is used by `-e` strings and by a script run with `-i`, so `tea -e "var x = 10" -i` starts with a REPL in which `x` is already defined. Everything else held by the interpreter state, such as the globals table and the loaded modules, persists too. Names that are not declared in the module are looked up in the globals table at run time.

Locals of a chunk do not survive the entry that created them, and the stack is cleared before each entry, so there is no "last value".
