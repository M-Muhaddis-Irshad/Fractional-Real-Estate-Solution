# Flux — Frontend (Next.js)

The Flux fractional real-estate investment platform, built with **Next.js 16 (App Router)** + **TypeScript**.

## Stack

- **Next.js 16** (App Router) + React 19 + TypeScript
- **Recharts** for charts, **Socket.IO client** for realtime updates
- Styling: global CSS (see `src/index.css`, `src/styles/*`)
- Backend: the Express API lives in `../server` and is proxied same-origin
  (REST + Socket.IO) via rewrites in `next.config.ts`.

## Getting started

```bash
npm install

# 1. Start the Express API (from ../server) — must be running on port 4000
# 2. Start the frontend
npm run dev
```

Open http://localhost:3000.

If the API runs elsewhere, set `API_PROXY_TARGET` (proxy target) and/or
`NEXT_PUBLIC_API_URL` (direct API base for client calls).

## Scripts

| Script             | Description                       |
| ------------------ | --------------------------------- |
| `npm run dev`      | Next.js dev server (port 3000)    |
| `npm run build`    | Production build                  |
| `npm start`        | Serve the production build        |
| `npm run lint`     | ESLint (eslint-config-next)       |
| `npm run typecheck`| `tsc --noEmit`                    |

## Structure

```
src/
  app/                 routes & layouts (App Router)
  components/          shared components
    pages/             page components (public, dashboard/, admin/)
  context/             AppContext + AdminContext (auth, data, realtime)
  lib/                 api client, socket, storage, formatters, types
  styles/              global stylesheets
```
