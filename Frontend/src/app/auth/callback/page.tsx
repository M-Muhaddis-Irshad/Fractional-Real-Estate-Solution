"use client";

import { useEffect } from "react";
import { setToken } from "@/lib/api";

/**
 * Landing point for the Google OAuth callback. The backend redirects here with
 * the JWT in the URL fragment (#token=...) — never the query string — so it
 * isn't logged by the server or leaked via Referer.
 *
 * We store the token exactly like email/password login does (localStorage via
 * setToken), then trigger a FULL page navigation so AppContext remounts and
 * bootstraps the user from GET /auth/me.
 */
export default function AuthCallbackPage() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const token = params.get("token");
    if (token) {
      setToken(token);
      window.location.replace("/dashboard");
    } else {
      window.location.replace("/login?google_error=1");
    }
  }, []);

  return (
    <div className="authPage">
      <div className="authBg" aria-hidden="true" />
      <div className="authCard">
        <div className="authBrand">
          <img src="/logo/logo.png" alt="Flux" className="authLogo" />
          <span>Flux</span>
        </div>
        <p className="fieldHint" style={{ textAlign: "center" }}>
          Signing you in…
        </p>
      </div>
    </div>
  );
}