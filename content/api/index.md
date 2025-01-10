---
title: C API
---

```c
typedef void* (*TeaAlloc)(void* ud, 
                          void* ptr, 
                          size_t osize, 
                          size_t nsize);
```

```c
typedef void (*TeaCFunction)(TeaState* T);
```

Type for C functions.

```c
TeaState* tea_new_state(TeaAlloc f, void* ud);
```

```c
TeaState* tea_new_state(TeaAlloc f, void* ud);
```

```c
void tea_close(TeaState* T);
```

```c
void tea_set_argv(TeaState* T, int argc, char** argv, int argf);
```

```c
void tea_set_repl(TeaState* T, bool b);
```

```c
TeaCFunction tea_atpanic(TeaState* T, TeaCFunction panicf);
```

```c
TeaAlloc tea_get_allocf(TeaState* T, void** ud);
```

```c
void tea_set_allocf(TeaState* T, TeaAlloc f, void* ud);
```

```c
int tea_get_top(TeaState* T);
```

```c
void tea_set_top(TeaState* T, int index);
```

```c
void tea_push_value(TeaState* T, int index);
```

```c
void tea_remove(TeaState* T, int index);
```

```c
void tea_insert(TeaState* T, int index);
```

```c
void tea_replace(TeaState* T, int index);
```

```c
void tea_copy(TeaState* T, int from_index, int to_index);
```

```c
int tea_type(TeaState* T, int index);
```

```c
const char* tea_type_name(TeaState* T, int index);
```

```c
double tea_get_number(TeaState* T, int index);
```

```c
bool tea_get_bool(TeaState* T, int index);
```

```c
void tea_get_range(TeaState* T, int index, double* start, double* end, double* step);
```

```c
const char* tea_get_lstring(TeaState* T, int index, int* len);
```

```c
bool tea_is_object(TeaState* T, int index);
```

```c
bool tea_is_cfunction(TeaState* T, int index);
```

```c
bool tea_to_bool(TeaState* T, int index);
```

```c
double tea_to_numberx(TeaState* T, int index, bool* is_num);
```

```c
const char* tea_to_lstring(TeaState* T, int index, int* len);
```

```c
TeaCFunction tea_to_cfunction(TeaState* T, int index);
```

```c
void* tea_to_userdata(TeaState* T, int index);
```

```c
bool tea_equal(TeaState* T, int index1, int index2);
```

```c
bool tea_rawequal(TeaState* T, int index1, int index2);
```

```c
void tea_concat(TeaState* T);
```

```c
void tea_pop(TeaState* T, int n);
```

```c
void tea_push_null(TeaState* T);
```

```c
void tea_push_true(TeaState* T);
```

```c
void tea_push_false(TeaState* T);
```

```c
void tea_push_bool(TeaState* T, bool b);
```

```c
void tea_push_number(TeaState* T, double n);
```

```c
const char* tea_push_lstring(TeaState* T, const char* s, int len);
```

```c
const char* tea_push_string(TeaState* T, const char* s);
```

```c
const char* tea_push_fstring(TeaState* T, const char* fmt, ...);
```

```c
const char* tea_push_vfstring(TeaState* T, const char* fmt, va_list args);
```

```c
void tea_push_range(TeaState* T, double start, double end, double step);
```

```c
void tea_push_cfunction(TeaState* T, TeaCFunction fn);
```

```c
void tea_new_list(TeaState* T);
```

```c
void tea_new_map(TeaState* T);
```

```c
void* tea_new_userdata(TeaState* T, size_t size);
```

```c
void tea_create_class(TeaState* T, const char* name, const TeaClass* klass);
```

```c
void tea_create_module(TeaState* T, const char* name, const TeaModule* module);
```

```c
int tea_len(TeaState* T, int index);
```

```c
void tea_add_item(TeaState* T, int list);
```

```c
void tea_get_item(TeaState* T, int list, int index);
```

```c
void tea_set_item(TeaState* T, int list, int index);
```

```c
bool tea_get_field(TeaState* T, int obj);
```

```c
void tea_set_field(TeaState* T, int obj);
```

```c
bool tea_get_key(TeaState* T, int obj, const char* key);
```

```c
void tea_set_key(TeaState* T, int obj, const char* key);
```

```c
bool tea_get_global(TeaState* T, const char* name);
```

```c
void tea_set_global(TeaState* T, const char* name);
```

```c
void tea_set_funcs(TeaState* T, const TeaReg* reg);
```

```c
bool tea_has_module(TeaState* T, const char* module);
```

```c
void tea_set_instanceud(TeaState* T, int index);
```

```c
void tea_check_type(TeaState* T, int index, int type);
```

```c
void tea_check_any(TeaState* T, int index);
```

```c
double tea_check_number(TeaState* T, int index);
```

```c
bool tea_check_bool(TeaState* T, int index);
```

```c
void tea_check_range(TeaState* T, int index, double* start, double* end, double* step);
```

```c
const char* tea_check_lstring(TeaState* T, int index, int* len);
```

```c
TeaCFunction tea_check_cfunction(TeaState* T, int index);
```

```c
void* tea_check_userdata(TeaState* T, int index);
```

```c
void tea_opt_any(TeaState* T, int index);
```

```c
bool tea_opt_bool(TeaState* T, int index, bool def);
```

```c
double tea_opt_number(TeaState* T, int index, double def);
```

```c
const char* tea_opt_lstring(TeaState* T, int index, const char* def, int* len);
```

```c
int tea_check_option(TeaState* T, int index, const char* def, const char* const options[]);
```

```c
void tea_openf(TeaState* T, const char* mod, TeaCFunction openf, bool glb);
```

```c
int tea_gc(TeaState* T);
```

```c
int tea_interpret(TeaState* T, const char* module_name, const char* source);
```

```c
int tea_dofile(TeaState* T, const char* path);
```

```c
void tea_call(TeaState* T, int n);
```

```c
void tea_error(TeaState* T, const char* fmt, ...);
```