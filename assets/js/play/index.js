// Helpers                                                             */

async function get_contents(url)
{
	const response = await fetch(url);
	if(!response.ok) throw new Error("HTTP " + response.status);
	return response.text();
}

function set_editor_text(text)
{
	editor.setValue(text);
	editor.clearSelection();
}

// Service worker (COOP/COEP for SharedArrayBuffer)

const workerUrl = document.querySelector('meta[name="play-worker-url"]')?.content;
const modeUrl = document.querySelector('meta[name="play-mode-url"]')?.content;
const serviceWorkerUrl = document.querySelector('meta[name="play-sw-url"]')?.content;
const wasmUrl = document.querySelector('meta[name="play-wasm-url"]')?.content;

if ("serviceWorker" in navigator && window.isSecureContext && serviceWorkerUrl)
{
	navigator.serviceWorker.addEventListener("controllerchange", function () {
		window.location.reload();
	}, { once: true });
	navigator.serviceWorker.register(serviceWorkerUrl, { scope: "/play/" }).catch(function (error) {
		console.error("COOP/COEP service worker registration failed:", error);
	});
}

// Editor

ace.config.setModuleUrl("ace/mode/tea", modeUrl);

const editor = ace.edit("editor", {
	theme: "ace/theme/tea",
	fontSize: "14px",
	wrap: true,
	tabSize: 4,
	useSoftTabs: false,
	autoScrollEditorIntoView: true
});

editor.session.setMode("ace/mode/tea");
editor.session.setUseWorker(false);
editor.renderer.setScrollMargin(10, 10);

const params = new URLSearchParams(window.location.search);
const githubPath = params.get("github");
const initialCode = params.get("code");

if(githubPath != null)
{
	get_contents(`https://cdn.jsdelivr.net/gh/${githubPath}`)
		.then(set_editor_text)
		.catch(function (error) {
			console.error("Could not load snippet from GitHub:", error);
		});
}
else if(initialCode != null)
{
	if(initialCode.startsWith("~"))
	{
		window.decodePlayCode(initialCode.slice(1))
			.then(set_editor_text)
			.catch(function (error) {
				write_output("Could not decode shared code: " + (error.message || String(error)) + "\n", true);
			});
	}
	else set_editor_text(initialCode);
}

// Terminal

const terminalElement = document.getElementById("terminal");
const terminal = new Terminal({
	convertEol: true,
	fontFamily: "monospace",
	fontSize: 14,
	scrollOnUserInput: true,
	scrollback: 3000,
	theme: { background: "#000000", foreground: "#ffffff" }
});
const fitAddon = new FitAddon.FitAddon();
terminal.loadAddon(fitAddon);
terminal.open(terminalElement);

function fit_terminal()
{
    try
    {
		fitAddon.fit();
    }
    catch (error)
    {
		// Container may be hidden or have zero size; ignore until it is visible.
	}
}

fit_terminal();
window.addEventListener("resize", fit_terminal);
if(typeof ResizeObserver !== "undefined")
{
	new ResizeObserver(fit_terminal).observe(terminalElement);
}

function write_output(text, error)
{
	terminal.write(error ? "\x1b[31m" + text + "\x1b[0m" : text);
}

// Worker / stdin handling

const encoder = new TextEncoder();

let worker = null;
let inputBuffer = null;
let inputControl = null;
let waitingForInput = false;
let running = false;
let inputLine = "";
let runGeneration = 0;
const runButton = document.getElementById("run");

function set_run_button_state(isRunning)
{
	runButton.classList.toggle("is-running", isRunning);
	runButton.setAttribute("aria-label", isRunning ? "Stop program" : "Run program");
	runButton.title = isRunning ? "Stop program" : "Run program";
}

// Bytes available for one stdin delivery (buffer minus the 8-byte header).
function input_capacity()
{
	return inputBuffer.byteLength - 8;
}

// Hand bytes to the worker blocked in fd_read. An empty array signals EOF.
function send_input(bytes)
{
	new Uint8Array(inputBuffer, 8).set(bytes);
	Atomics.store(inputControl, 1, bytes.length);
	Atomics.store(inputControl, 0, 1);
	Atomics.notify(inputControl, 0);
	waitingForInput = false;
	inputLine = "";
}

