import crypto from "node:crypto";
import { Router } from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { getSettings } from "../models/Settings.js";
import { signToken } from "../utils/jwt.js";
import { requireAuth } from "../middleware/auth.js";
import { logActivity } from "../utils/activity.js";
import { emitToAdmins } from "../utils/realtime.js";
import { sendMail } from "../utils/mail.js";
import { configurePassport, passport } from "../utils/passport.js";

const router = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// One-time password-reset links: the raw random token goes only into the
// email link; the DB stores its SHA-256 hash and clears it after use.
const RESET_TTL_MS = 60 * 60 * 1000; // 1 hour
const INVALID_RESET_LINK = "This reset link is invalid or has expired. Please request a new one.";

// Lazy read: dotenv.config() runs in src/index.js AFTER the ES module import
// graph is evaluated, so a module-scope process.env.FRONTEND_URL would be
// undefined here and silently fall back to a stale Vite port. Read it per-call
// (same pattern as the Google strategy fix in utils/passport.js).
const getResetUrl = () =>
  (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");

const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");

// Lightweight in-memory throttle for the public forgot-password endpoint
// (prevents email-bombing a known address). Fine for a single process;
// prune the map as it grows.
const forgotThrottle = new Map();
function throttleForgot(key, limit, windowMs) {
  const now = Date.now();
  if (forgotThrottle.size > 5000) forgotThrottle.clear();
  const entry = forgotThrottle.get(key);
  if (!entry || now > entry.resetAt) {
    forgotThrottle.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  entry.count += 1;
  return entry.count <= limit;
}

router.post("/register", async (req, res, next) => {
  try {
    const { name, email, password, acceptedTerms } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: "Full name is required." });
    }
    if (!email || !EMAIL_RE.test(String(email))) {
      return res.status(400).json({ error: "A valid email address is required." });
    }
    if (!password || String(password).length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters." });
    }
    if (acceptedTerms !== true) {
      return res
        .status(400)
        .json({ error: "You must accept the Terms & Conditions before creating an account." });
    }

    const existing = await User.findOne({ email: String(email).toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: "An account with this email already exists." });
    }

    const passwordHash = await bcrypt.hash(String(password), 10);
    const settings = await getSettings();
    // New investors get instant access by default. Admins can re-enable the
    // manual review gate from Settings → "Require admin approval".
    const requireApproval = settings.platform?.requireApproval === true;

    const user = await User.create({
      name: String(name).trim(),
      email: String(email).toLowerCase(),
      passwordHash,
      role: "user",
      status: requireApproval ? "pending" : "active",
      acceptedTerms: true,
      acceptedTermsAt: new Date(),
      termsVersion: settings.termsVersion,
    });

    await logActivity({
      userId: user._id,
      type: "register",
      message: requireApproval
        ? "Account created and awaiting admin approval."
        : "Account created with instant access.",
    });
    await logActivity({
      userId: user._id,
      type: "terms_accepted",
      message: `Accepted the Terms & Conditions (v${settings.termsVersion}).`,
    });

    emitToAdmins("users:changed");

    const token = signToken(user);
    res.status(201).json({ token, user: user.toSafeJSON() });
  } catch (err) {
    next(err);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const user = await User.findOne({ email: String(email).toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    // Google-only accounts have no password — they must sign in via Google.
    if (!user.passwordHash) {
      return res
        .status(401)
        .json({ error: "This account uses Google sign-in. Please continue with Google." });
    }

    const ok = await bcrypt.compare(String(password), user.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    user.lastLoginAt = new Date();
    await user.save();

    await logActivity({
      userId: user._id,
      type: "login",
      message: "Signed in to the platform.",
    });

    const token = signToken(user);
    res.json({ token, user: user.toSafeJSON() });
  } catch (err) {
    next(err);
  }
});

router.post("/admin-login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const user = await User.findOne({ email: String(email).toLowerCase() });
    if (!user || user.role !== "superadmin") {
      return res.status(403).json({ error: "This account does not have admin access." });
    }

    const ok = await bcrypt.compare(String(password), user.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    user.lastLoginAt = new Date();
    await user.save();

    await logActivity({
      userId: user._id,
      type: "admin_login",
      message: "Signed in to the admin panel.",
    });

    const token = signToken(user);
    res.json({ token, user: user.toSafeJSON() });
  } catch (err) {
    next(err);
  }
});

router.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user.toSafeJSON() });
});

router.put("/terms", requireAuth, async (req, res, next) => {
  try {
    if (req.user.acceptedTerms) {
      return res.json({ user: req.user.toSafeJSON() });
    }
    const settings = await getSettings();
    req.user.acceptedTerms = true;
    req.user.acceptedTermsAt = new Date();
    req.user.termsVersion = settings.termsVersion;
    await req.user.save();

    await logActivity({
      userId: req.user._id,
      type: "terms_accepted",
      message: `Accepted the Terms & Conditions (v${settings.termsVersion}).`,
    });

    res.json({ user: req.user.toSafeJSON() });
  } catch (err) {
    next(err);
  }
});

