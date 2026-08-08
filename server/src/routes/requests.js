import { Router } from "express";
import mongoose from "mongoose";
import Property from "../models/Property.js";
import PurchaseRequest from "../models/PurchaseRequest.js";
import { getSettings } from "../models/Settings.js";
import { requireAuth, requireActive } from "../middleware/auth.js";
import { logActivity } from "../utils/activity.js";
import { money, nowParts } from "../utils/format.js";
import { emitToAdmins, emitToUser, emitToAll } from "../utils/realtime.js";
import { approveRequest } from "../utils/investments.js";

const router = Router();

router.use(requireAuth);
router.use(requireActive);

router.get("/", async (req, res, next) => {
  try {
    const requests = await PurchaseRequest.find({ userId: req.user._id }).sort({
      createdAt: -1,
    });
    res.json({ requests: requests.map((r) => r.toSafeJSON()) });
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { propertyId, shares } = req.body;

    if (!mongoose.isValidObjectId(propertyId)) {
      return res.status(400).json({ error: "Invalid property." });
    }

    const property = await Property.findOne({ _id: propertyId, status: "active" });
    if (!property) {
      return res.status(404).json({ error: "Property not found." });
    }

    const remaining = property.totalShares - property.soldShares;
    if (remaining <= 0) {
      return res.status(400).json({ error: "This property is fully subscribed." });
    }

    const count = Math.min(Math.max(1, Math.floor(Number(shares))), remaining);
    if (!Number.isFinite(count) || count <= 0) {
      return res.status(400).json({ error: "Enter a valid number of shares." });
    }

    const settings = await getSettings();
    const requireApproval = settings.platform?.requireApproval === true;
    const totalCost = count * property.pricePerShare;
    const teamFeeAmount = (totalCost * settings.teamFee) / 100;
    const { date, time } = nowParts();

    const request = await PurchaseRequest.create({
      userId: req.user._id,
      propertyId: property._id,
      propertyName: property.name,
      shares: count,
      pricePerShare: property.pricePerShare,
      totalCost,
      teamFeePct: settings.teamFee,
      teamFeeAmount,
      status: "pending",
      date,
      time,
    });

    await logActivity({
      userId: req.user._id,
      type: "request_submitted",
      message: `Requested ${count} share${count > 1 ? "s" : ""} in ${property.name} (${money(totalCost)}).`,
      meta: { requestId: request._id.toString(), propertyId: property._id.toString() },
    });

    // Manual review gate is off by default — settle the purchase instantly.
    if (requireApproval) {
      emitToAdmins("requests:changed");
      return res.status(201).json({ request: request.toSafeJSON() });
    }

    const result = await approveRequest(null, request);
    if (!result.ok) {
      // e.g. the last shares sold while this request was being processed —
      // keep the request pending so the team can handle it manually.
      emitToAdmins("requests:changed");
      return res.status(400).json({ error: result.error, request: request.toSafeJSON() });
    }

    emitToUser(req.user._id, "request:status", {
      status: "approved",
      requestId: request._id.toString(),
      propertyName: request.propertyName,
      shares: request.shares,
    });
    if (result.token) {
      emitToUser(req.user._id, "tokens:minted", { token: result.token.toSafeJSON() });
    }
    emitToAdmins("requests:changed");
    emitToAll("properties:changed");

    res.status(201).json({
      request: result.request.toSafeJSON(),
      transaction: result.transaction.toSafeJSON(),
      property: result.property.toSafeJSON(),
      token: result.token ? result.token.toSafeJSON() : null,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
