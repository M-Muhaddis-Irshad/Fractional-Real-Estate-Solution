import User from "../models/User.js";
import { verifyToken } from "../utils/jwt.js";

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) {
      return res.status(401).json({ error: "Authentication required." });
    }
    const payload = verifyToken(token);
    const user = await User.findById(payload.sub);
    if (!user) {
      return res.status(401).json({ error: "Account no longer exists." });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired session." });
  }
}

export function requireActive(req, res, next) {
  if (req.user.status !== "active") {
    return res.status(403).json({
      error:
        req.user.status === "pending"
          ? "Your account is awaiting admin approval."
          : req.user.status === "suspended"
            ? "Your account has been suspended."
            : "Your account is not active.",
    });
  }
  next();
}

export function requireSuperAdmin(req, res, next) {
  if (req.user.role !== "superadmin") {
    return res.status(403).json({ error: "Super admin access required." });
  }
  next();
}

export function requireAdminActive(req, res, next) {
  if (req.user.role !== "superadmin") {
    return res.status(403).json({ error: "Super admin access required." });
  }
  if (req.user.status !== "active") {
    return res.status(403).json({ error: "Admin account is not active." });
  }
  next();
}
