import { WasiPreview1 } from "./wasi.js";

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

function make_imports()
{
	wasi = new WasiPreview1({ sleepMs: sleep_ms });
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
	const imports = make_imports();
	let result;
	try
	{
		result = await WebAssembly.instantiateStreaming(fetch(wasmUrl), imports);
	}
	catch
	{
		const response = await fetch(wasmUrl);
		result = await WebAssembly.instantiate(await response.arrayBuffer(), imports);
	}
	wasmExports = result.instance.exports;
	memory = wasmExports.memory;
	wasi.setup(wasmExports);
	return wasmExports;
}

onmessage = async event => {
	const { code, sab, wasm } = event.data;
	wasmUrl = new URL(wasm, self.location.href);
	ctrl = new Int32Array(sab, 0, 2);
	inputData = new Uint8Array(sab, 8);
	pending = new Uint8Array(0);
	decoders[1] = new TextDecoder();
	decoders[2] = new TextDecoder();

	try
	{
		const exports = await get_wasm();
		const bytes = new TextEncoder().encode(code);
		const ptr = exports.malloc(bytes.length + 1);
		new Uint8Array(memory.buffer, ptr, bytes.length).set(bytes);
		new Uint8Array(memory.buffer, ptr + bytes.length, 1)[0] = 0;
		const status = exports.tea_demo(ptr);
		exports.free(ptr);
		postMessage({ type: "done", status });
	}
	catch(error)
	{
		postMessage({ type: "trap", message: String(error.message || error) });
	}
};