const CACHE_NAME = "sic-v6";
const MAX_CACHED_ENTRIES = 30;
const ASSETS = [
  "/",
  "/downloads.html",
  "/favicon.ico",
  "/manifest.json",
  "/assets/logo.svg",
  "/assets/screenshot-450w.webp",
  "/assets/screenshot.webp",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))),
    ).then(() => self.clients.claim()),
  );
});

const CACHEABLE_TYPES = new Set([
  "text/css",
  "application/javascript",
  "application/json",
  "image/svg+xml",
  "image/webp",
  "image/png",
  "image/x-icon",
]);

function isCacheableResponse(response) {
  if (!response.ok || response.type === "opaque") return false;
  const contentType = response.headers.get("Content-Type");
  if (!contentType) return false;
  const mimeType = contentType.split(";")[0].trim();
  return CACHEABLE_TYPES.has(mimeType);
}

self.addEventListener("fetch", (event) => {
  if (!event.request.url.startsWith(self.location.origin)) return;
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (isCacheableResponse(response)) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
            cache.keys().then((keys) => {
              if (keys.length > MAX_CACHED_ENTRIES) cache.delete(keys[0]);
            });
          });
        }
        return response;
      })
      .catch(() => caches.match(event.request)),
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "skipWaiting") {
    self.skipWaiting();
  }
});
