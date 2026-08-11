/**
 * Vercel serverless entry — the SAME Express app as src/index.js, but exported
 * as a function so Vercel's @vercel/node builder can serve it.
 *
 * Differences from local dev (src/index.js):
 *  - No `server.listen()` — Vercel invokes this handler per request.
 *  - MongoDB connects lazily on first request and is cached on `global`
 *    so warm invocations reuse the connection instead of reconnecting.
 *  - No Socket.IO — Vercel serverless instances are ephemeral and Socket.IO
 *    needs a persistent process (see realtime.js). The frontend automatically
 *    falls back to polling when the socket can't connect.
 *
 * Local development still uses `npm run dev` (src/index.js), which serves
 * the API + Socket.IO on localhost:4000.
 */
import dotenv from "dotenv";
import app from "./src/app.js";
import { connectDB } from "./src/config/db.js";

// .env is a local-only convenience; on Vercel the same keys are provided via
// the dashboard Environment Variables. If neither exists, connectDB will
// throw a clear error.
dotenv.config();

// Cache the connection across warm invocations (module scope survives on the
// same Vercel instance).
let dbPromise = global.__fluxDbPromise;

export default async function handler(req, res) {
  try {
    if (!dbPromise) {
      dbPromise = connectDB(process.env.MONGODB_URI).catch((err) => {
        dbPromise = null; // allow a retry on the next request
        throw err;
      });
      global.__fluxDbPromise = dbPromise;
    }
    await dbPromise;
    return app(req, res);
  } catch (err) {
    console.error("[vercel] handler error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error." });
    }
  }
}
