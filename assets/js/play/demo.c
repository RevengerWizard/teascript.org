#include <tea.h>
#include <stdio.h>
#include <string.h>

int tea_demo(const char* program)
{
    tea_State *T = tea_open();
    int s;
    if(!T || !program)
        return -1;
    s = tea_load_buffer(T, program, strlen(program), "=<browser>");
    if(s == TEA_OK)
        s = tea_pcall(T, 0);
    if(s != TEA_OK)
        fprintf(stderr, "%s\n", tea_to_string(T, -1));
    fflush(stdin);
    fflush(stdout);
    fflush(stderr);
    tea_close(T);
    return s;
}
