- Blog
- Guide
- Docs
- API

* RFC Process
* Forum
* Download
* Bytecode Reference Documentation
* Bytecode Explorer
* Playground
* Changelog
* FAQ
* Performance
* Wiki

---

Guide
- Conventions
    * Code
    * Text
    * Terminology
    * Examples are Meant to be Run
- Getting Started
    * What is Teascript?
        - Installing
        - Building from Source
        - Embedding
    * First Program
        - The REPL
- Part I - The Language
1. Types and Values
    - Nil
    - Booleans
    - Numbers
    - Strings
    - Ranges
    - Functions
2. Expressions
    - Arithmetic Operators
    - Comparison Operators
    - Logical Operators
    - Identity Operators
    - Bitwise Operators
    - Assignment Expressions
        * Simple Assignment
        * Compound Assignment
        * Precedence
    - Indexing and Slicing
3. Statements
    - Blocks and Scope
    - Variable Declarations
        * var
        * const
    - Name Resolution
        * Globals
        * Module-Level Resolution
        * Local Resolution
    - Multi-Variable Declaration
        * Multiple Assignment
        * Rest Declarations
    - Control Flow
        * Truthiness
        * if / else
        * switch
        * while / do
        * Generic for
        * Iterative for
    - break / continue / return
    - import / from / export
4. Functions
    - Arguments
    - Default Arguments
    - Variadic Arguments
    - Multiple Return Values
    - Closures
    - Lambdas
5. Error Handling
    - Errors
    - Protected Calls
    - Raising Errors
- Part II - Objects and Data
6. Data Structures
    - Ranges
    - Lists
    - Maps
7. String Buffers
    - Creating Buffers
        * Pre-allocating
    - Reading and Writing
        * Appending
        * Reading
        * Consuming
        * Emptying
    - Common Patterns
        * Building Text in a Loop
        * Reusing a Buffer
        * Consuming as You Go
        * Using Custom Types
    - When to use a buffer
8. The Module System
    - Exporting
    - Importing
        * Importing a File
        * Importing a Standard Module
        * Importing Specific Names
    - The Search Path
    - Putting it Together
    - What's Next
9. Object-Oriented Programming
    - Classes
    - Instantiating
    - Methods
    - Operator Overloading
    - Special Methods
        * get / set
        * getattr / setattr
        * call
        * contains
        * tostring
    - Inheritance
10. Iterators
    - Semantics of the Generic for
    - Writing Your Own Iterator
- Part III - Embedding
10. Overview of the C API
    - A First Example
    - The Stack
        * Pushing Elements
        * Querying Elements
        * Other Stack Operations
11. Calling Teascript from C
    - Loading and Running Code
    - Calling Functions
    - Protected Calls
    - Error Handling
12. Calling C from Teascript
    - C Functions
    - C Modules
    - C Classes
13. Handling Types and Values
    - List Operations
    - Map Operations
    - Object Operations
    - Module Operations
14. User-Defined Types in C
    - Userdata
    - Uservalues
    - Pointers
    - Object-Oriented Patterns
15. Storing State in C
    - The Registry
    - Upvalues
- Part IV - Standard Library
16. Core Functions
17. String Methods
18. List Methods
19. Map Methods
20. IO Module
    - Files
    - Standard Streams
    - Buffers and Seeking
21. OS Module
22. Math Module
23. Random Module
24. Sys Module
25. Debug Module
26. Other Modules

- Appendix
A. Keywords and Operators Quick Reference
B. Teascript for C / Python / Lua Programmers

- Index
- Cookbook
- Debugging and Tooling (REPL, debug module, reading errors)

---

Docs
- Part I - Language Specification
1. Notation and Conventions
    - Grammar Notation
    - Lexical and Syntactic Layers
2. Lexical Structure
    - Source Encoding
    - Whitespace and Line Endings
    - Comments
    - Tokens
    - Keywords and Reserved Words
    - Identifiers
    - Literals
        * Integer Literals
        * Float Literals
        * String Literals
        * Escape Sequences
3. Types
    - Type System Overview
    - Nil
    - Boolean
    - Number
        * Representation
        * Arithmetic Semantics
        * NaN and Infinity
    - String
        * Encoding and Byte Semantics
        * Interning
    - Range
    - Function
    - List
    - Map
    - Class and Instance
    - Module
    - Userdata
    - Pointer
4. Expressions
    - Evaluation Order
    - Operator Semantics
        * Arithmetic
        * Comparison
        * Logical (short-circuit rules)
        * Identity
        * Bitwise
        * Operator Overloading Dispatch
    - Operator Precedence Table
    - Assignment
5. Statements
    - Execution Model
    - Variable Declaration and Scope
    - Name Resolution Rules
    - Control Flow Semantics
        * Truthiness
        * if / else
        * while / do
        * Numeric for (iteration semantics, step edge cases)
        * Generic for (iterator protocol)
    - break / continue / return
6. Functions
    - Definition and Calling Convention
    - Argument Passing Semantics
    - Default and Variadic Arguments
    - Multiple Return Values
    - Closures and Upvalue Capture
    - Tail Calls
