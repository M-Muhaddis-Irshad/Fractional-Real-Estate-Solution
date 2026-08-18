"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";

/**
 * Landing point for the Google OAuth callback. The backend redirects here with
 * the JWT in the URL fragment (#token=...) — never the query string — so it
 * isn't logged by the server or leaked via Referer.
 *
 * We don't manage the token here: AppContext's auth bootstrap captures it from
 * the fragment on page load, persists it, and loads the user from /auth/me.
 * This page just waits for that to finish (authChecked) and then routes the
 * user into the app — no full reload, no race with the dashboard's auth guard.
 */
export default function AuthCallbackPage() {
  const { user, authChecked } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!authChecked) return;
    if (user) router.replace("/dashboard");
    else router.replace("/login?google_error=1");
  }, [authChecked, user, router]);

  return (
    <div className="authPage">
      <div className="authBg" aria-hidden="true" />
      <div className="authCard">
        <div className="authBrand">
          <img src="/logo/logo.webp" alt="Flux" className="authLogo" />
          <span>Flux</span>
        </div>
        <p className="fieldHint" style={{ textAlign: "center" }}>
          Signing you in…
        </p>
      </div>
    </div>
  );
}