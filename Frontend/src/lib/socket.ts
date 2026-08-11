import { io, Socket } from "socket.io-client";
import { API_BASE, getToken } from "./api";

// In dev this connects to the Next.js dev server origin and is proxied to the
// backend via next.config rewrites (see next.config.ts). In production it
// connects to the same host as the REST API (NEXT_PUBLIC_API_URL), which must
// serve /socket.io too.
let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(API_BASE || undefined, {
      path: "/socket.io",
      autoConnect: false,
      // Vercel's serverless backend doesn't serve Socket.IO — cap retries so
      // the client doesn't hammer a dead endpoint forever (polling fallback
      // in the contexts keeps the data fresh instead).
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