function submit_input()
{
	if(!waitingForInput) return;
	const bytes = encoder.encode(inputLine + "\n");
    if(bytes.length > input_capacity())
    {
		terminal.write("\x07");
		return;
	}
	terminal.write("\r\n");
	send_input(bytes);
}

function erase_last_char()
{
	if(inputLine.length === 0) return;
	const chars = Array.from(inputLine);
	chars.pop();
	inputLine = chars.join("");
	terminal.write("\b \b");
}

function append_char(char)
{
	const nextLine = inputLine + char;
	// Keep one byte free for the trailing newline.
    if(encoder.encode(nextLine).length + 1 > input_capacity())
    {
		terminal.write("\x07");
		return;
	}
	inputLine = nextLine;
	terminal.write(char);
}

terminal.onData(function(input) {
	if(!waitingForInput) return;
	// Ignore escape sequences (arrows, delete, ...); this is a simple line editor.
	if(input.includes("\u001b")) return;

    for(const char of input)
    {
		if(!waitingForInput) break; // input was submitted mid-paste

		if(char === "\r" || char === "\n") submit_input();
		else if(char === "\x7f" || char === "\b") erase_last_char();
		else if(char >= " ") append_char(char);
	}
});

function reset_run_state()
{
	waitingForInput = false;
	running = false;
	inputLine = "";
	set_run_button_state(false);
}

function kill_worker()
{
	if(worker) worker.terminate();
	worker = null;
}

async function start_worker()
{
    if(typeof SharedArrayBuffer === "undefined" || !crossOriginIsolated)
    {
		write_output("Terminal input requires SharedArrayBuffer. Serve this page with cross-origin isolation enabled.\n", true);
		return false;
	}

	const workerScriptUrl = new URL(workerUrl, location.href);
	if(workerScriptUrl.origin !== location.origin)
	{
		write_output("Teascript worker must be served from this site: " + workerScriptUrl.href + "\n", true);
		return false;
	}

    try
    {
		const response = await fetch(workerScriptUrl, { cache: "no-store" });
        if(!response.ok)
        {
			throw new Error("HTTP " + response.status + " while loading " + workerScriptUrl.pathname);
		}
    }
    catch (error)
    {
		write_output("Could not load Teascript worker (" + workerScriptUrl.href + "): " + (error.message || String(error)) + "\n", true);
		return false;
	}

    try
    {
		worker = new Worker(workerScriptUrl, { type: "module", name: "teascript-playground" });
    }
    catch (error)
    {
		write_output("Could not start Teascript worker: " + (error.message || String(error)) + "\n", true);
		return false;
	}

	worker.onmessage = function (event) {
		const message = event.data;
        switch (message.type)
        {
			case "out":
				write_output(message.text, message.error);
				break;
			case "stdin":
				waitingForInput = true;
				inputLine = "";
				terminal.focus();
				break;
			case "done":
				reset_run_state();
				if(message.status !== 0) write_output("Teascript returned error status " + message.status + "\n", true);
				else write_output("\n");
				break;
			case "trap":
				reset_run_state();
				write_output("Teascript trapped: " + message.message + "\n", true);
				kill_worker();
				break;
		}
	};

	worker.onerror = function (event) {
		reset_run_state();
		const detail = event.message || (event.error && event.error.message) || "Worker script could not be evaluated or loaded (check the browser console for CSP, MIME type, or network errors)";
		const where = event.filename ? " (" + event.filename + ":" + event.lineno + ")" : "";
		write_output("Worker failed at " + workerScriptUrl.href + ": " + detail + where + "\n", true);
		kill_worker();
	};

	worker.onmessageerror = function () {
		reset_run_state();
		write_output("Worker message could not be read by the page.\n", true);
		kill_worker();
	};

	return true;
}

// Actions (called from the page)

function clear_output()
{
	if(running) return;
	terminal.reset();
}

async function run_input()
{
	if(running)
	{
		stop_input();
		return;
	}
	clear_output();

	running = true;
	set_run_button_state(true);
	const generation = ++runGeneration;
    if(!worker && !await start_worker())
    {
		if(generation === runGeneration) reset_run_state();
		return;
	}
	if(generation !== runGeneration || !running) return;

	inputBuffer = new SharedArrayBuffer(8 + 65528);
	inputControl = new Int32Array(inputBuffer, 0, 2);
	worker.postMessage({ code: editor.getValue(), sab: inputBuffer, wasm: wasmUrl });
}

