import { io, Socket } from "socket.io-client";
import { API_BASE, getToken } from "./api";

// In dev this connects to the Next.js dev server origin and is proxied to the
// backend via next.config rewrites (see next.config.ts). In production it
// connects to the standalone socket server on Render (NEXT_PUBLIC_SOCKET_URL),
// falling back to the REST API host (NEXT_PUBLIC_API_URL) if that isn't set —
// which never serves Socket.IO, so the polling fallback in the contexts keeps
// the data fresh instead.
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
