import { Router } from "express";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Property from "../models/Property.js";
import Transaction from "../models/Transaction.js";
import PurchaseRequest from "../models/PurchaseRequest.js";
import Activity from "../models/Activity.js";
import ErrorLog from "../models/ErrorLog.js";
import Notification from "../models/Notification.js";
import { getSettings } from "../models/Settings.js";
import { requireAuth, requireAdminActive } from "../middleware/auth.js";
import { uploadImage } from "../middleware/upload.js";
import { logActivity } from "../utils/activity.js";
import { nowParts, money } from "../utils/format.js";
import { uploadBuffer, destroyImage, cloudinaryConfigured } from "../utils/cloudinary.js";
import { DEFAULT_CONTENT } from "../utils/content.js";
import { buildHoldings, portfolioTotals } from "./users.js";

const router = Router();

router.use(requireAuth);
router.use(requireAdminActive);

async function audit(admin, target, type, message, meta = {}) {
  await logActivity({
    userId: target._id,
    byUserId: admin._id,
    type,
    message,
    meta,
  });
}

router.get("/stats", async (req, res, next) => {
  try {
    const [
      totalUsers,
      pendingUsers,
      activeUsers,
      rejectedUsers,
      suspendedUsers,
      totalAdmins,
      pendingRequests,
      totalProperties,
      activeProperties,
      pendingProperties,
      fractionalProperties,
      settings,
    ] = await Promise.all([
      User.countDocuments({ role: "user" }),
      User.countDocuments({ role: "user", status: "pending" }),
      User.countDocuments({ role: "user", status: "active" }),
      User.countDocuments({ role: "user", status: "rejected" }),
      User.countDocuments({ role: "user", status: "suspended" }),
      User.countDocuments({ role: "superadmin" }),
      PurchaseRequest.countDocuments({ status: "pending" }),
      Property.countDocuments(),
      Property.countDocuments({ status: "active" }),
      Property.countDocuments({ status: "pending" }),
      Property.countDocuments({ totalShares: { $gt: 0 } }),
      getSettings(),
    ]);

    const transactions = await Transaction.find().lean();
    const totalInvested = transactions.reduce((s, t) => s + t.total, 0);

    res.json({
      stats: {
        totalUsers,
        pendingUsers,
        activeUsers,
        rejectedUsers,
        suspendedUsers,
        totalAdmins,
        totalProperties,
        activeProperties,
        pendingProperties,
        fractionalProperties,
        pendingRequests,
        approvedRequests: await PurchaseRequest.countDocuments({ status: "approved" }),
        rejectedRequests: await PurchaseRequest.countDocuments({ status: "rejected" }),
        totalInvestments: transactions.length,
        totalInvested,
        totalRevenue: totalInvested + settings.teamEarnings,
        teamEarnings: settings.teamEarnings,
        teamFee: settings.teamFee,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ---------- Activity, logs & errors ----------

async function mapActivity(a) {
  const json = a.toObject ? a.toObject() : a;
  return {
    id: String(json._id),
    type: json.type,
    message: json.message,
    meta: json.meta,
    createdAt: json.createdAt,
    user: json.userId && json.userId.name ? { id: String(json.userId._id), name: json.userId.name, email: json.userId.email } : null,
    actor: json.byUserId && json.byUserId.name ? { id: String(json.byUserId._id), name: json.byUserId.name, email: json.byUserId.email } : null,
  };
}

router.get("/activity", async (req, res, next) => {
  try {
    const activities = await Activity.find()
      .sort({ createdAt: -1 })
      .limit(60)
      .populate("userId", "name email")
      .populate("byUserId", "name email");
    res.json({ activities: activities.map(mapActivity) });
  } catch (err) {
    next(err);
  }
});

router.get("/logs", async (req, res, next) => {
  try {
    const { type, actor } = req.query;
    const filter = {};
    if (type && String(type).trim()) filter.type = String(type).trim();
    if (actor === "admin") filter.byUserId = { $ne: null };

    const logs = await Activity.find(filter)
      .sort({ createdAt: -1 })
      .limit(300)
      .populate("userId", "name email")
      .populate("byUserId", "name email");
    res.json({ logs: logs.map(mapActivity) });
  } catch (err) {
    next(err);
  }
});

router.get("/errors", async (req, res, next) => {
  try {
    const errors = await ErrorLog.find().sort({ createdAt: -1 }).limit(200);
    res.json({
      errors: errors.map((e) => ({
        id: e._id.toString(),
        type: e.type,
        message: e.message,
        stack: e.stack,
        method: e.method,
        path: e.path,
        meta: e.meta,
        createdAt: e.createdAt,
      })),
    });
  } catch (err) {
    next(err);
  }
});

// ---------- Transactions / investments ----------

router.get("/transactions", async (req, res, next) => {
  try {
    const { q, limit } = req.query;
    const filter = {};
    if (q && String(q).trim()) {
      filter.propertyName = new RegExp(String(q).trim(), "i");
    }
    const transactions = await Transaction.find(filter)
      .sort({ createdAt: -1 })
      .limit(Math.min(parseInt(limit, 10) || 200, 500))
      .populate("userId", "name email avatar");

    res.json({
      transactions: transactions.map((t) => {
        const json = t.toSafeJSON();
        json.user = json.userId
          ? { id: json.userId._id.toString(), name: json.userId.name, email: json.userId.email, avatar: json.userId.avatar }
          : null;
        delete json.userId;
        return json;
      }),
    });
  } catch (err) {
    next(err);
  }
});

function lastMonths(n) {
  const out = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, label: d.toLocaleString("en-US", { month: "short" }) });
  }
  return out;
}

router.get("/financials", async (req, res, next) => {
  try {
    const [transactions, settings] = await Promise.all([
      Transaction.find().lean().sort({ createdAt: 1 }),
      getSettings(),
    ]);

    const buckets = lastMonths(12);
    const byKey = Object.fromEntries(buckets.map((b) => [b.key, { invested: 0, fees: 0, count: 0 }]));
    for (const t of transactions) {
      const d = t.createdAt ? new Date(t.createdAt) : new Date();
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!byKey[key]) continue;
      byKey[key].invested += t.total;
      byKey[key].fees += t.teamFee || 0;
      byKey[key].count += 1;
    }

    const totalInvested = transactions.reduce((s, t) => s + t.total, 0);
    const totalFees = transactions.reduce((s, t) => s + (t.teamFee || 0), 0);

    res.json({
      series: buckets.map((b) => ({ month: b.label, ...byKey[b.key] })),
      totals: {
        totalInvested,
        totalFees,
        totalRevenue: totalInvested + settings.teamEarnings,
        platformEarnings: settings.teamEarnings,
        teamFee: settings.teamFee,
        investments: transactions.length,
        avgTicket: transactions.length ? Math.round(totalInvested / transactions.length) : 0,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ---------- Property management ----------

router.patch("/properties/:id/status", async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ error: "Property not found." });

    const { action } = req.body;
    const map = { approve: "active", reject: "rejected" };
    const status = map[action];
    if (!status) return res.status(400).json({ error: "Invalid action." });

    const previous = property.status;
    property.status = status;
    if (action === "approve") property.investingOpen = true;
    await property.save();

    await logActivity({
      userId: req.user._id,
      type: "property_" + action + "d",
      message: `${action === "approve" ? "Approved" : "Rejected"} listing "${property.name}".`,
      meta: { propertyId: property._id.toString(), from: previous, to: status },
    });

    res.json({ property: property.toSafeJSON() });
  } catch (err) {
    next(err);
  }
});

router.patch("/properties/:id/featured", async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ error: "Property not found." });

    property.featured = Boolean(req.body.featured);
    await property.save();

    res.json({ property: property.toSafeJSON() });
  } catch (err) {
    next(err);
  }
});

