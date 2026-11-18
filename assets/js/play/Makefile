# env variables
# WASI_SYSROOT should point to wasi-sdk
# LIBTEA_WASM should point to the relocatable WASM file for the Teascript interpreter

WASM_CC = clang --target=wasm32-wasip1 --sysroot=$(WASI_SYSROOT)
WASM_CFLAGS = -O2 -I. -D_WASI_EMULATED_SIGNAL -fno-stack-protector
WASM_LDFLAGS = -Wl,--export-all,--allow-undefined,--stack-first,-z,stack-size=1048576,-lsetjmp
TARGET = demo.wasm
GLUE_SRC = demo.c
GLUE_OBJ = demo.wasm.o

Q = @
E = @echo

all: $(TARGET)

$(GLUE_OBJ): $(GLUE_SRC)
	$(E) "WASM CC      $<"
	$(Q) $(WASM_CC) $(WASM_CFLAGS) -c -o $@ $<

$(TARGET): $(LIBTEA_WASM) $(GLUE_OBJ)
	$(E) "WASM LD      $@"
	$(Q) $(WASM_CC) $(WASM_LDFLAGS) -o $@ $(LIBTEA_WASM) $(GLUE_OBJ)
	$(E) "OK        Successfully built demo.wasm"
#@echo "WASM OPT     $@"
#@$(WASM_OPT) $(WASM_OPT_FLAGS) $@ -o $@

.PHONY: all clean

clean:
	$(RM) demo.o demo.wasm
