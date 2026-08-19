"use client";

import { useEffect, useRef } from "react";
import { useApp } from "@/context/AppContext";
import { API_BASE } from "@/lib/api";
import { setToken } from "@/lib/api";

/**
 * Google Identity Services — One Tap prompt for unauthenticated visitors.
 *
 * This is a DIFFERENT feature from the "Continue with Google" button on the
 * login page (which uses the traditional OAuth redirect flow via Passport).
 * One Tap shows a small popup automatically on first visit, using the same
 * Google OAuth Client ID but a different verification path (ID token → POST
 * /auth/google/onetap → same JWT issuance).
 *
 * Behaviour:
 *  - Only initialises for users who are NOT logged in.
 *  - Shows at most once per browser session (sessionStorage flag).
 *  - Fails silently if the browser blocks it (third-party cookies, Safari, etc.).
 *  - On success, logs the user in identically to the OAuth redirect flow.
 */

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          prompt: (callback?: (notification: { isDisplayed: () => boolean; isNotDisplayed: () => boolean }) => void) => void;
        };
      };
    };
  }
}

const SESSION_FLAG = "google_onetap_shown";

/**
 * Inject <script src="https://accounts.google.com/gsi/client"> once and
 * resolve when loaded (or reject on error).
 */
function loadGoogleScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") return resolve();
    // Already loaded (e.g. another instance, or a manual <script> tag).
    if (window.google?.accounts?.id) return resolve();

    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://accounts.google.com/gsi/client"]'
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Failed to load Google Identity Services script.")));
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Identity Services script."));
    document.head.appendChild(script);
  });
}

export default function GoogleOneTap() {
  const { user, authChecked } = useApp();
  const initialised = useRef(false);

  useEffect(() => {
    // Don't initialise until auth state is known, or if already logged in.
    if (!authChecked || user) return;
    // Already prompted this session — don't show again.
    try {
      if (sessionStorage.getItem(SESSION_FLAG)) return;
    } catch { /* private browsing */ }

    // Wait for the component to mount (client-only).
    if (initialised.current) return;
    initialised.current = true;

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) return; // Google One Tap not configured — fail silently.

    let cancelled = false;

    (async () => {
      try {
        await loadGoogleScript();
        if (cancelled || !window.google?.accounts?.id) return;

        window.google.accounts.id.initialize({
          client_id: clientId,
          auto_select: false,
          cancel_on_tap_outside: true,
          callback: async (response) => {
            if (cancelled) return;
            // Mark as shown immediately so we don't re-prompt.
            try { sessionStorage.setItem(SESSION_FLAG, "1"); } catch { /* private browsing */ }

            try {
              const res = await fetch(`${API_BASE}/api/auth/google/onetap`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ credential: response.credential }),
              });
              if (!res.ok) return; // Fail silently — the login page button still works.
              const data = await res.json();
              if (data?.token && data?.user) {
                setToken(data.token);
                // Force a full reload so AppContext re-bootstraps with the
                // new token — same as the OAuth redirect flow does.
                window.location.reload();
              }
            } catch {
              /* network error — fail silently */
            }
          },
        });

        // Prompt once. The callback fires even if the user dismisses the popup
        // (via the "cancel_on_tap_outside" or native close), but Google One Tap
        // only calls the callback on SUCCESS — a dismiss just hides the UI.
        // We mark SESSION_FLAG in the callback (success path) so it only counts
        // when actually shown.  If the prompt is never displayed (e.g. blocked
        // by the browser), we still set the flag after a short delay so we
        // don't retry every navigation.
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed?.()) {
            try { sessionStorage.setItem(SESSION_FLAG, "1"); } catch { /* private browsing */ }
          }
        });
      } catch {
        // Script load failed — fail silently.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authChecked, user]);

  // This component renders nothing — it only triggers the One Tap prompt.
  return null;
}
