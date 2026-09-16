/**
 * Service worker for the offline-capable PWA shell.
 *
 * Precaches the small, stable app shell (the HTML entry point, manifest and
 * icons) so the app still opens — including deep links like /vehicle/123 —
 * when there's no connection. Build output under /assets/ gets a content
 * hash per build, so it can't be precached by name; it's cached at runtime
 * instead (stale-while-revalidate) so repeat visits stay fast while still
 * picking up new deploys.
 *
 * Crucially, requests to data.gov.il / wikipedia.org are never cached here:
 * this app's whole purpose is showing live vehicle data, and a stale cached
 * answer would be actively misleading, worse than a network error.
 */

const CACHE_VERSION = 'v1';
const CACHE_NAME = `plate-lookup-shell-${CACHE_VERSION}`;

const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-512-maskable.png',
  '/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

/** Navigations: try the network first (fresh routing/HTML), fall back to the cached shell offline. */
async function networkFirstNavigation(request) {
  try {
    return await fetch(request);
  } catch {
    const cache = await caches.open(CACHE_NAME);
    // Deep links (e.g. /vehicle/8491639) aren't individually precached; the
    // cached '/' shell is the SPA entry point and client-side routing takes
    // it from there once the app boots.
    return (await cache.match('/')) ?? (await cache.match('/index.html'));
  }
}

/** Hashed same-origin build assets: serve from cache instantly, refresh in the background. */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  const networkFetch = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => cached);
  return cached ?? networkFetch;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Cross-origin (data.gov.il, wikipedia.org, ...): always hit the network.
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Other precached shell files (manifest, icons): cache-first, network fallback.
  event.respondWith(caches.match(request).then((cached) => cached ?? fetch(request)));
});
