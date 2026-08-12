import { Server } from "socket.io";
import User from "../models/User.js";
import { verifyToken } from "./jwt.js";

let io = null;

export function initRealtime(server) {
  if (io) return io;

  // Auth happens via the JWT in the handshake (not cookies). When
  // FRONTEND_URL is set (production), restrict the origin to it plus the
  // local dev origin; otherwise allow any origin.
  const allowedOrigins = process.env.FRONTEND_URL
    ? [
        process.env.FRONTEND_URL,
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
      ]
    : "*";

  io = new Server(server, {
    cors: { origin: allowedOrigins, methods: ["GET", "POST"] },
  });

  // Authenticate every socket with the same JWT the REST API uses, and
  // mirror requireActive/requireAdminActive: only active accounts connect.
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("unauthorized"));
      const payload = verifyToken(token);
      const user = await User.findById(payload.sub);
      if (!user || user.status !== "active") return next(new Error("unauthorized"));
      socket.data.userId = user._id.toString();
      socket.data.role = user.role;
      next();
    } catch {
      next(new Error("unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    socket.join(`user:${socket.data.userId}`);
    if (socket.data.role === "superadmin") socket.join("admins");
  });

  return io;
}

// ---------------------------------------------------------------------------
// HTTP bridge to the standalone socket server (socket-server/ on Render).
//
// When the REST API and the socket server run as SEPARATE processes (Vercel +
// Render), the API can't emit directly — it notifies the socket server over
// HTTP instead. When SOCKET_SERVER_URL is not set (e.g. local dev, where the
// Express app still hosts Socket.IO), we keep emitting in-process as before.
// ---------------------------------------------------------------------------
async function notifySocketServer(room, event, data, userId) {
  const url = process.env.SOCKET_SERVER_URL;
  const secret = process.env.SOCKET_SERVER_SECRET;
  if (!url || !secret) return;
  try {
    await fetch(url.replace(/\/$/, "") + "/emit", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-socket-secret": secret },
      body: JSON.stringify({
        room,
        event,
        data: data ?? null,
        userId: userId != null ? String(userId) : undefined,
      }),
    });
  } catch (err) {
    // Non-critical: the frontend polling fallback keeps data fresh if this
    // notification is lost, so never let a notify failure break the request.
    console.error("[realtime] socket notify failed:", err.message);
  }
}

/** Push an event to a single user's room. */
export function emitToUser(userId, event, data) {
  if (io && userId != null) io.to(`user:${String(userId)}`).emit(event, data);
  notifySocketServer("user", event, data, userId);
}

/** Push an event to every connected admin. */
export function emitToAdmins(event, data) {
  if (io) io.to("admins").emit(event, data);
  notifySocketServer("admins", event, data);
}

/** Push an event to every connected client. */
export function emitToAll(event, data) {
  if (io) io.emit(event, data);
  notifySocketServer("all", event, data);
}
