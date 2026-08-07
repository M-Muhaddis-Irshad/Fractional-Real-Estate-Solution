import { io } from "socket.io-client";
import { API_BASE, getToken } from "./api";

// In dev this connects to the Vite dev server origin and is websocket-proxied
// to the backend (see vite.config.js). In production it connects to the same
// host as the REST API (VITE_API_URL), which must serve /socket.io too.
let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io(API_BASE || undefined, {
      path: "/socket.io",
      autoConnect: false,
      auth: { token: getToken() },
    });
  }
  return socket;
}

export function connectSocket() {
  const s = getSocket();
  s.auth = { token: getToken() };
  if (!s.connected) s.connect();
  return s;
}

export function disconnectSocket() {
  if (socket) socket.disconnect();
}