function stop_input()
{
	if(!running) return;
	++runGeneration;
	kill_worker();
	reset_run_state();
}

function share()
{
	const code = editor.getValue();
	const encoded = window.encodePlayCodeParam ? window.encodePlayCodeParam(code) : Promise.resolve(encodeURIComponent(code));
	encoded.then(function (value) {
		const arg = `?code=${value}`;
		const link = `${location.protocol}//${location.host}${location.pathname}${arg}`;
		return navigator.clipboard.writeText(link).then(function () {
		alert("Link to the snippet is in your clipboard now");
		window.history.pushState("", "", arg);
		}, function () {
		alert("Failed to copy the link to the clipboard");
		});
	}).catch(function () {
		const arg = `?code=${encodeURIComponent(code)}`;
		const link = `${location.protocol}//${location.host}${location.pathname}${arg}`;
		navigator.clipboard.writeText(link).then(function () {
			alert("Link to the snippet is in your clipboard now");
			window.history.pushState("", "", arg);
		}, function () { alert("Failed to copy the link to the clipboard"); });
	});
}

runButton.addEventListener("click", run_input);
document.getElementById("clear").addEventListener("click", clear_output);
document.getElementById("share").addEventListener("click", share);

const panes = document.querySelector(".play__panes");
const editorPane = document.querySelector(".play__editor-pane");
const terminalPane = document.querySelector(".play__terminal-pane");
const splitter = document.querySelector(".play__splitter");
let paneRatio = 0.5;
let resizeFrame = 0;

function set_pane_ratio(ratio)
{
	paneRatio = Math.min(0.8, Math.max(0.2, ratio));
	const vertical = window.matchMedia("(max-width: 760px)").matches;
	const available = (vertical ? panes.clientHeight - splitter.offsetHeight : panes.clientWidth - splitter.offsetWidth);
	editorPane.style.flex = `0 0 ${(available * paneRatio)}px`;
	terminalPane.style.flex = `1 1 ${(available * (1 - paneRatio))}px`;
	splitter.setAttribute("aria-valuenow", String(Math.round(paneRatio * 100)));
	splitter.setAttribute("aria-orientation", vertical ? "horizontal" : "vertical");
	if(!resizeFrame)
	{
		resizeFrame = requestAnimationFrame(function () {
			resizeFrame = 0;
			fit_terminal();
			editor.resize();
		});
	}
}

function move_splitter(event)
{
	const bounds = panes.getBoundingClientRect();
	if(window.matchMedia("(max-width: 760px)").matches)
		set_pane_ratio((event.clientY - bounds.top - splitter.offsetHeight / 2) / (bounds.height - splitter.offsetHeight));
	else
		set_pane_ratio((event.clientX - bounds.left - splitter.offsetWidth / 2) / (bounds.width - splitter.offsetWidth));
}

splitter.addEventListener("pointerdown", function (event) {
	event.preventDefault();
	splitter.classList.add("is-dragging");
	splitter.setPointerCapture(event.pointerId);
	splitter.addEventListener("pointermove", move_splitter);
});

function stop_splitter_drag(event)
{
	splitter.classList.remove("is-dragging");
	splitter.removeEventListener("pointermove", move_splitter);
	if(splitter.hasPointerCapture(event.pointerId)) splitter.releasePointerCapture(event.pointerId);
}

splitter.addEventListener("pointerup", stop_splitter_drag);
splitter.addEventListener("pointercancel", stop_splitter_drag);
splitter.addEventListener("keydown", function (event) {
	const vertical = window.matchMedia("(max-width: 760px)").matches;
	const decrease = vertical ? "ArrowUp" : "ArrowLeft";
	const increase = vertical ? "ArrowDown" : "ArrowRight";
	if(event.key !== decrease && event.key !== increase) return;
	event.preventDefault();
	set_pane_ratio(paneRatio + (event.key === increase ? 0.02 : -0.02));
});

window.addEventListener("resize", function () {
	set_pane_ratio(paneRatio);
});

set_pane_ratio(paneRatio);
