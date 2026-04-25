const SW_VERSION = 'vu-static-v1';
const STATIC_CACHE = SW_VERSION;

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== STATIC_CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith('/api') || url.pathname.startsWith('/auth') || url.pathname.includes('/locations/')) return;

  const allowedDestinations = new Set(['style', 'script', 'image', 'font', 'manifest']);
  const isAllowedAsset = allowedDestinations.has(request.destination) || url.pathname.startsWith('/icons/');

  if (!isAllowedAsset) return;

  event.respondWith(
    caches.open(STATIC_CACHE).then(async (cache) => {
      const cached = await cache.match(request);
      if (cached) return cached;

      const response = await fetch(request);
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
  );
});