router.patch("/properties/:id/investing", async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ error: "Property not found." });

    property.investingOpen = Boolean(req.body.open);
    await property.save();

    res.json({ property: property.toSafeJSON() });
  } catch (err) {
    next(err);
  }
});

// ---------- Content management ----------

router.get("/content", async (req, res, next) => {
  try {
    const settings = await getSettings();
    res.json({ content: settings.content || DEFAULT_CONTENT });
  } catch (err) {
    next(err);
  }
});

router.put("/content", async (req, res, next) => {
  try {
    const settings = await getSettings();
    const nextContent = { ...DEFAULT_CONTENT, ...(settings.content || {}) };
    const incoming = req.body || {};
    for (const key of Object.keys(DEFAULT_CONTENT)) {
      if (incoming[key] !== undefined) nextContent[key] = incoming[key];
    }
    settings.content = nextContent;
    settings.updatedBy = req.user._id;
    await settings.save();

    await logActivity({
      userId: req.user._id,
      type: "content_updated",
      message: "Updated homepage content.",
    });

    res.json({ content: nextContent });
  } catch (err) {
    next(err);
  }
});

// ---------- Notifications ----------

router.get("/notifications", async (req, res, next) => {
  try {
    const notifications = await Notification.find().sort({ createdAt: -1 }).limit(200);
    res.json({
      notifications: notifications.map((n) => n.toSafeJSON()),
    });
  } catch (err) {
    next(err);
  }
});

