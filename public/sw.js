const CACHE_NAME = 'fullbalance-v6';
const ASSETS = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
  '/manifest.json',
];

// Install — cache app shell + force activate immediately
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate — remove ALL old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — NETWORK FIRST with SPA navigation fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and external requests
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  // For navigation requests (SPA routes like /dashboard, /auth, etc.)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .catch(() => caches.match('/index.html'))
        .then((res) => res || caches.match('/index.html'))
    );
    return;
  }

  // For other assets — network first, fallback to cache
  event.respondWith(
    fetch(request)
      .then((res) => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return res;
      })
      .catch(() => caches.match(request))
  );
});
