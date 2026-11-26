#include <tea.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define main tea_main
#include <tea.c>

int tea_cli(const char* arguments)
{
	char buffer[1024];
	char* argv[32];
	char* out = buffer;
	const char* p = arguments ? arguments : "";
	int argc = 1;
	argv[0] = "tea";
	while(*p && argc < 31)
	{
		char quote = '\0';
		while(*p == ' ' || *p == '\t') p++;
		if(!*p) break;
		argv[argc++] = out;
		while(*p && (quote || (*p != ' ' && *p != '\t')))
		{
			if((*p == '\'' || *p == '"') && (!quote || quote == *p))
			{
				quote = quote ? '\0' : *p;
				p++;
			}
			else *out++ = *p++;
			if(out >= buffer + sizeof(buffer) - 2) return -1;
		}
		if(quote) return -1;
		*out++ = '\0';
	}
	if(*p) return -1;
	if(argc == 1) argv[argc++] = "-i";
	argv[argc] = NULL;
	return tea_main(argc, argv);
}

int tea_repl(void)
{
	return tea_cli("");
}

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