router.post("/notifications", async (req, res, next) => {
  try {
    const { title, message, audience, channel } = req.body;
    if (!String(title || "").trim() || !String(message || "").trim()) {
      return res.status(400).json({ error: "Title and message are required." });
    }
    const notification = await Notification.create({
      title: String(title).trim(),
      message: String(message).trim(),
      audience: ["all", "users", "admins"].includes(audience) ? audience : "all",
      channel: ["in_app", "email", "push"].includes(channel) ? channel : "in_app",
      createdBy: req.user._id,
    });

    await logActivity({
      userId: req.user._id,
      type: "notification_sent",
      message: `Announcement sent to ${notification.audience}: "${notification.title}".`,
      meta: { notificationId: notification._id.toString() },
    });

    res.status(201).json({ notification: notification.toSafeJSON() });
  } catch (err) {
    next(err);
  }
});

router.delete("/notifications/:id", async (req, res, next) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// ---------- Platform settings ----------

router.put("/platform", async (req, res, next) => {
  try {
    const settings = await getSettings();
    const current = settings.platform || {};
    const incoming = req.body || {};
    settings.platform = { ...current, ...incoming };
    settings.updatedBy = req.user._id;
    await settings.save();

    await logActivity({
      userId: req.user._id,
      type: "settings_updated",
      message: "Updated platform settings.",
    });

    res.json({ platform: settings.platform });
  } catch (err) {
    next(err);
  }
});

// ---------- Users ----------

router.get("/users", async (req, res, next) => {
  try {
    const { status, q } = req.query;
    const filter = { role: "user" };
    if (status && ["pending", "active", "rejected", "suspended"].includes(status)) {
      filter.status = status;
    }
    if (q && String(q).trim()) {
      const re = new RegExp(String(q).trim(), "i");
      filter.$or = [{ name: re }, { email: re }];
    }

    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .select("-passwordHash -avatarPublicId");

    const txns = await Transaction.find().lean();
    const investedByUser = new Map();
    for (const t of txns) {
      const id = t.userId.toString();
      investedByUser.set(id, (investedByUser.get(id) || 0) + t.total);
    }

    const rows = users.map((u) => {
      const json = u.toSafeJSON();
      return {
        ...json,
        invested: investedByUser.get(u._id.toString()) || 0,
      };
    });

    res.json({ users: rows });
  } catch (err) {
    next(err);
  }
});

router.get("/users/:id", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: "Invalid user id." });
    }
    const user = await User.findById(req.params.id);
    if (!user || user.role === "superadmin") {
      return res.status(404).json({ error: "User not found." });
    }

    const [transactions, requests, activities] = await Promise.all([
      Transaction.find({ userId: user._id }).sort({ createdAt: -1 }),
      PurchaseRequest.find({ userId: user._id }).sort({ createdAt: -1 }),
      Activity.find({ userId: user._id }).sort({ createdAt: -1 }).limit(100),
    ]);

    const holdings = buildHoldings(transactions);

    res.json({
      user: user.toSafeJSON(),
      holdings,
      portfolioTotals: portfolioTotals(holdings),
      transactions: transactions.map((t) => t.toSafeJSON()),
      requests: requests.map((r) => r.toSafeJSON()),
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

router.patch("/users/:id/status", async (req, res, next) => {
  try {
    const { action } = req.body;
    const user = await User.findById(req.params.id);
    if (!user || user.role === "superadmin") {
      return res.status(404).json({ error: "User not found." });
    }

    const map = {
      approve: { status: "active" },
      reject: { status: "rejected" },
      suspend: { status: "suspended" },
      restore: { status: "active" },
    };
    const change = map[action];
    if (!change) {
      return res.status(400).json({ error: "Invalid action." });
    }

    const previous = user.status;
    user.status = change.status;
    if (action === "reject") user.rejectedReason = req.body.reason || "Not approved by the team.";
    if (action === "approve" || action === "restore") user.rejectedReason = null;
    await user.save();

    await audit(
      req.user,
      user,
      action === "approve" || action === "restore" ? "user_approved" : `user_${action}`,
      `${req.user.name} ${action === "approve" || action === "restore" ? "approved" : action + "ed"} ${user.name}'s account.`,
      { from: previous, to: user.status }
    );

    res.json({ user: user.toSafeJSON() });
  } catch (err) {
    next(err);
  }
});

router.delete("/users/:id", async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.role === "superadmin") {
      return res.status(404).json({ error: "User not found." });
    }

    await Promise.all([
      Transaction.deleteMany({ userId: user._id }),
      PurchaseRequest.deleteMany({ userId: user._id }),
      Activity.deleteMany({ userId: user._id }),
    ]);
    if (user.avatarPublicId) await destroyImage(user.avatarPublicId);
    await user.deleteOne();

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.put("/users/:id", async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.role === "superadmin") {
      return res.status(404).json({ error: "User not found." });
    }

    const { name, email, role, status, password } = req.body;

    if (name !== undefined) user.name = String(name).trim();
    if (email !== undefined) {
      const emailStr = String(email).toLowerCase();
      const dup = await User.findOne({ email: emailStr, _id: { $ne: user._id } });
      if (dup) return res.status(409).json({ error: "Email already in use by another account." });
      user.email = emailStr;
    }
    if (role !== undefined && ["user", "superadmin"].includes(role)) user.role = role;
    if (status !== undefined && ["pending", "active", "rejected", "suspended"].includes(status)) {
      user.status = status;
    }
    if (password && String(password).length >= 6) {
      user.passwordHash = await bcrypt.hash(String(password), 10);
    }
    await user.save();

    await audit(
      req.user,
      user,
      "user_edited",
      `${req.user.name} updated ${user.name}'s account.`,
      { fields: Object.keys(req.body).filter((k) => k !== "password") }
    );

    res.json({ user: user.toSafeJSON() });
  } catch (err) {
    next(err);
  }
});

