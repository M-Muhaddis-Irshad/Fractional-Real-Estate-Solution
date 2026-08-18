TASK: Fix two separate issues.

═══════════════════════════════════════════
ISSUE 1 — Hydration mismatch on theme toggle in AuthPage.tsx
═══════════════════════════════════════════
Same root cause as the earlier PublicNav.tsx fix: server renders "Dark mode" / client renders "Light mode" for the theme toggle button (src/components/pages/AuthPage.tsx line 293, className="authThemeBtn"). This was previously flagged but not fixed (only PublicNav.tsx was fixed).

Apply the EXACT SAME mounted-state pattern already used in PublicNav.tsx: add a `mounted` state (useState(false), set true in useEffect), and until mounted, render a neutral label/icon instead of the theme-dependent text — identical server/client markup, no mismatch. Confirm AuthPage.tsx already has "use client" (it must, since it uses onClick) — do not convert any Server Component to Client.

Also check and fix the SAME pattern in ForgotPassword.tsx, ResetPassword.tsx, and UserLayout.tsx if they have theme-dependent buttons/text rendered without a mounted guard (these were flagged earlier as having the identical issue but were left untouched).

═══════════════════════════════════════════
ISSUE 2 — /api/auth/google returns 500 Internal server error (local dev)
═══════════════════════════════════════════
SYMPTOM: Visiting localhost:3000/api/auth/google (or clicking "Continue with Google" locally) returns {"error":"Internal server error."} instead of redirecting to Google's consent screen.

DIAGNOSE:
1. Check server/.env (local, not .env.example) — confirm whether GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_CALLBACK_URL are actually present and non-empty. If ANY are missing, this is almost certainly the cause — passport-google-oauth20's Strategy constructor throws if clientID/clientSecret are undefined, which would crash the route handler and produce exactly this generic 500.
2. Check server/src/utils/passport.js — confirm how/where the Google Strategy is registered (is it registered unconditionally at module load time, meaning a missing env var crashes on server startup or on first request?).
3. Check the actual error being thrown — if there's a try/catch around the auth route that swallows the real error and returns this generic message, temporarily trace what the real underlying error is (log it, don't just report the generic message) so we know for certain.
4. Confirm the local dev server (src/index.js, not api.js) is the one running — since this is localhost:3000 hitting what should be proxied to localhost:4000 backend, confirm Frontend/next.config.ts is correctly proxying /api/* to the local backend port and not accidentally hitting the production Vercel backend.

REPORT the exact root cause found (missing env var vs proxy misconfiguration vs actual passport error), then fix it. If the fix is simply "add the missing env vars to server/.env", tell me exactly which ones are missing so I can add them myself (since I need to paste real secret values, don't guess or invent placeholder values in the file).

═══════════════════════════════════════════
OUTPUT
═══════════════════════════════════════════
1. Issue 1 — files fixed, before/after for AuthPage.tsx (and any of the other 3 files if the same issue existed).
2. Issue 2 — root cause found, fix applied (or exact missing env vars I need to add myself).
3. npm run build passes.
4. Roman Urdu 2-3 line summary of both fixes.