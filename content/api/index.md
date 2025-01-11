---
title: C API
---

```c
typedef void* (*tea_Alloc)(void* ud, 
                          void* ptr, 
                          size_t osize, 
                          size_t nsize);
```

```c
typedef void (*tea_CFunction)(tea_State* T);
```

Type for C functions.

```c
tea_State* tea_new_state(tea_Alloc f, void* ud);
```

```c
void tea_close(tea_State* T);
```

```c
void tea_set_argv(tea_State* T, int argc, char** argv, int argf);
```

```c
void tea_CFunction tea_atpanic(tea_State* T, tea_CFunction panicf);
```

```c
tea_Alloc tea_get_allocf(tea_State* T, void** ud);
```

```c
void tea_set_allocf(tea_State* T, tea_Alloc f, void* ud);
```

```c
int tea_absindex(tea_State* T, int index);
```

```c
void tea_pop(tea_State* T, int n);
```

```c
int tea_get_top(tea_State* T);
```

```c
void tea_set_top(tea_State* T, int index);
```

```c
void tea_push_value(tea_State* T, int index);
```

```c
void tea_remove(tea_State* T, int index);
```

```c
void tea_insert(tea_State* T, int index);
```

```c
void tea_replace(tea_State* T, int index);
```

```c
void tea_copy(tea_State* T, int from_index, int to_index);
```

```c
void tea_swap(tea_State* T, int index1, int index2);
```

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

```c
bool tea_is_cfunction(tea_State* T, int index);
```

```c
bool tea_to_bool(tea_State* T, int index);
```

```c
tea_Number tea_to_numberx(tea_State* T, int index, bool* is_num);
```

```c
tea_Number tea_to_numberx(tea_State* T, int index);
```

```c
tea_Integer tea_to_integerx(tea_State* T, int index, bool* is_num);
```

```c
tea_Integer tea_to_integer(tea_State* T, int index);
```

```c
const void* tea_to_pointer(tea_State* T, int index);
```

```c
void* tea_to_userdata(tea_State* T, int index);
```

```c
const char* tea_to_lstring(tea_State* T, int index, size_t* len);
```

```c
const char* tea_to_string(tea_State* T, int index);
```

```c
TeaCFunction tea_to_cfunction(tea_State* T, int index);
```

```c
bool tea_equal(tea_State* T, int index1, int index2);
```

```c
bool tea_rawequal(tea_State* T, int index1, int index2);
```

```c
void tea_concat(tea_State* T);
```

```c
void tea_push_nil(tea_State* T);
```

```c
void tea_push_true(tea_State* T);
```

```c
void tea_push_false(tea_State* T);
```

```c
void tea_push_bool(tea_State* T, bool b);
```

```c
void tea_push_number(tea_State* T, tea_Number n);
```

```c
void tea_push_integer(tea_State* T, tea_Integer n);
```

```c
const char* tea_push_lstring(tea_State* T, const char* s, size_t len);
```

```c
const char* tea_push_string(tea_State* T, const char* s);
```

```c
const char* tea_push_fstring(tea_State* T, const char* fmt, ...);
```

```c
const char* tea_push_vfstring(tea_State* T, const char* fmt, va_list args);
```

```c
void tea_push_range(tea_State* T, tea_Number start, tea_Number end, tea_Number step);
```

```c
void tea_push_cfunction(tea_State* T, TeaCFunction fn, int nargs, int nopts);
```

```c
bool tea_get_udvalue(tea_State* T, int ud, int n);
```

```c
void tea_set_udvalue(tea_State* T, int ud, int n);
```

```c
void* tea_new_userdatav(tea_State* T, size_t size, int nuvs);
```

```c
void* tea_new_udatav(tea_State* T, size_t size, int nuvs, const char* name);
```

```c
void* tea_new_userdata(tea_State* T, size_t size);
```

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

```c
int tea_len(tea_State* T, int index);
```

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

```c
void tea_check_type(tea_State* T, int index, int type);
```

```c
void tea_check_any(tea_State* T, int index);
```

```c
double tea_check_number(tea_State* T, int index);
```

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

```c
double tea_opt_number(tea_State* T, int index, double def);
```

```c
const char* tea_opt_lstring(tea_State* T, int index, const char* def, int* len);
```

```c
int tea_check_option(tea_State* T, int index, const char* def, const char* const options[]);
```

```c
void tea_openf(tea_State* T, const char* mod, TeaCFunction openf, bool glb);
```

```c
int tea_gc(tea_State* T);
```

```c
int tea_dofile(tea_State* T, const char* path);
```

```c
void tea_call(tea_State* T, int n);
```

```c
void tea_error(tea_State* T, const char* fmt, ...);
```