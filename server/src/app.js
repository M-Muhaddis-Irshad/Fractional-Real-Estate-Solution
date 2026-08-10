import express from "express";
import cors from "cors";
import ErrorLog from "./models/ErrorLog.js";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import propertyRoutes from "./routes/properties.js";
import requestRoutes from "./routes/requests.js";
import adminRoutes from "./routes/admin.js";
import settingsRoutes from "./routes/settings.js";
import tokenRoutes from "./routes/tokens.js";
import paymentRoutes from "./routes/payments.js";

const app = express();

app.use(cors());

// body-parser's `verify` hook hands us the RAW request buffer while it parses
// — this is what Coinbase Commerce signs, so it's captured here for webhook
// signature verification without double-consuming the stream.
app.use(
  express.json({
    limit: "2mb",
    verify: (req, res, buf) => {
      req.rawBody = buf.toString("utf8");
    },
  })
);

app.get("/api/health", (req, res) => {
  res.json({ ok: true, service: "flux-api", time: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/tokens", tokenRoutes);
app.use("/api/payments", paymentRoutes);

app.use((req, res) => {
  res.status(404).json({ error: "Route not found." });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err && err.message && err.message.startsWith("Only JPG")) {
    return res.status(400).json({ error: err.message });
  }
  if (err && err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ error: "Image must be under 5 MB." });
  }
  console.error("[error]", err);
  ErrorLog.create({
    type: "unhandled",
    message: String(err.message || "Unknown error").slice(0, 500),
    stack: String(err.stack || "").slice(0, 2000),
    method: req.method,
    path: req.path,
  }).catch(() => {});
  res.status(500).json({ error: "Internal server error." });
});

export default app;
