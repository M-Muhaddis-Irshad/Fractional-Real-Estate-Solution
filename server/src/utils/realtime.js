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
    ? [process.env.FRONTEND_URL, "http://localhost:5173", "http://127.0.0.1:5173"]
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

/** Push an event to a single user's room. */
export function emitToUser(userId, event, data) {
  if (!io || userId == null) return;
  io.to(`user:${String(userId)}`).emit(event, data);
}

/** Push an event to every connected admin. */
export function emitToAdmins(event, data) {
  if (!io) return;
  io.to("admins").emit(event, data);
}

/** Push an event to every connected client. */
export function emitToAll(event, data) {
  if (!io) return;
  io.emit(event, data);
}