router.post("/forgot-password", async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email || !EMAIL_RE.test(String(email))) {
      return res.status(400).json({ error: "A valid email address is required." });
    }

    // Throttle per email and per IP to stop email-bombing and link farming.
    if (
      !throttleForgot(`e:${String(email).toLowerCase()}`, 3, RESET_TTL_MS) ||
      !throttleForgot(`i:${req.ip || req.socket?.remoteAddress || "unknown"}`, 5, RESET_TTL_MS)
    ) {
      return res.status(429).json({
        error: "Too many reset requests. Please wait a few minutes and try again.",
      });
    }

    const user = await User.findOne({ email: String(email).toLowerCase() });
    if (user) {
      // One-time token: raw value only in the email link, hash in the DB.
      const raw = crypto.randomBytes(32).toString("hex");
      user.resetTokenHash = sha256(raw);
      user.resetTokenExpires = new Date(Date.now() + RESET_TTL_MS);
      await user.save();

      const link = `${getResetUrl()}/reset-password?token=${raw}`;
      const text = [
        `Hi ${user.name},`,
        "",
        "We received a request to reset your Flux account password.",
        "Click the link below to choose a new one (valid for 1 hour):",
        "",
        link,
        "",
        "If you didn't request this, you can safely ignore this email — your",
        "password will stay unchanged.",
        "",
        "— The Flux team",
      ].join("\n");

      try {
        await sendMail({
          to: user.email,
          subject: "Reset your Flux password",
          text,
        });
        await logActivity({
          userId: user._id,
          type: "password_reset_requested",
          message: "Requested a password reset email.",
        });
      } catch (mailErr) {
        // Never leak mail failures to the visitor (avoids account enumeration
        // and a broken UX if the mail provider is temporarily down).
        console.error("[auth] failed to send reset email:", mailErr.message);
      }
    }

    // Same response whether or not the account exists — do not reveal which
    // emails are registered.
    res.json({
      ok: true,
      message: "If an account exists for this email, a password reset link has been sent.",
    });
  } catch (err) {
    next(err);
  }
});

router.post("/reset-password", async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    if (!token) {
      return res.status(400).json({ error: INVALID_RESET_LINK });
    }
    if (!newPassword || String(newPassword).length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters." });
    }

    // Single-use: the stored hash is cleared after a successful reset, and
    // expired links simply stop matching.
    const user = await User.findOne({
      resetTokenHash: sha256(String(token)),
      resetTokenExpires: { $gt: new Date() },
    });
    if (!user) {
      return res.status(400).json({ error: INVALID_RESET_LINK });
    }

    user.passwordHash = await bcrypt.hash(String(newPassword), 10);
    user.resetTokenHash = null;
    user.resetTokenExpires = null;
    await user.save();

    await logActivity({
      userId: user._id,
      type: "password_reset",
      message: "Reset password via email link.",
    });

    res.json({ ok: true, message: "Password updated. You can now sign in with your new password." });
  } catch (err) {
    next(err);
  }
});

router.put("/password", requireAuth, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || String(newPassword).length < 6) {
      return res.status(400).json({ error: "New password must be at least 6 characters." });
    }
    const ok = await bcrypt.compare(String(currentPassword || ""), req.user.passwordHash);
    if (!ok) {
      return res.status(400).json({ error: "Current password is incorrect." });
    }
    req.user.passwordHash = await bcrypt.hash(String(newPassword), 10);
    await req.user.save();

    await logActivity({
      userId: req.user._id,
      type: "password_changed",
      message: "Changed account password.",
    });

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// Google OAuth — additive login method (email/password auth is untouched).
// GET /google  starts the OAuth flow; GET /google/callback finishes it and
// redirects to the frontend with the SAME JWT format the REST login returns.
// ---------------------------------------------------------------------------
router.get("/google", (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.status(503).json({ error: "Google sign-in is not configured." });
  }
  configurePassport();
  passport.authenticate("google", { scope: ["profile", "email"] })(req, res, next);
});

router.get(
  "/google/callback",
  (req, res, next) => {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return res.status(503).json({ error: "Google sign-in is not configured." });
    }
    configurePassport();
    next();
  },
  passport.authenticate("google", {
    session: false, // we use stateless JWT auth, not sessions
    failureRedirect: `${getResetUrl()}/login?google_error=1`,
  }),
  (req, res) => {
    const token = signToken(req.user);
    // Token goes in the URL fragment (not query) so it's never logged by the
    // frontend server or leaked via Referer. The /auth/callback page captures,
    // stores, and redirects into the app.
    res.redirect(`${getResetUrl()}/auth/callback#token=${encodeURIComponent(token)}`);
  }
);

export default router;
