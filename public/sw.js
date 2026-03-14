self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Just pass through for now, as MVP doesn't fully need offline caching
  event.respondWith(fetch(event.request));
});
