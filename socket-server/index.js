/**
 * Flux — standalone Socket.IO service (deployed on Render).
 *
 * Its ONLY job is real-time updates. The REST API stays on Vercel and pushes
 * events to this process over HTTP (POST /emit) when something changes.
 *
 * This is a long-running process, so server.listen() is fine here (Render
 * supports persistent processes, unlike Vercel's serverless functions).
 *
 * Socket auth mirrors server/src/utils/realtime.js: the same JWT the REST API
 * uses is verified in the handshake, and only active accounts can connect.
 * That lookup needs MongoDB, so we connect to the same DB the REST API uses.
 */
import http from "node:http";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";

dotenv.config();

const PORT = Number(process.env.PORT || 4001);
const FRONTEND_URL = process.env.FRONTEND_URL;
const JWT_SECRET = process.env.JWT_SECRET;
const SOCKET_SERVER_SECRET = process.env.SOCKET_SERVER_SECRET;
const MONGODB_URI = process.env.MONGODB_URI;

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

// Same CORS rules as realtime.js: production restricts to the frontend origin
// (plus local dev origins), otherwise any origin is allowed.
const allowedOrigins = FRONTEND_URL
  ? [
      FRONTEND_URL,
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "http://localhost:3000",
      "http://127.0.0.1:3000",
    ]
  : "*";

const io = new Server(server, {
  cors: { origin: allowedOrigins, methods: ["GET", "POST"] },
});

// Minimal read-only projection of the User collection — only what socket auth
// needs (status + role). We never write to the DB here.
const userSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.models.User || mongoose.model("User", userSchema);

// Authenticate every socket with the same JWT the REST API uses, and mirror
// requireActive/requireAdminActive: only active accounts connect.
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("unauthorized"));
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(payload.sub).lean();
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

app.get("/health", (req, res) => {
  res.json({ ok: true, service: "flux-socket", time: new Date().toISOString() });
});

// Internal bridge used by the Vercel REST API to push events here.
// Guarded by the shared secret so it can't be abused publicly.
// Body: { room: "all" | "admins" | "user", event: string, data?: any, userId?: string }
app.post("/emit", (req, res) => {
  const secret = req.headers["x-socket-secret"];
  if (!SOCKET_SERVER_SECRET || !secret || secret !== SOCKET_SERVER_SECRET) {
    return res.status(401).json({ error: "Unauthorized." });
  }
  const { room = "all", event, data, userId } = req.body || {};
  if (!event || typeof event !== "string") {
    return res.status(400).json({ error: "Missing event." });
  }
  if (room === "user") {
    if (!userId) return res.status(400).json({ error: "Missing userId for user room." });
    io.to(`user:${String(userId)}`).emit(event, data);
  } else if (room === "admins") {
    io.to("admins").emit(event, data);
  } else {
    io.emit(event, data);
  }
  res.json({ ok: true });
});

async function main() {
  if (MONGODB_URI) {
    await mongoose.connect(MONGODB_URI);
    console.log("[socket] MongoDB connected");
  } else {
    // Socket auth requires the DB, but the service still boots so /health and
    // /emit stay reachable — operators will see this warning and set the var.
    console.warn("[socket] MONGODB_URI is not set — socket auth will reject all connections");
  }
  server.listen(PORT, () => {
    console.log(`[socket] Flux socket server listening on http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error("[socket] failed to start:", err);
  process.exit(1);
});
