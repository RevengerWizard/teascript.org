let memory, ctrl, data, flush_output, wasmExports;
let wasmUrl;
let pending = new Uint8Array(0);
const decoders = { 1: new TextDecoder(), 2: new TextDecoder() };

async function get_wasm()
{
	if(wasmExports) return wasmExports;
	const response = await fetch(wasmUrl);
	const result = await WebAssembly.instantiateStreaming(response, make_imports()).catch(async () =>
		WebAssembly.instantiate(await (await fetch(wasmUrl)).arrayBuffer(), make_imports()));
	wasmExports = result.instance.exports;
	memory = wasmExports.memory;
	flush_output = typeof wasmExports.fflush === "function" ? wasmExports.fflush : null;
	return wasmExports;
}

function make_imports()
{
	const wasi = {
		clock_res_get(id, ptr) {
			if(id !== 0 && id !== 1) return 28;
			new DataView(memory.buffer).setBigUint64(Number(ptr), 1n, true);
			return 0;
		},
		clock_time_get(id, precision, ptr) {
			let ms;
			if(id === 0) ms = Date.now();
			else if(id === 1) ms = performance.timeOrigin + performance.now();
			else return 28;
			new DataView(memory.buffer).setBigUint64(Number(ptr), BigInt(Math.floor(ms * 1e6)), true);
			return 0;
		},
		fd_read(fd, iovsPtr, iovsLen, nreadPtr) {
			if(fd !== 0) return 8;

            if(pending.length === 0)
            {
				// Flush C stdio just in case
				if(flush_output) flush_output(0);
				Atomics.store(ctrl, 0, 0);
				postMessage({ type: "stdin" });
				Atomics.wait(ctrl, 0, 0);          // blocks until main thread sets ctrl[0] = 1
				pending = data.slice(0, ctrl[1]);  // length 0 => EOF
			}

			const iovs = new Uint32Array(memory.buffer, iovsPtr, iovsLen * 2);
			let off = 0, total = 0;
            for(let i = 0; i < iovsLen * 2 && off < pending.length; i += 2)
            {
				const n = Math.min(iovs[i + 1], pending.length - off);
				new Uint8Array(memory.buffer, iovs[i], n).set(pending.subarray(off, off + n));
				off += n;
				total += n;
			}
			pending = pending.subarray(off);
			new DataView(memory.buffer).setInt32(nreadPtr, total, true);
			return 0;
		},
		fd_write(fd, iovsPtr, iovsLen, nwrittenPtr) {
			const iovs = new Uint32Array(memory.buffer, iovsPtr, iovsLen * 2);
			const dec = decoders[fd] || decoders[2];
			let text = "", bytes = 0;
            for(let i = 0; i < iovsLen * 2; i += 2)
            {
				// stream:true keeps multi-byte UTF-8 sequences split across writes intact
				text += dec.decode(new Uint8Array(memory.buffer, iovs[i], iovs[i + 1]), { stream: true });
				bytes += iovs[i + 1];
			}
			new DataView(memory.buffer).setInt32(nwrittenPtr, bytes, true);
			postMessage({ type: "out", text, error: fd !== 1 });
			return 0;
		}
	};
	return {
		wasi_snapshot_preview1: new Proxy(wasi, { get: (t, n) => t[n] || (() => 0) }),
		env: new Proxy({ clock: () => BigInt(Math.trunc(performance.now() * 1000)) },
		               { get: (t, n) => t[n] || (() => 0) })
	};
}

onmessage = async (e) => {
	const { code, sab, wasm } = e.data;
	wasmUrl = new URL(wasm, self.location.href);
	ctrl = new Int32Array(sab, 0, 2);
	data = new Uint8Array(sab, 8);
	pending = new Uint8Array(0);
	decoders[1] = new TextDecoder();
	decoders[2] = new TextDecoder();

    try
    {
		const wasm = await get_wasm();

		const bytes = new TextEncoder().encode(code);
		const ptr = wasm.malloc(bytes.length + 1);
		new Uint8Array(memory.buffer, ptr, bytes.length).set(bytes);
		new Uint8Array(memory.buffer, ptr + bytes.length, 1)[0] = 0;

		const status = wasm.tea_demo(ptr);
		wasm.free(ptr);
		postMessage({ type: "done", status });
    }
    catch(err)
    {
		postMessage({ type: "trap", message: String(err.message || err) });
	}
};