// ---------- Purchase requests ----------

router.get("/requests", async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status && ["pending", "approved", "rejected"].includes(status)) filter.status = status;

    const requests = await PurchaseRequest.find(filter)
      .sort({ createdAt: -1 })
      .populate("userId", "name email avatar status");

    res.json({
      requests: requests.map((r) => {
        const json = r.toSafeJSON();
        json.user = json.userId
          ? { id: json.userId._id.toString(), name: json.userId.name, email: json.userId.email, avatar: json.userId.avatar, status: json.userId.status }
          : null;
        delete json.userId;
        return json;
      }),
    });
  } catch (err) {
    next(err);
  }
});

async function approveRequest(admin, request) {
  if (request.status !== "pending") {
    return { ok: false, error: "Request already processed." };
  }

  const user = await User.findById(request.userId);
  if (!user) return { ok: false, error: "Request owner no longer exists." };
  if (user.status !== "active") {
    return { ok: false, error: "This investor's account is not active." };
  }

  const property = await Property.findById(request.propertyId);
  if (!property) return { ok: false, error: "Property not found." };
  const remaining = property.totalShares - property.soldShares;
  if (request.shares > remaining) {
    return { ok: false, error: "Not enough shares remaining for this request." };
  }

  property.soldShares += request.shares;
  await property.save();

  const settings = await getSettings();
  settings.teamEarnings += request.teamFeeAmount;
  settings.updatedBy = admin._id;
  await settings.save();

  const { date, time } = nowParts();
  const transaction = await Transaction.create({
    userId: user._id,
    propertyId: property._id,
    propertyName: property.name,
    shares: request.shares,
    pricePerShare: request.pricePerShare,
    total: request.totalCost,
    teamFee: request.teamFeeAmount,
    teamFeePct: request.teamFeePct,
    date,
    time,
    requestId: request._id,
  });

  request.status = "approved";
  request.processedAt = new Date();
  request.processedBy = admin._id;
  await request.save();

  await audit(
    admin,
    user,
    "request_approved",
    `${request.shares} share${request.shares > 1 ? "s" : ""} approved in ${property.name} (${money(request.totalCost)}).`,
    { requestId: request._id.toString(), propertyId: property._id.toString() }
  );

  return { ok: true, transaction, request, user, property };
}

