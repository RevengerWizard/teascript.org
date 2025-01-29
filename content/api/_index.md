---
title: C API
type: _default
layout: single
---

The Teascript C API (defined in `tea.h`) is a set of constants and API calls which allows C/C++ programs to interface with Teascript code and shields them from internal details like value representation.

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

### `tea_Alloc`

```c
typedef void* (*tea_Alloc)(void* ud, 
                          void* ptr, 
                          size_t osize, 
                          size_t nsize);
```

The type of the memory-allocation used by Teascript states. The allocator must provide a functionality similar to `realloc`, but not exactly the same.

Here is a simple implementation for the allocator function.

```c
static void* mem_alloc(void* ud, void* ptr, size_t osize, size_t nsize)
{
    UNUSED(ud);
    UNUSED(osize);
    if(nsize == 0)
    {
        free(ptr);
        return NULL;
    }
    else
    {
        return realloc(ptr, nsize);
    }
}
```

This code assumes that `free(NULL)` has no effect and that `realloc(NULL, size)` is equivalent to `malloc(size)`. C ensures both behaviors.

### `tea_CFunction`

```c
typedef void (*tea_CFunction)(tea_State* T);
```

Type for C functions.

```c
tea_State* tea_new_state(tea_Alloc f, void* ud);
```

Creates a new state. Returns `NULL` if cannot create the state (due to lack of memory). The argument `f` is the allocator function; Teascript does all memory allocations through this function. The second argument, `ud`, is an opaque pointer that Teascript simply passes to the allocator in every call. 

### `tea_close`

```c
void tea_close(tea_State* T);
```

Destroys all objects in the given Teascript state (calling the corresponding garbage-collection methods, if any) and frees all dynamic memory used by this state. This function must be called to ensure all resources used by the Teascript state are properly displaced.

```c
void tea_set_argv(tea_State* T, int argc, char** argv, int argf);
```

### `tea_atpanic`

```c
void tea_CFunction tea_atpanic(tea_State* T, tea_CFunction panicf);
```

Sets a new panic function and returns the old one.

If an error happens outside any protected environment, Teascript calls a _panic function_ and then calls `exit(EXIT_FAILURE)`, thus exiting the host application.

The panic function can access the error message at the top of the stack.

### `tea_get_allocf`

```c
tea_Alloc tea_get_allocf(tea_State* T, void** ud);
```

Returns the memory-allocation function of a given state. If `ud` is not `NULL`, Teascript stores in `*ud` the opaque pointer passed to `tea_new_state`.

### `tea_set_allocf`

```c
void tea_set_allocf(tea_State* T, tea_Alloc f, void* ud);
```

Changes the allocator function of a given state to `f` with user data `ud`.

### `tea_absindex`

```c
int tea_absindex(tea_State* T, int index);
```

Converts the acceptable index `index` into an equivalent absolute index (that is, one that does not depend on the stack top).

### `tea_pop`

```c
void tea_pop(tea_State* T, int n);
```

Pops `n` elements from the stack.

### `tea_get_top`

```c
int tea_get_top(tea_State* T);
```

Returns the number of elements currently in the stack. 0 means an empty stack.

### `tea_set_top`

```c
void tea_set_top(tea_State* T, int index);
```

Accepts any index, and sets the stack top to this index. If the new top is larger than the old one, then the new elements are filled with `nil`. If index is 0, then all stack elements are removed.

### `tea_push_value`

```c
void tea_push_value(tea_State* T, int index);
```

Pushes a copy of the element at the given valid index onto the stack.

### `tea_remove`

```c
void tea_remove(tea_State* T, int index);
```

Removes the element at the given valid index, shifting down the elements above this index to fill the gap. Cannot be called with a pseudo-index, because a pseudo-index is not an actual stack position

```c
void tea_insert(tea_State* T, int index);
```

### `tea_replace`

```c
void tea_replace(tea_State* T, int index);
```

Moves the top element into the given position (and pops it), without shifting any element (therefore replacing the value at the given position).

### `tea_copy`

```c
void tea_copy(tea_State* T, int from_index, int to_index);
```

Copies the element at index `from_index` into the valid index `to_index`, replacing the value at that position. Values at other positions are not affected.

