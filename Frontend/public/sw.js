/*
 * Flux service worker — minimal, installability-focused.
 *
 * Deliberately conservative: this exists so the site meets Chrome/Android
 * install criteria, NOT to aggressively cache the app.
 *
 * CRITICAL: /api/* routes, socket.io connections and navigation (pages) are
 * NEVER cached here. Investment/property data is real-time and must always be
 * fetched fresh — serving a stale cached response would show users outdated
 * balances, property prices or requests.
 *
 * Only same-origin static assets (images, fonts, css, js — e.g. icons) get a
 * cache-first treatment. Bump CACHE_NAME on deploy to invalidate old assets.
 */

const CACHE_NAME = "flux-static-v1";

// Static asset destinations we are safe to cache (icons, fonts, styles, chunks).
const STATIC_DESTINATIONS = new Set(["image", "font", "style", "script"]);

self.addEventListener("install", () => {
  // Take control of the page as soon as possible instead of waiting for reload.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Drop caches from previous versions so a deploy never serves old assets.
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  // Only handle GETs.
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Cross-origin requests (socket.io/CDN/etc.) — pass straight through,
  // never cache.
  if (url.origin !== self.location.origin) return;

  // NEVER cache API data, socket connections or server-sent realtime traffic.
  if (url.pathname.startsWith("/api/") || url.pathname.includes("socket.io")) return;

  // Pages (navigation) — network-first with a soft offline fallback. We do not
  // precache the app shell, so the fallback is a safety net, not a stale cache.
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          return await fetch(request);
        } catch {
          const cached = await caches.match(request);
          return cached || Response.error();
        }
      })()
    );
    return;
  }

  // Static assets only — cache-first for faster repeat loads.
  if (STATIC_DESTINATIONS.has(request.destination)) {
    event.respondWith(
      (async () => {
        const hit = await caches.match(request);
        if (hit) return hit;
        try {
          const response = await fetch(request);
          if (response && response.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, response.clone());
          }
          return response;
        } catch {
          const cached = await caches.match(request);
          return cached || Response.error();
        }
      })()
    );
  }
});
