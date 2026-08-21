import { io, Socket } from "socket.io-client";
import { API_BASE, getToken } from "./api";

// ─── SOCKET_URL resolution ───────────────────────────────────────────────
// ⚠️  NEXT_PUBLIC_SOCKET_URL MUST be set in .env.local for local dev
// (e.g. http://localhost:4000). If it is commented out or missing, this
// falls through to API_BASE (also empty when NEXT_PUBLIC_API_URL is unset)
// and ultimately resolves to `undefined`, which makes socket.io-client
// connect to the same-origin (localhost:3000 — the Next.js dev server).
// That server has no /socket.io route, causing repeated 404 errors.
//
// In production the Render deployment sets NEXT_PUBLIC_SOCKET_URL to the
// standalone socket-server URL. The REST API fallback is kept only so the
// polling-refresh fallback in the contexts still works when the socket is
// unreachable.
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || API_BASE || undefined;

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      path: "/socket.io",
      autoConnect: false,
      // Cap retries so the client doesn't hammer a dead endpoint forever (the
      // polling fallback in the contexts keeps the data fresh instead).
      reconnectionAttempts: 5,
      auth: { token: getToken() },
    });
  }
  return socket;
}

export function connectSocket(): Socket {
  const s = getSocket();
  s.auth = { token: getToken() };
  if (!s.connected) s.connect();
  return s;
}

export function disconnectSocket(): void {
  if (socket) socket.disconnect();
}
