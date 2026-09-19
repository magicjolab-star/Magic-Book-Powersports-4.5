const CACHE_NAME = 'magic-book-powersports-v460';
const APP_SHELL = ['/', '/index-360.html?v=460', '/style-330.css?v=460', '/style-352.css?v=460', '/style-360.css?v=460', '/accessory-350.css?v=460', '/data-330.js?v=460', '/app-330.js?v=460', '/accessory-350.js?v=460', '/auth-352.js?v=460', '/premium-360.js?v=460', '/flow-361.js?v=460', '/flow-core-361.js?v=460', '/auth-otp-guard.js?v=460', '/optional-access-365.js?v=460', '/manifest.webmanifest?v=460'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || event.request.method !== 'GET') return;

  if (url.pathname.startsWith('/api/') || url.pathname.endsWith('.html') || url.pathname === '/' || url.pathname === '/assets/17525.mp4' || url.pathname === '/magic-book-final-512.webp') {
    event.respondWith(fetch(event.request, { cache: 'no-store' }).catch(() => {
      if (event.request.mode === 'navigate') return caches.match('/index-360.html?v=460');
      return caches.match(event.request);
    }));
    return;
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request, { cache: 'no-store' }).catch(() => caches.match('/index-360.html?v=460')));
    return;
  }

  if (url.pathname === '/manifest.webmanifest') {
    event.respondWith(fetch(event.request, { cache: 'reload' }).then(response => {
      const copy = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
      return response;
    }).catch(() => caches.match(event.request)));
    return;
  }

  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request)));
});