### `tea_swap`

```c
void tea_swap(tea_State* T, int index1, int index2);
```

Swap values at indices `index1` and `index2`.

```c
int tea_get_mask(tea_State* T, int index);
```

```c
int tea_get_type(tea_State* T, int index);
```

```c
bool tea_get_bool(tea_State* T, int index);
```

```c
tea_Number tea_get_number(tea_State* T, int index);
```

```c
tea_Integer tea_get_integer(tea_State* T, int index);
```

```c
const void* tea_get_pointer(tea_State* T, int index);
```

```c
void tea_get_range(tea_State* T, int index, double* start, double* end, double* step);
```

```c
const char* tea_get_lstring(tea_State* T, int index, size_t* len);
```

```c
const char* tea_get_string(tea_State* T, int index);
```

```c
const char* tea_get_userdata(tea_State* T, int index);
```

```c
bool tea_is_object(tea_State* T, int index);
```

### `tea_is_cfunction`

```c
bool tea_is_cfunction(tea_State* T, int index);
```

Returns `true` if the value at the given acceptable index is a C function, and 0 otherwise.

### `tea_to_bool`

```c
bool tea_to_bool(tea_State* T, int index);
```

Converts the Teascript value at the given index to a C boolean value (0 or 1). 

### `tea_to_numberx`

```c
tea_Number tea_to_numberx(tea_State* T, int index, bool* is_num);
```

Converts the Teascript value at the given index to the C type `tea_Number`. The Teascript value must be a type convertible to a number; otherwise, `tea_to_numberx` returns 0.

If `is_num` is not `NULL`, its referent is assigned a boolean value that indicates whether the operation succeeded.

### `tea_to_number`

```c
tea_Number tea_to_number(tea_State* T, int index);
```

Equivalent to `tea_to_numberx` with `is_num` equal to `NULL`.

### `tea_to_integerx`

```c
tea_Integer tea_to_integerx(tea_State* T, int index, bool* is_num);
```

Converts the Teascript value at the given index to the integral type `tea_Integer`. The Teascript value must be a type convertible to an integer; otherwise, `tea_to_integerx` returns 0.

If `is_num` is not `NULL`, its referent is assigned a boolean value that indicates whether the operation succeeded.

### `tea_to_integer`

```c
tea_Integer tea_to_integer(tea_State* T, int index);
```

Equivalent to `tea_to_integerx` with `is_num` equal to `NULL`.

### `tea_to_pointer`

```c
const void* tea_to_pointer(tea_State* T, int index);
```

Converts the value at the given index to a generic C pointer `void*`. The value can be a userdata or any other Teascript object; otherwise, `tea_to_pointer` returns `NULL`. Different objects will give different pointers. There is no way to convert the pointer back to its original value.

Typically this function is used only for hashing and debug information.

```c
void* tea_to_userdata(tea_State* T, int index);
```

### `tea_to_lstring`

```c
const char* tea_to_lstring(tea_State* T, int index, size_t* len);
```

Converts the Teascript value at the given index to a C string. If `len`is not `NULL`, it sets `*len` with the string length. The Teascript value can be any value.

`tea_to_lstring` returns a pointer to the string pushed by this function. This string always has a zero `\0` after its last character (as in C), but can contain other zeros in its body.

Because Teascript has garbage collection, there is no guarantee that the pointer returned by `tea_to_lstring` will be valid after the corresponding Teascript value is removed from the stack.

```c
const char* tea_to_string(tea_State* T, int index);
```

### `tea_to_cfunction`

```c
TeaCFunction tea_to_cfunction(tea_State* T, int index);
```

Converts a value at the given index to a C function. That value must be a C function; otherwise, returns `NULL`.

```c
bool tea_equal(tea_State* T, int index1, int index2);
```

### `tea_rawequal`

```c
bool tea_rawequal(tea_State* T, int index1, int index2);
```

Returns `true` if the two values in acceptable indices `index1` and `index2` are equal by identity. Otherwise returns `false`.

### `tea_concat`

```c
void tea_concat(tea_State* T, int n);
```

