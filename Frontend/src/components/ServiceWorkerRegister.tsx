"use client";

import { useEffect } from "react";

/**
 * Registers the PWA service worker (public/sw.js) for installability.
 *
 * Renders nothing and runs only on the client after hydration, so it can't
 * block first paint or cause server/client markup mismatches. The worker is
 * intentionally minimal — it never caches /api/* or socket data (see sw.js).
 */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* non-fatal — installability hint only */
      });
    }
  }, []);

  return null;
}