7. Object System
    - Class Definition and Instantiation
    - Method Resolution Order
    - Special Methods
        * get / set
        * getattr / setattr
        * call
        * Operator Overload Dispatch Table
    - Inheritance Semantics
    - Identity and Equality
8. Module System
    - Import Semantics
    - Search Path Resolution
    - Circular Imports
    - Module Caching
9. Error Model
    - Error Values
    - Propagation
    - Protected Execution
10. Execution Environment
    - The Global Environment
    - Standard Modules
    - argv and the Sys Module
- Part II - Bytecode Reference
11. Overview
    - Design Goals
    - Versioning and Compatibility
    - The chunk Format
12. Binary Encoding
    - File Header
    - Type Tags
    - Constant Pool
    - Upvalue Descriptors
    - Function Prototypes
13. Instruction Set
    - Instruction Encoding
    - Operand Types and Notation
    - Instruction Reference
      — one entry per opcode:
      mnemonic, encoding, stack effect, semantics, notes
- Part III - Implementation
14. The Interpreter
    - Single-Pass Architecture
    - Scope and Upvalue Resolution
    - Constant Folding
    - Jump Patching
15. The Virtual Machine
    - Execution Loop
    - The Call Stack
    - Upvalue Closing
    - Error Dispatch
    - Interacting with the GC
16. Garbage Collector
    - Algorithm
    - Tri-Color Marking
    - The Write Barrier
    - Finalization Order
    - Interaction with Userdata
17. Memory Model
    - Value Representation
    - Object Layout
18. Limits
    - Constants
    - Locals
    - Upvalues
    - Call Depth

- Appendix
A. Full Grammar (EBNF)
B. Versioning and Compatibility
C. Keywords and Reserved Words

---

API
- Part I - Standard Library Reference
1. Conventions
2. Core Functions
3. String Methods
4. List Methods
5. Map Methods
6. Range Methods
7. Other Methods
8. IO Module
9. OS Module
10. Math Module
11. Random Module
12. Sys Module
13. Debug Module
14. Other Modules
- Part II - C API Reference
15. Conventions
    - Stack Indices and Pseudo-indices
    - Argument Numbering
    - Error Handling Contract
    - Thread Safety
16. State Manipulation
17. Stack Manipulation
18. Get Functions          (tea_get_*: read without coercion, no error)
19. Value Testing          (tea_is_*, tea_equal, tea_rawequal)
20. Value Conversion       (tea_to_*: coerce if possible, no error)
21. Push Functions         (tea_push_*)
22. Object Creation        (tea_new_*, tea_create_*)
23. Object Manipulation    (tea_len, tea_next)
24. List Operations
25. Map Operations
26. Attribute Access
27. Variable Access
28. Function and Method Registration
29. Type Checking          (tea_check_*)
30. Optional Arguments     (tea_opt_*)
31. Garbage Collection
32. Memory Management
33. Code Loading and Execution
34. Error Handling
35. String Operations

- Appendix
A. Error Code Reference\
B. Type Tag Reference  (TEA_TYPE_*, TEA_MASK_*)\
C. Macro Reference     (all the convenience macros from tea.h)\
D. Migration Guide     (API changes between versions, once 1.0 exists)\

---

Bytecode Reference Documentation

Versioned

- Tea Stack
- Instruction Notation
- Instruction Summary

* OP instruction
- Syntax
- Description
- Examples

---

- Stack Effects `[-o, +p, x]`
- Visual Stack Representation

tea_check_udata
───────────────
void* tea_check_udata(tea_State* T, int index, const char* name)

Retrieves the userdata pointer at stack position `index`, checking that it
was created with the matching `name`. Raises a type error if the value at
`index` is not a userdata, or if its name does not match.

Unlike `tea_get_userdata`, which performs no validation, this function is
safe to use in any C function that receives values from Teascript code.

Parameters
  T       The Teascript state.
  index   Stack index of the value to retrieve.
  name    The name the userdata was registered with (e.g. "RingBuffer").

Returns
  A pointer to the raw userdata block. Never NULL.

Errors
  Raises a runtime error if the value is not a named userdata or if the
  name does not match.

See also
  tea_test_udata, tea_get_userdata, tea_new_udata

---

tea_check_list
──────────────
#define tea_check_list(T, index)

Convenience macro. Equivalent to:
  tea_check_type(T, index, TEA_TYPE_LIST)

Raises a type error if the value at `index` is not a list.

See also
  tea_check_map, tea_check_type, TEA_TYPE_LIST

---

tea_Reg
───────
typedef struct tea_Reg {
    const char* name;
    tea_CFunction fn;
    int nargs;
    int nopts;
} tea_Reg;

Describes a single entry in a function registration array. Arrays of
tea_Reg are passed to tea_create_module, tea_create_submodule, and
tea_set_funcs. The array must be terminated with a sentinel entry where
name and fn are both NULL.

Fields
  name    The name the function will be registered under.
  fn      The C function to register.
  nargs   The number of required arguments. Pass TEA_VARG for variadic
          functions.
  nopts   The number of optional arguments beyond nargs.

See also
  tea_Methods, tea_create_module, tea_set_funcs