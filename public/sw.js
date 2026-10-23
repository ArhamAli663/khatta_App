const CACHE_NAME = 'khatta-offline-v5';

// Core shell assets to cache on install for 100% offline access
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  '/favicon.svg',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/apple-touch-icon.png'
];

// Precache shell on install
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
      .catch((err) => {
        console.warn('Precache notice:', err);
        return self.skipWaiting();
      })
  );
});

// Activate immediately and delete old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Listen for skip waiting messages
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Fetch handler - robust offline strategy
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith('http')) return;

  const url = new URL(event.request.url);

  // Skip APK, binary downloads & Firebase realtime websocket / auth endpoints
  if (
    url.pathname.endsWith('.apk') ||
    url.pathname.endsWith('.bin') ||
    url.pathname.endsWith('.zip') ||
    url.hostname.includes('identitytoolkit') ||
    url.hostname.includes('firebaseio.com') ||
    url.hostname.includes('firestore.googleapis.com')
  ) {
    return;
  }

  // 1. Navigation / HTML requests (Opening the app, refreshing, navigating)
  if (event.request.mode === 'navigate' || url.pathname === '/' || url.pathname.endsWith('.html')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(async () => {
          // OFFLINE: Return cached page or fallback to index.html
          const cached = await caches.match(event.request);
          if (cached) return cached;
          const fallback = await caches.match('/index.html');
          if (fallback) return fallback;
          return caches.match('/');
        })
    );
    return;
  }

  // 2. Static Assets (JS bundles, CSS, Google Fonts, Icons) - Cache-First with Background Revalidation
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Revalidate in background if online
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        })
        .catch(() => {
          // Network failed (offline)
          return cachedResponse;
        });

      // If cached, return immediately for instant offline response! Otherwise await network
      return cachedResponse || fetchPromise;
    })
  );
});
