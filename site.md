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

Name
- Chapter
- Part N - Title
0. Chapter Title
    * Section 1
    * Section 2
    * Section

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
        * Normative Language
        * Extended BNF
        * Operator Precedence Tables 
    - Lexical and Syntactic Layers
        * Terminology 
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
    - Lexical Errors
3. Type System
    - Type System Overview
        * Types
        * Value Types and Reference Types
        * Truth Value
        * Equality
        * Classes of Built-in Types
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
        * Instances
    - Module
    - Userdata
    - Pointer
4. Expressions
    - Expression Forms
        * Literals and Names
        * Grouping
        * List and Map Literals
        * Function Expressions
        * Member Access
        * Calls
        * Subscripts and Slices
        * Ranges
        * Conditional Expression
        * Self and Super
    - Evaluation Order
    - Operator Semantics
        * Arithmetic
        * Comparison
        * Logical
        * Identity
        * Bitwise
        * Operator Overloading Dispatch
    - Operator Precedence Table
    - Assignment
    - Compound Assignment
5. Statements
    - Execution Model
        * Completion
        * Empty Statement
        * Expression Statements
        * Blocks
        * Execution of a Chunk
    - Control Flow Semantics
        * Truthiness
        * if / else
        * switch
        * while / do
        * Generic for
        * Iterative for
    - break / continue / return
        * break
        * continue
        * return
    - Multiple Assignment
6. Declarations
    - Declarations Overview
    - Variable Declaration
        * var and const
        * Initialization
        * Destructuring with Rest
        * Constants
    - Scope
        * Kinds of Scope
        * Where a Variable is Visible
        * Visibility During Initialization
        * Redeclaration and Shadowing
        * Lifetime
    - Name Resolution Rules
    - Exporting Declarations
7. Functions
    - Definition and Calling Convention
        * Function Values
        * Forms That Create Functions
        * Parameters
        * Calling Convention
    - Argument Passing Semantics
    - Default and Variadic Arguments
        * Optional Parameters
        * Variadic Parameters
    - Multiple Return Values
    - Closures and Upvalue Capture
        * Which Variables are Captured
        * Capture by Reference
        * Lifetime of Captured Variables
        * One Variable per Execution of a Scope
    - Tail Calls
8. Object System
    - Class Definition and Instantiation
        * Class Declarations
        * Instantiation
        * Attributes
    - Method Resolution Order
    - Special Methods
        * get / set
        * getattr / setattr
        * call
        * Operator Overload Dispatch Table
    - Inheritance Semantics
    - Identity and Equality
9. Module System
    - Import Semantics
        * Statements
        * Execution
        * Forms and Binds
        * Exports
    - Search Path Resolution
        * Logical Names
        * Paths
        * Candidates
    - Circular Imports
    - Module Caching
10. Error Model
    - Error Values
        * Conditions that Raise
        * Errors
        * The Error Value
        * error
        * assert
    - Propagation
    - Protected Execution
        * pcall
        * What is caught
        * State After an Error is Caught
        * Rethrowing
11. Execution Environment
    - The Global Environment

- Part II - Bytecode Reference
12. Overview
    - Design Goals
    - Versioning and Compatibility
        * What Requires a Version Change
        * What Does Not Matter
        * Limits
    - The Chunk Format
        * Anatomy of a Bytecode Chunk
        * Function Prototypes
        * Modules
        * Producing and Loading Chunks
        * Loading Errors
    - From Source to Execution
        * The Execution Model in Brief
    - Inspecting Bytecode
13. Binary Encoding
    - Primitive Types
        * ULEB128
        * uleb128_33
        * Byte Order
    - File Header
        * Flags
        * Module Variable Table
    - Type Tags
    - Constant Pool
        * Strings
        * Numbers
        * Nested Functions
    - Upvalue Descriptors
    - Function Prototypes
        * Prototype Body
        * Reading and Validation
        * Footer
    - Complete Example
14. Instruction Set
    - Instruction Encoding
        * Stack Frames
        * Call States and Re-entry
    - Operand Types and Notation
        * Operand Types
        * Method Flags
        * Stack Notation
        * Syntax Lines
        * Stack Effect Table
    - Instruction Reference
        * Stack Operations
        * ...
        * Constant Operations
        * ...
        * Function Calls
        * ...
        * Arithmetic Operations
        * ...
        * Comparison Operations
        * ...
        * Control Flow
        * ...
        * Collection Operations
        * ...
        * Object Access
        * ...
        * Global and Module Access
        * ...
        * Closures and Upvalues
        * ...
        * Logical and Type Operations
        * ...
        * Bitwise Operations
        * ...
        * Iteration
        * ...
        * Classes
        * ...
        * Special Instructions
        * ...

- Part III - Implementation
15. The Interpreter
    - Single-Pass Architecture
    - Scope and Upvalue Resolution
    - Constant Folding
    - Jump Patching
16. The Virtual Machine
    - Execution Loop
    - The Call Stack
    - Upvalue Closing
    - Error Dispatch
    - Interacting with the GC
17. Garbage Collector
    - Algorithm
    - Tri-Color Marking
    - The Write Barrier
    - Finalization Order
    - Interaction with Userdata
18. Memory Model
    - Value Representation
    - Object Layout
19. Limits
    - Constants
    - Locals
    - Upvalues
    - Call Depth

- Appendix
- A. Full Grammar
    - EBNF
- B. Versioning and Compatibility
- C. Keywords and Reserved Words
    - Reserved Words
        * Groups
        * Multi-role Words
        * Context-sensitive Words
    - Not Reserved Words
    - Symbols

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
18. Get Functions
19. Value Testing
20. Value Conversion
21. Push Functions
22. Object Creation
23. Object Manipulation
24. List Operations
25. Map Operations
26. Attribute Access
27. Variable Access
28. Function and Method Registration
29. Type Checking
30. Optional Arguments
31. Garbage Collection
32. Memory Management
33. Code Loading and Execution
34. Error Handling
35. String Operations

- Appendix
- A. Error Code Reference
- B. Type Tag Reference  (TEA_TYPE_*, TEA_MASK_*)
- C. Macro Reference     (all the convenience macros from tea.h)
- D. Migration Guide     (API changes between versions, once 1.0 exists)

---

Bytecode Reference Documentation

Versioned?

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

Example

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