Concatenates the `n` values at the top of the stack, pops them, and leaves the result at the top. If `n` is 1, the result is the single value on the stack (that is, the function does nothing); if `n` is 0, the result is the empty string.

### `tea_push_nil`

```c
void tea_push_nil(tea_State* T);
```

Pushes a `nil` value onto the stack.

### `tea_push_true`

```c
void tea_push_true(tea_State* T);
```

Pushes the boolean value `true` onto the stack.

### `tea_push_false`

```c
void tea_push_false(tea_State* T);
```

Pushes the boolean value `false` onto the stack.

### `tea_push_bool`

```c
void tea_push_bool(tea_State* T, bool b);
```

Pushes a boolean value with value `b` onto the stack

### `tea_push_number`

```c
void tea_push_number(tea_State* T, tea_Number n);
```

Pushes a number with value `n` onto the stack.

### `tea_push_integer`

```c
void tea_push_integer(tea_State* T, tea_Integer n);
```

Pushes a number with value `n` onto the stack.

### `tea_push_lstring`

```c
const char* tea_push_lstring(tea_State* T, const char* s, size_t len);
```

Pushes the string pointed to by `s` with size `len` onto the stack. Teascript makes (or reuses) an internal copy of the given string, so the memory at `s` can be freed or reused immediately after the function returns. The string can contain embedded zeros.

### `tea_push_string`

```c
const char* tea_push_string(tea_State* T, const char* s);
```

Pushes the zero-terminated string pointer to by `s` onto the stack. Teascript makes (or reuses) an internal copy of the given string, so the memory at `s` can be freed or reused immediately after the function returns. The string cannot contain embedded zeros; it is assumed to end at the first `\0`

### `tea_push_fstring`

```c
const char* tea_push_fstring(tea_State* T, const char* fmt, ...);
```

Pushes onto the stack a formatted string and returns a pointer to this string. It is similar to the C function `sprintf`, but has some important differences:

- You do not have to allocate space for the result: the result is a Teascript string and Teascript takes care of memory allocation (and deallocation through garbage collection).
- The conversion specifiers are quite restricted. There are no flags, widths, or precisions. The conversion specifiers can only be `%%` (inserts a `%` in the string), `%s` (inserts a zero-terminated string, with no size restrictions), `%f` (inserts a `tea_Number`), `%p` (inserts a pointer as a hexadecimal numeral), `%d` (inserts an `int`), and `%c` (inserts an `int` as an ASCII character).

### `tea_push_vfstring`

```c
const char* tea_push_vfstring(tea_State* T, const char* fmt, va_list args);
```

Equivalent to `tea_push_fstring`, except that it receives a `va_list` instead of a variable number of arguments.

### `tea_push_range`

```c
void tea_push_range(tea_State* T, tea_Number start, tea_Number end, tea_Number step);
```

Pushes a new range onto the stack with numbers `start`..`end`..`step`.

### `tea_push_cfunction`

```c
void tea_push_cfunction(tea_State* T, TeaCFunction fn, int nargs, int nopts);
```

Pushes a C function onto the stack. This function receives a pointer to a C function and pushes onto the Teascript value of the type `function` that, when called, invokes the corresponding C function.

Any function to be registered in Teascript must follow the correct protocol to receive its arguments and return its value

### `tea_get_udvalue`

```c
bool tea_get_udvalue(tea_State* T, int ud, int n);
```

Pushes onto the stack the Teascript value associated with the userdata at index `ud` and at array position `n` of the array of Teascript values for the userdata.

Returns `0` if the position `n` is out of bounds, `1` otherwise.

### `tea_set_udvalue`

```c
void tea_set_udvalue(tea_State* T, int ud, int n);
```

```c
void* tea_new_userdatav(tea_State* T, size_t size, int nuvs);
```

```c
void* tea_new_udatav(tea_State* T, size_t size, int nuvs, const char* name);
```

### `tea_new_userdata`

```c
void* tea_new_userdata(tea_State* T, size_t size);
```

This function allocates a new block of memory with given size, pushes onto the stack a new userdata with the block address, and returns this address.
The host program can freely use this memory.

```c
void* tea_new_udata(tea_State* T, size_t size, const char* name);
```

```c
void tea_new_list(tea_State* T, size_t n);
```

