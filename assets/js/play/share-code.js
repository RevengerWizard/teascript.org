// Store shared snippets as compressed UTF-8 in a URL-safe base64 parameter.
window.encodePlayCode = async function (code) {
	if(typeof CompressionStream === "undefined") return null;
	const stream = new Blob([code]).stream().pipeThrough(new CompressionStream("deflate"));
	const bytes = new Uint8Array(await new Response(stream).arrayBuffer());
	let binary = "";
	for(let i = 0; i < bytes.length; i += 0x8000)
	{
		binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
	}
	return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

window.encodePlayCodeParam = async function (code) {
	const plain = encodeURIComponent(code);
	const compressed = await window.encodePlayCode(code);
	return compressed && compressed.length + 1 < plain.length ? `~${compressed}` : plain;
};

window.decodePlayCode = async function (encoded) {
	const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
	const binary = atob(base64 + "=".repeat((4 - base64.length % 4) % 4));
	const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
	const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate"));
	return new Response(stream).text();
};
