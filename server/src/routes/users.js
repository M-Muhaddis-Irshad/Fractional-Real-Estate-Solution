import { Router } from "express";
import User from "../models/User.js";
import Transaction from "../models/Transaction.js";
import Activity from "../models/Activity.js";
import Notification from "../models/Notification.js";
import { getSettings } from "../models/Settings.js";
import { requireAuth } from "../middleware/auth.js";
import { uploadImage } from "../middleware/upload.js";
import { uploadBuffer, destroyImage, cloudinaryConfigured } from "../utils/cloudinary.js";
import { logActivity } from "../utils/activity.js";

const router = Router();

function buildHoldings(transactions) {
  const map = new Map();
  for (const t of transactions) {
    const existing = map.get(t.propertyId.toString());
    if (existing) {
      existing.shares += t.shares;
      existing.invested += t.total;
    } else {
      map.set(t.propertyId.toString(), {
        propertyId: t.propertyId.toString(),
        name: t.propertyName,
        shares: t.shares,
        invested: t.total,
      });
    }
  }
  return Array.from(map.values());
}

function portfolioTotals(holdings) {
  return holdings.reduce(
    (acc, h) => ({
      invested: acc.invested + h.invested,
      shares: acc.shares + h.shares,
      count: acc.count + 1,
    }),
    { invested: 0, shares: 0, count: 0 }
  );
}

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const [transactions, settings] = await Promise.all([
      Transaction.find({ userId: req.user._id }).sort({ createdAt: -1 }),
      getSettings(),
    ]);

    const holdings = buildHoldings(transactions);

    res.json({
      user: req.user.toSafeJSON(),
      holdings,
      portfolioTotals: portfolioTotals(holdings),
      transactions: transactions.map((t) => t.toSafeJSON()),
      teamEarnings: settings.teamEarnings,
    });
  } catch (err) {
    next(err);
  }
});

router.get("/me/activities", requireAuth, async (req, res, next) => {
  try {
    const activities = await Activity.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(100);
    res.json({
      activities: activities.map((a) => ({
        id: a._id.toString(),
        type: a.type,
        message: a.message,
        meta: a.meta,
        createdAt: a.createdAt,
      })),
    });
  } catch (err) {
    next(err);
  }
});

router.put("/me", requireAuth, async (req, res, next) => {
  try {
    const { name, avatar } = req.body;
    if (name !== undefined) {
      if (!String(name).trim()) {
        return res.status(400).json({ error: "Name cannot be empty." });
      }
      req.user.name = String(name).trim();
    }
    if (avatar !== undefined) {
      const clearing = !avatar;
      // Free the old Cloudinary asset when the avatar is removed.
      if (clearing && req.user.avatarPublicId) await destroyImage(req.user.avatarPublicId);
      req.user.avatar = avatar || null;
      if (clearing) req.user.avatarPublicId = null;
    }
    await req.user.save();

    await logActivity({
      userId: req.user._id,
      type: "profile_updated",
      message: "Updated profile details.",
    });

    res.json({ user: req.user.toSafeJSON() });
  } catch (err) {
    next(err);
  }
});

// Upload (or replace) the user's profile photo. Stored on Cloudinary so the
// avatar URL is a stable public URL; the old asset is deleted on replace.
router.post("/me/avatar", requireAuth, uploadImage.single("image"), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No image provided." });
    if (!cloudinaryConfigured()) {
      return res.status(503).json({
        error: "Image upload is not configured. Set CLOUDINARY_* env vars.",
      });
    }

    const result = await uploadBuffer(req.file.buffer, { folder: "flux/avatars" });
    if (req.user.avatarPublicId) await destroyImage(req.user.avatarPublicId);
    req.user.avatar = result.secure_url;
    req.user.avatarPublicId = result.public_id;
    await req.user.save();

    await logActivity({
      userId: req.user._id,
      type: "avatar_updated",
      message: "Updated profile photo.",
    });

    res.json({ user: req.user.toSafeJSON() });
  } catch (err) {
    next(err);
  }
});

// Mark the onboarding welcome modal as seen. Called once when the user closes
// or completes it, so it never reappears on future logins (stored in the DB,
// not just localStorage — persists across devices).
router.patch("/onboarding-complete", requireAuth, async (req, res, next) => {
  try {
    if (!req.user.hasSeenOnboarding) {
      req.user.hasSeenOnboarding = true;
      await req.user.save();
    }
    res.json({ ok: true, user: req.user.toSafeJSON() });
  } catch (err) {
    next(err);
  }
});

router.get("/notifications", requireAuth, async (req, res, next) => {
  try {
    const notifications = await Notification.find({
      active: true,
      audience: { $in: req.user.role === "superadmin" ? ["all", "admins"] : ["all", "users"] },
    })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      notifications: notifications.map((n) => {
        const json = n.toSafeJSON();
        json.read = (n.readBy || []).some((id) => id.toString() === req.user._id.toString());
        return json;
      }),
    });
  } catch (err) {
    next(err);
  }
});

router.post("/notifications/:id/read", requireAuth, async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) return res.status(404).json({ error: "Notification not found." });
    if (!(notification.readBy || []).some((id) => id.toString() === req.user._id.toString())) {
      notification.readBy.push(req.user._id);
      await notification.save();
    }
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.get("/top", async (req, res, next) => {
  try {
    const users = await User.find({ role: "user", status: "active" }).lean();
    const txns = await Transaction.find().lean();

    const invested = new Map();
    for (const t of txns) {
      const id = t.userId.toString();
      invested.set(id, (invested.get(id) || 0) + t.total);
    }

    const ranked = users
      .map((u) => ({
        id: u._id.toString(),
        name: u.name,
        email: u.email,
        avatar: u.avatar,
        invested: invested.get(u._id.toString()) || 0,
      }))
      .sort((a, b) => b.invested - a.invested)
      .slice(0, 10);

    res.json({ investors: ranked });
  } catch (err) {
    next(err);
  }
});

export { buildHoldings, portfolioTotals };
export default router;
