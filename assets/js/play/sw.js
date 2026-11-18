self.addEventListener("install", function() {
	self.skipWaiting();
});

self.addEventListener("activate", function(event) {
	event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", function(event) {
	if(event.request.cache === "only-if-cached" && event.request.mode !== "same-origin") return;
	if(new URL(event.request.url).origin !== self.location.origin) return;

	event.respondWith(fetch(event.request).then(function(response) {
		// Keep page, worker, and WASM responses under the same isolation policy.
		const headers = new Headers(response.headers);
		headers.set("Cross-Origin-Embedder-Policy", "require-corp");
		headers.set("Cross-Origin-Opener-Policy", "same-origin");
		return new Response(response.body, {
			status: response.status,
			statusText: response.statusText,
			headers: headers
		});
	}));
});
