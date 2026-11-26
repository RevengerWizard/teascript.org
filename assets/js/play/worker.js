import { WasiPreview1 } from "./wasi.js";
import { loadDirectoryFS } from "./dir.js";

let memory;
let wasmUrl;
let ctrl;
let inputData;
let wasmExports;
let wasi;
let pending = new Uint8Array(0);
const decoders = { 1: new TextDecoder(), 2: new TextDecoder() };

function sleep_ms(milliseconds)
{
	if(milliseconds <= 0) return;
	if(wasmExports && typeof wasmExports.fflush === "function") wasmExports.fflush(0);
	const sleeper = new Int32Array(new SharedArrayBuffer(4));
	Atomics.wait(sleeper, 0, 0, Math.min(milliseconds, 2147483647));
}

function make_imports(fs)
{
	wasi = new WasiPreview1({ sleepMs: sleep_ms, fs });
	wasi.stdout = function (bytes) {
		postMessage({ type: "out", text: decoders[1].decode(bytes, { stream: true }), error: false });
	};
	wasi.stderr = function (bytes) {
		postMessage({ type: "out", text: decoders[2].decode(bytes, { stream: true }), error: true });
	};
	wasi.stdin = function () {
		Atomics.store(ctrl, 0, 0);
		postMessage({ type: "stdin" });
		Atomics.wait(ctrl, 0, 0);
		return inputData.slice(0, ctrl[1]);
	};

	return {
		wasi_snapshot_preview1: new Proxy(wasi, {
			get: (target, name) => target[name] || (() => 0)
		}),
		env: new Proxy({
			clock: () => BigInt(Math.trunc(performance.now() * 1000)),
			sleep: seconds => sleep_ms(Number(seconds) * 1000),
			usleep: microseconds => sleep_ms(Number(microseconds) / 1000)
		}, { get: (target, name) => target[name] || (() => 0) })
	};
}

async function get_wasm()
{
	if(wasmExports) return wasmExports;
	const fs = await loadDirectoryFS(
		new URL("./fs/", self.location.href).href,
		new URL("./fs/index.json", self.location.href).href
	);
	const imports = make_imports(fs);
	const { wasmBytes } = currentRun;
	const result = await WebAssembly.instantiate(wasmBytes, imports);
	wasmExports = result.instance.exports;
	memory = wasmExports.memory;
	wasi.setup(wasmExports);
	if(typeof wasmExports._initialize === "function") wasmExports._initialize();
	return wasmExports;
}

let currentRun;

onmessage = async event => {
	const { code, mode, args, sab, wasm, wasmBytes } = event.data;
	currentRun = { wasmBytes };
	wasmUrl = new URL(wasm, self.location.href);
	ctrl = new Int32Array(sab, 0, 2);
	inputData = new Uint8Array(sab, 8);
	pending = new Uint8Array(0);
	decoders[1] = new TextDecoder();
	decoders[2] = new TextDecoder();

	try
	{
		const exports = await get_wasm();
		let status;
		if(mode === "tea")
		{
			const main = exports.tea_cli || exports.tea_repl;
			if(typeof main !== "function")
				throw new Error("WASM does not export tea_cli (exports: " + Object.keys(exports).join(", ") + ")");
			const bytes = new TextEncoder().encode(args + "\0");
			const ptr = exports.malloc(bytes.length);
			new Uint8Array(memory.buffer, ptr, bytes.length).set(bytes);
			status = main(ptr);
			exports.free(ptr);
		}
		else
		{
			const bytes = new TextEncoder().encode(code);
			const ptr = exports.malloc(bytes.length + 1);
			new Uint8Array(memory.buffer, ptr, bytes.length).set(bytes);
			new Uint8Array(memory.buffer, ptr + bytes.length, 1)[0] = 0;
			status = exports.tea_demo(ptr);
			exports.free(ptr);
		}
		postMessage({ type: "done", status });
	}
	catch(error)
	{
		postMessage({ type: "trap", message: String(error.message || error) });
	}
};