router.patch("/requests/:id/approve", async (req, res, next) => {
  try {
    const request = await PurchaseRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ error: "Request not found." });

    const result = await approveRequest(req.user, request);
    if (!result.ok) return res.status(400).json({ error: result.error });

    res.json({
      ok: true,
      request: result.request.toSafeJSON(),
      transaction: result.transaction.toSafeJSON(),
      user: result.user.toSafeJSON(),
      property: result.property.toSafeJSON(),
    });
  } catch (err) {
    next(err);
  }
});

router.patch("/requests/:id/reject", async (req, res, next) => {
  try {
    const request = await PurchaseRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ error: "Request not found." });
    if (request.status !== "pending") {
      return res.status(400).json({ error: "Request already processed." });
    }

    request.status = "rejected";
    request.processedAt = new Date();
    request.processedBy = req.user._id;
    request.reason = req.body.reason || null;
    await request.save();

    const user = await User.findById(request.userId);
    if (user) {
      await audit(
        req.user,
        user,
        "request_rejected",
        `Request for ${request.propertyName} (${request.shares} shares) was rejected.`,
        { requestId: request._id.toString() }
      );
    }

    res.json({ ok: true, request: request.toSafeJSON() });
  } catch (err) {
    next(err);
  }
});

// ---------- Properties ----------

router.get("/properties", async (req, res, next) => {
  try {
    const properties = await Property.find().sort({ createdAt: 1 });
    res.json({ properties: properties.map((p) => p.toSafeJSON()) });
  } catch (err) {
    next(err);
  }
});

