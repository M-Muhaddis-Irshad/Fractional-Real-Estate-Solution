import { Router } from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { getSettings } from "../models/Settings.js";
import { signToken } from "../utils/jwt.js";
import { requireAuth } from "../middleware/auth.js";
import { logActivity } from "../utils/activity.js";
import { emitToAdmins } from "../utils/realtime.js";

const router = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

export default router;