```c
void tea_new_map(tea_State* T);
```

```c
void tea_new_class(tea_State* T, const char* name);
```

```c
void tea_new_module(tea_State* T, const char* name);
```

```c
void tea_new_submodule(tea_State* T, const char* name);
```

```c
void tea_create_class(tea_State* T, const char* name, const TeaClass* klass);
```

```c
void tea_create_module(tea_State* T, const char* name, const TeaModule* module);
```

```c
void tea_create_submodule(tea_State* T, const char* name, const tea_Reg* module);
```

### `tea_len`

```c
int tea_len(tea_State* T, int index);
```

Returns the "length" of the Teascript object at the given index; returns -1 if the object doesn't have a length.

```c
void tea_add_item(tea_State* T, int list);
```

```c
bool tea_get_item(tea_State* T, int list, int index);
```

```c
bool tea_set_item(tea_State* T, int list, int index);
```

```c
bool tea_delete_item(tea_State* T, int list, int index);
```

```c
bool tea_insert_item(tea_State* T, int list, int index);
```

```c
int tea_next(tea_State* T, int obj);
```

```c
bool tea_get_field(tea_State* T, int obj);
```

```c
void tea_set_field(tea_State* T, int obj);
```

```c
bool tea_get_key(tea_State* T, int obj, const char* key);
```

```c
void tea_set_key(tea_State* T, int obj, const char* key);
```

```c
bool tea_get_global(tea_State* T, const char* name);
```

```c
void tea_set_global(tea_State* T, const char* name);
```

```c
void tea_set_funcs(tea_State* T, const TeaReg* reg);
```

```c
bool tea_has_module(tea_State* T, const char* module);
```

### `tea_check_type`

```c
void tea_check_type(tea_State* T, int index, int type);
```

Checks whether the function argument `index` has type `type`. See `tea_get_type` for the encoding of types for `type`

```c
void tea_check_any(tea_State* T, int index);
```

### `tea_check_number`

```c
tea_Number tea_check_number(tea_State* T, int index);
```

Checks whether the function argument `index` is a number and returns this number.

```c
bool tea_check_bool(tea_State* T, int index);
```

```c
void tea_check_range(tea_State* T, int index, double* start, double* end, double* step);
```

```c
const char* tea_check_lstring(tea_State* T, int index, int* len);
```

```c
TeaCFunction tea_check_cfunction(tea_State* T, int index);
```

```c
void* tea_check_userdata(tea_State* T, int index);
```

```c
void tea_opt_any(tea_State* T, int index);
```

```c
bool tea_opt_bool(tea_State* T, int index, bool def);
```

### `tea_opt_number`

```c
double tea_opt_number(tea_State* T, int index, double def);
```

If the function argument `index` is a number, returns this number. If this argument is absent or is `nil`, returns `def`. Otherwise, raises an error.

### `tea_opt_lstring`

```c
const char* tea_opt_lstring(tea_State* T, int index, const char* def, int* len);
```

If the function argument `index` is a string, returns the string. If this argument is absent or `nil`, returns `def`. Otherwise raises an error.

If `len` is not `NULL`, fills the position `len` with the result's length. If the result is `NULL` (only possible when returning `def` and `def == NULL`) its length is considered zero.

```c
int tea_check_option(tea_State* T, int index, const char* def, const char* const options[]);
```

```c
int tea_gc(tea_State* T);
```

```c
int tea_dofile(tea_State* T, const char* path);
```

### `tea_call`

```c
void tea_call(tea_State* T, int n);
```

Calls a function.

To call a function you must use the following protocol: first, the function to be called is pushed onto the stack; then, the arguments to the function are pushed in direct order; that is, the first argument is pushed first. Finally, you can call `tea_call`

Any error inside the called function is propagated upwards.

The following example shows how the host program can do the equivalent to this Teascript code:

```tea
var a = f(1, "hello", [1, 2, 3])
```

Here it is in C:

```c

```

### `tea_error`

```c
void tea_error(tea_State* T, const char* fmt, ...);
```

Raises an error.

The error message format is given by `fmt` plus any extra arguments, following the same rules of `tea_push_fstring`.

This function never returns.