router.post("/properties", uploadImage.single("image"), async (req, res, next) => {
  try {
    const data = req.body;
    if (!String(data.name || "").trim() || !String(data.city || "").trim()) {
      return res.status(400).json({ error: "Name and city are required." });
    }

    let imageUrl = null;
    let imagePublicId = null;
    if (req.file) {
      if (!cloudinaryConfigured()) {
        return res.status(503).json({
          error: "Image upload is not configured. Set CLOUDINARY_* env vars.",
        });
      }
      const result = await uploadBuffer(req.file.buffer, { folder: "flux/properties" });
      imageUrl = result.secure_url;
      imagePublicId = result.public_id;
    }

    const name = String(data.name).trim();
    const initials = name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
    const hue = Math.floor(Math.random() * 360);

    const property = await Property.create({
      name,
      city: String(data.city).trim(),
      type: String(data.type || "Residential").trim(),
      description: String(data.description || "").trim(),
      totalValue: Number(data.totalValue),
      pricePerShare: Number(data.pricePerShare),
      totalShares: Number(data.totalShares),
      soldShares: Number(data.soldShares) || 0,
      yieldPct: Number(data.yieldPct),
      initials,
      hue,
      imageUrl,
      imagePublicId,
      listedBy: req.user._id,
    });

    await logActivity({
      userId: req.user._id,
      type: "property_listed",
      message: `Listed "${property.name}".`,
      meta: { propertyId: property._id.toString() },
    });

    res.status(201).json({ property: property.toSafeJSON() });
  } catch (err) {
    next(err);
  }
});

router.put("/properties/:id", uploadImage.single("image"), async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ error: "Property not found." });

    const data = req.body;
    const fields = [
      "name",
      "city",
      "type",
      "description",
      "totalValue",
      "pricePerShare",
      "totalShares",
      "soldShares",
      "yieldPct",
    ];
    for (const f of fields) {
      if (data[f] !== undefined) {
        if (["totalValue", "pricePerShare", "totalShares", "soldShares", "yieldPct"].includes(f)) {
          property[f] = Number(data[f]);
        } else {
          property[f] = String(data[f]).trim();
        }
      }
    }
    if (property.name) {
      property.initials = property.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }

    if (req.file) {
      if (!cloudinaryConfigured()) {
        return res.status(503).json({
          error: "Image upload is not configured. Set CLOUDINARY_* env vars.",
        });
      }
      const result = await uploadBuffer(req.file.buffer, { folder: "flux/properties" });
      if (property.imagePublicId) await destroyImage(property.imagePublicId);
      property.imageUrl = result.secure_url;
      property.imagePublicId = result.public_id;
    }

    await property.save();

    res.json({ property: property.toSafeJSON() });
  } catch (err) {
    next(err);
  }
});

router.delete("/properties/:id", async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ error: "Property not found." });

    property.status = "inactive";
    await property.save();

    if (property.imagePublicId) await destroyImage(property.imagePublicId);

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// ---------- Settings ----------

router.put("/settings", async (req, res, next) => {
  try {
    const { teamFee, termsVersion } = req.body;
    const settings = await getSettings();

    if (teamFee !== undefined) {
      const val = Number(teamFee);
      if (!Number.isFinite(val) || val < 0 || val > 25) {
        return res.status(400).json({ error: "Team fee must be between 0 and 25%." });
      }
      settings.teamFee = Math.round(val * 100) / 100;
    }
    if (termsVersion !== undefined && String(termsVersion).trim()) {
      settings.termsVersion = String(termsVersion).trim();
    }
    settings.updatedBy = req.user._id;
    await settings.save();

    res.json({
      settings: {
        teamFee: settings.teamFee,
        teamEarnings: settings.teamEarnings,
        termsVersion: settings.termsVersion,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ---------- Upload ----------

router.post("/upload", uploadImage.single("image"), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No image provided." });
    if (!cloudinaryConfigured()) {
      return res.status(503).json({
        error: "Image upload is not configured. Set CLOUDINARY_* env vars.",
      });
    }
    const result = await uploadBuffer(req.file.buffer, { folder: "flux" });
    res.json({ url: result.secure_url, publicId: result.public_id });
  } catch (err) {
    next(err);
  }
});

export default router;
