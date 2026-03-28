const CACHE_NAME = "ahof-static-v7";

const STATIC_ASSETS = [
  "./",
  "assets/dist/css/styles.min.css",
  "assets/dist/js/ahof.min.js",
  "assets/dist/js/config.min.js",
  "assets/dist/js/layout.min.js",
  "assets/dist/js/secrets.min.js",
  "assets/dist/js/clears.min.js",
  "assets/dist/js/players.min.js",
  "assets/dist/js/rate.min.js",
  "assets/images/default.webp"
];

// Install: cache static files
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

// Activate: remove old caches
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
});

/*
self.addEventListener("fetch", event => {

  const request = event.request;

  // Fetch JSON fresh
  if (url.pathname.includes("/data/") && url.pathname.endsWith(".json")) {
    event.respondWith(
      fetch(request, { cache: "no-store" })
    );
    return;
  }

  // Cache static assets
  event.respondWith(
    caches.match(request).then(cachedResponse => {
      return cachedResponse || fetch(request);
    })
  );

});
*/
