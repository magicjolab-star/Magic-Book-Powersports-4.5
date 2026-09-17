/**
 * ===================================================================================
 * MAGIC BOOK POWERSPORTS (par Magic app production)
 * Création originale, conception et développement par Jonathan Labelle, PDG.
 * Propriété intellectuelle exclusive de Jonathan Labelle / Magic app production.
 * Tous droits réservés.
 * ===================================================================================
 */

const CACHE_NAME = "magic-book-powersports-v400";

const CORE_ASSETS = [
  "/",
  "/index-400.html",
  "/manifest.webmanifest?v=400",
  "/native-bridge.js?v=400",
  "/pro-saas-400.js?v=400",
  "/style-pro-400.css?v=400",
  "/magic-book-final-192.webp",
  "/magic-book-final-512.webp",
  "/privacy.html",
  "/terms.html"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) =>
        Promise.allSettled(
          CORE_ASSETS.map((asset) =>
            cache.add(new Request(asset, { cache: "reload" }))
          )
        )
      )
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (
    request.method !== "GET" ||
    url.origin !== self.location.origin ||
    url.pathname.startsWith("/api/") ||
    url.pathname === "/sw.js" ||
    url.pathname.endsWith(".mp4")
  ) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response?.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) =>
              cache.put(request, copy)
            );
          }

          return response;
        })
        .catch(async () => {
          return (
            (await caches.match(request)) ||
            (await caches.match("/index-400.html")) ||
            (await caches.match("/"))
          );
        })
    );

    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request).then((response) => {
        if (response?.ok && response.type === "basic") {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) =>
            cache.put(request, copy)
          );
        }

        return response;
      });
    })
  );
});
