TASK: Add Google OAuth ("Continue with Google") login to this project using Passport.js. When a user signs in with Google, automatically pull their profile picture (avatar), name, and email directly from their Google account and store it — no manual profile setup needed for Google users.

DO NOT break existing email/password auth — Google OAuth is an ADDITIONAL login method, not a replacement.

═══════════════════════════════════════════
STEP 1 — SCAN EXISTING AUTH SETUP FIRST
═══════════════════════════════════════════
1. Read server/src (or wherever auth lives) and report: is passport already installed? Is there an existing passport.js config file? Is there already a Google Strategy partially set up (check package.json for passport-google-oauth20)?
2. Read the User model/schema (likely server/src/models/User.js) — show its current fields (email, password, name, avatar, etc.) and confirm whether it already supports OAuth users (e.g. optional password field, googleId field, provider field).
3. Report findings before making changes — I want to know what already exists vs what needs to be built from scratch.

═══════════════════════════════════════════
STEP 2 — BACKEND: GOOGLE OAUTH STRATEGY
═══════════════════════════════════════════
1. Install passport-google-oauth20 if not already present.
2. Create/update a Passport Google Strategy that:
   - Uses GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and a callback URL (env-driven, e.g. GOOGLE_CALLBACK_URL) — all read from env vars, no hardcoded values.
   - On successful Google auth, extract from the Google profile: email, display name, and avatar/profile picture URL (profile.photos[0].value).
   - Find-or-create logic: if a user with that Google email already exists (e.g. previously signed up via email/password), LINK the Google account to the existing user (don't create a duplicate) — update their avatar/name from Google if those fields were empty, but don't overwrite existing custom data unless explicitly empty.
   - If no user exists, create a new user with: email, name, avatar (all from Google), provider: 'google', googleId, and NO password field (or a flag marking password as not set, so email/password login is disabled for pure-Google accounts unless they later set one).
3. Update the User model/schema if needed to support: googleId (unique, sparse), avatar (URL string), provider (enum: 'local' | 'google'), and make password field optional/conditional (only required if provider is 'local').
4. Add routes: GET /api/auth/google (initiates OAuth) and GET /api/auth/google/callback (handles the redirect back from Google, issues the same JWT token format the app already uses for email/password login, then redirects to the frontend with the token — check how the existing auth flow issues/passes tokens to the frontend and match that exact pattern, e.g. query param or cookie).
5. Ensure session/JWT issuance after Google login is CONSISTENT with the existing JWT-based auth already in this app (same secret, same expiry, same payload shape) — don't introduce a second auth mechanism.

═══════════════════════════════════════════
STEP 3 — FRONTEND: "CONTINUE WITH GOOGLE" BUTTON
═══════════════════════════════════════════
1. On the login page (and register page if separate), add a "Continue with Google" button styled consistently with the existing UI (check existing button/design patterns in the codebase — use Tailwind/MUI conventions already in use, don't introduce a new style system).
2. Clicking it should redirect the browser to the backend's /api/auth/google endpoint (full page redirect, not an API fetch call — OAuth requires this).
3. Handle the callback redirect: after Google auth completes, the backend redirects back to the frontend with a token — the frontend needs a route/handler to capture that token, store it exactly how the existing email/password login stores it (localStorage/context/cookie — match existing pattern), then redirect the user into the app (dashboard).
4. Confirm the user's avatar (from Google) displays correctly wherever avatars are already shown in the UI (profile page, navbar, etc.) — check existing avatar display components and confirm the Google photo URL works with them (no broken image, correct sizing/cropping).

═══════════════════════════════════════════
STEP 4 — ENV VARS
═══════════════════════════════════════════
List clearly what needs to be added to .env.example (both server/.env.example) and what I need to obtain from Google Cloud Console:
- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET  
- GOOGLE_CALLBACK_URL (must match exactly what's registered in Google Cloud Console, e.g. https://<backend-url>/api/auth/google/callback)

═══════════════════════════════════════════
STEP 5 — VALIDATION
═══════════════════════════════════════════
1. Run existing build/lint checks (npm run build on frontend, syntax check on backend) — confirm nothing broke.
2. Confirm existing email/password login still works unchanged (don't run it live, just confirm the code path wasn't touched/broken).

═══════════════════════════════════════════
FINAL OUTPUT
═══════════════════════════════════════════
1. "WHAT ALREADY EXISTED" vs "WHAT WAS BUILT" — clear separation.
2. List every file created/modified with one-line description.
3. "ENV VARS NEEDED" — full list for server (and confirm frontend needs none, since OAuth redirect flow doesn't need a frontend env var beyond what already exists).
4. "GOOGLE CLOUD CONSOLE STEPS" — exact numbered steps I need to do on Google's side to get Client ID/Secret and register the correct callback URL (both for local dev localhost and the production Vercel backend URL — I'll need both registered).
5. "WHAT I NEED TO DO NOW" — simple numbered manual steps (Google Cloud Console setup, env vars to add on Vercel backend project, testing steps).
6. Roman Urdu 3-4 line summary.

Do not deploy anything. Just build and report — I'll add env vars and redeploy myself after reviewing.


ADDITIONALLY: Add a password visibility toggle (eye icon) to all password input fields on the login and signup/register forms. Clicking the icon should toggle the input type between "password" and "text" so the user can view what they typed. Use an existing icon library already present in the project (check package.json for lucide-react, react-icons, or MUI icons — use whichever is already installed, don't add a new dependency). Position the icon inside the input field (right-aligned, standard pattern) without breaking existing input styling/validation.