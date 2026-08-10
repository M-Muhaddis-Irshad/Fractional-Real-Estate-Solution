import { Router } from "express";
import mongoose from "mongoose";
import Property from "../models/Property.js";
import PurchaseRequest from "../models/PurchaseRequest.js";
import CryptoPayment from "../models/CryptoPayment.js";
import { getSettings } from "../models/Settings.js";
import { requireAuth, requireActive } from "../middleware/auth.js";
import { logActivity } from "../utils/activity.js";
import { money, nowParts } from "../utils/format.js";
import { emitToUser, emitToAdmins } from "../utils/realtime.js";
import { approveRequest } from "../utils/investments.js";
import {
  SUPPORTED_CURRENCIES,
  createCharge,
  getChargeStatus,
  verifyWebhookSignature,
  explorerUrl,
  isConfigured,
  cryptoAmountFor,
  getRates,
  simulatedAddress,
  simulatedTxHash,
} from "../services/cryptoPayment.js";

const router = Router();

const DEMO_CONFIRM_MS = 20000; // demo payments auto-confirm after ~20s
const PAYMENT_TTL_MS = 30 * 60 * 1000; // charge expires after 30 minutes

// ---------------------------------------------------------------------------
// Rate limiting — payments are a public-ish attack surface (charge spam), so
// throttle creation per user and per IP. In-memory map is fine for one process.
// ---------------------------------------------------------------------------
const createLimiter = new Map();
function throttle(key, limit, windowMs) {
  const now = Date.now();
  if (createLimiter.size > 5000) createLimiter.clear();
  const entry = createLimiter.get(key);
  if (!entry || now > entry.resetAt) {
    createLimiter.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  entry.count += 1;
  return entry.count <= limit;
}

/** Resolve the pending PurchaseRequest for a payment, settling it if approved. */
async function settlePayment(payment, { txHash, network, eventType }) {
  if (!["pending", "confirming"].includes(payment.status)) {
    return { ok: false, alreadyProcessed: true };
  }

  const request = await PurchaseRequest.findById(payment.requestId);
  if (!request || request.status !== "pending") {
    payment.status = "failed";
    payment.note = "Purchase request is no longer pending.";
    payment.lastEvent = "charge:failed";
    await payment.save();
    notifyFailure(payment);
    return { ok: false, error: payment.note };
  }

  // Server-side settlement re-validates share availability atomically.
  const result = await approveRequest(null, request);
  if (!result.ok) {
    payment.status = "failed";
    payment.note = result.error;
    payment.lastEvent = "charge:failed";
    await payment.save();
    notifyFailure(payment);
    return { ok: false, error: result.error };
  }

  payment.status = "confirmed";
  payment.txHash = txHash || payment.txHash;
  payment.network = network || payment.network;
  payment.explorerUrl = explorerUrl(payment.currency, payment.network, payment.txHash);
  payment.lastEvent = eventType || "charge:confirmed";
  payment.confirmedAt = new Date();
  payment.note = null;
  await payment.save();

  await logActivity({
    userId: payment.userId,
    type: "payment_confirmed",
    message: `Crypto payment confirmed — ${payment.shares} share${
      payment.shares > 1 ? "s" : ""
    } in ${payment.propertyName} (${payment.currency} ${payment.cryptoAmount ?? "—"}).`,
    meta: {
      paymentId: payment._id.toString(),
      txHash: payment.txHash,
      network: payment.network,
    },
  });

  emitToUser(payment.userId, "payment:status", {
    id: payment._id.toString(),
    status: payment.status,
  });
  emitToAdmins("payments:changed");

  return { ok: true, result };
}

// ---------------------------------------------------------------------------
// GET /api/payments/crypto/rates — public conversion hints for the checkout UI.
// ---------------------------------------------------------------------------
router.get("/crypto/rates", async (req, res) => {
  res.json({
    supported: SUPPORTED_CURRENCIES,
    rates: getRates(),
    simulated: !isConfigured(),
  });
});

// ---------------------------------------------------------------------------
// COMPLIANCE NOTE (KYC/AML): crypto payments for real-estate fractional
// ownership may be regulated in many jurisdictions (securities law, money
// transmitter rules, AML/KYC obligations, sanctions screening). Before any
// production launch, have legal counsel review: charge-backs on stablecoins,
// source-of-funds verification, transaction monitoring, and whether the
// platform itself needs licensing. The demo mode here performs no identity
// verification and must not be used with real funds.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// POST /api/payments/crypto/create — start a crypto charge for shares.
// Amounts are always recomputed server-side; the client never sets a price.
// ---------------------------------------------------------------------------
router.post("/crypto/create", requireAuth, requireActive, async (req, res, next) => {
  try {
    const { propertyId, shares, currency } = req.body;

    if (!SUPPORTED_CURRENCIES.includes(String(currency).toUpperCase())) {
      return res.status(400).json({ error: "Unsupported cryptocurrency." });
    }
    const coin = String(currency).toUpperCase();
    if (!mongoose.isValidObjectId(propertyId)) {
      return res.status(400).json({ error: "Invalid property." });
    }

    if (
      !throttle(`u:${req.user._id.toString()}`, 5, 10 * 60 * 1000) ||
      !throttle(`i:${req.ip || req.socket?.remoteAddress || "unknown"}`, 15, 10 * 60 * 1000)
    ) {
      return res.status(429).json({ error: "Too many payment requests. Please wait a few minutes." });
    }

    const property = await Property.findOne({ _id: propertyId, status: "active" });
    if (!property) return res.status(404).json({ error: "Property not found." });

    const remaining = property.totalShares - property.soldShares;
    if (remaining <= 0) {
      return res.status(400).json({ error: "This property is fully subscribed." });
    }
    const count = Math.min(Math.max(1, Math.floor(Number(shares))), remaining);
    if (!Number.isFinite(count) || count <= 0) {
      return res.status(400).json({ error: "Enter a valid number of shares." });
    }

    const settings = await getSettings();
    // NOTE: team fee is captured at settlement (approveRequest) exactly like the
    // existing flow — the charge itself is for the full share price.
    const totalUsd = count * property.pricePerShare;
    const cryptoAmount = isConfigured() ? null : cryptoAmountFor(coin, totalUsd);

    const request = await PurchaseRequest.create({
      userId: req.user._id,
      propertyId: property._id,
      propertyName: property.name,
      shares: count,
      pricePerShare: property.pricePerShare,
      totalCost: totalUsd,
      teamFeePct: settings.teamFee,
      teamFeeAmount: (totalUsd * settings.teamFee) / 100,
      status: "pending",
    });

    const charge = await createCharge({
      name: `${property.name} — ${count} share${count > 1 ? "s" : ""}`,
      description: `Fractional ownership in ${property.name}, ${property.city}.`,
      amountUsd: totalUsd,
      paymentId: null,
    });

    const demo = !isConfigured();
    const { date, time } = nowParts();
    const payment = await CryptoPayment.create({
      userId: req.user._id,
      propertyId: property._id,
      propertyName: property.name,
      requestId: request._id,
      shares: count,
      pricePerShare: property.pricePerShare,
      totalUsd,
      currency: coin,
      cryptoAmount:
        charge.pricing && charge.pricing[coin.toLowerCase()]
          ? Number(charge.pricing[coin.toLowerCase()].amount)
          : cryptoAmount,
      chargeId: charge.chargeId,
      chargeCode: charge.chargeCode,
      hostedUrl: charge.hostedUrl,
      walletAddress: demo ? simulatedAddress(coin) : null,
      demo,
      expiresAt: new Date(Date.now() + PAYMENT_TTL_MS),
      date,
      time,
    });

    await logActivity({
      userId: req.user._id,
      type: "payment_created",
      message: `Started a ${coin} crypto payment for ${count} share${
        count > 1 ? "s" : ""
      } in ${property.name} (${money(totalUsd)}).${demo ? " [demo mode]" : ""}`,
      meta: { paymentId: payment._id.toString(), chargeId: charge.chargeId },
    });
    emitToAdmins("payments:changed");

    // Demo mode — schedule an automatic confirmation so the flow completes
    // without a gateway. (getStatus also fast-forwards if the timer is lost,
    // e.g. after a server restart.)
    if (demo) {
      setTimeout(() => {
        settlePayment(payment, {
          txHash: simulatedTxHash(coin),
          network: coin === "BTC" ? "bitcoin" : "ethereum",
          eventType: "demo:confirmed",
        }).catch((err) => console.error("[payments] demo settle failed:", err.message));
      }, DEMO_CONFIRM_MS);
    }

    res.status(201).json({ payment: payment.toSafeJSON() });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// POST /api/payments/crypto/webhook — Coinbase Commerce events.
// The raw body is captured in app.js so the signature can be verified.
// ---------------------------------------------------------------------------
router.post("/crypto/webhook", async (req, res) => {
  // The signature check is the only gate: with no secret configured it fails
  // closed (401), with the demo secret it accepts locally-simulated events,
  // and with the real secret it accepts live gateway events. Never trust an
  // unverified webhook. A light IP limiter also guards against replay floods.
  if (!throttle(`w:${req.ip || req.socket?.remoteAddress || "unknown"}`, 120, 60 * 1000)) {
    return res.status(429).json({ error: "Too many webhook events." });
  }
  const signature = req.headers["x-cc-webhook-signature"];
  if (!verifyWebhookSignature(req.rawBody || "", signature)) {
    return res.status(401).json({ error: "Invalid webhook signature." });
  }

  try {
    const payload = req.body;
    const event = payload && payload.event;
    const type = event && event.type;
    const chargeId = event && event.data && event.data.id;
    if (!chargeId) return res.status(400).json({ error: "Malformed event." });

    const payment = await CryptoPayment.findOne({ chargeId });
    if (!payment) return res.status(200).json({ ok: true }); // unknown charge — ack

    // Record transitional states for the UI timeline.
    if (type === "charge:pending" && payment.status === "pending") {
      payment.status = "confirming";
      payment.lastEvent = type;
      await payment.save();
      emitToUser(payment.userId, "payment:status", {
        id: payment._id.toString(),
        status: payment.status,
      });
      return res.json({ ok: true });
    }

    if (type === "charge:failed") {
      if (!["confirmed"].includes(payment.status)) {
        payment.status = "failed";
        payment.lastEvent = type;
        await payment.save();
        emitToUser(payment.userId, "payment:status", {
          id: payment._id.toString(),
          status: payment.status,
        });
      }
      return res.json({ ok: true });
    }

    if (type === "charge:confirmed" || type === "charge:resolved") {
      const payments = (event.data.payments || []);
      const last = payments[payments.length - 1] || {};
      const settled = await settlePayment(payment, {
        txHash: last.transaction_id || null,
        network: last.network || null,
        eventType: type,
      });
      return res.json({ ok: settled.ok !== false });
    }

    // charge:created / charge:delayed — nothing actionable.
    return res.json({ ok: true });
  } catch (err) {
    console.error("[payments] webhook error:", err.message);
    return res.status(500).json({ error: "Webhook processing failed." });
  }
});

// ---------------------------------------------------------------------------
// GET /api/payments/crypto/status/:id — poll endpoint for the checkout UI.
// Returns the payment plus settled request/transaction/token once confirmed.
// ---------------------------------------------------------------------------
router.get("/crypto/status/:id", requireAuth, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: "Invalid payment." });
    }
    const payment = await CryptoPayment.findById(req.params.id);
    if (!payment) return res.status(404).json({ error: "Payment not found." });

    const isOwner = payment.userId.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== "superadmin") {
      return res.status(403).json({ error: "Access denied." });
    }

    // Expire abandoned payments.
    if (
      payment.status === "pending" &&
      payment.expiresAt &&
      new Date() > payment.expiresAt
    ) {
      payment.status = "expired";
      await payment.save();
    }

    // Live mode reconciliation: the status endpoint doubles as a webhook
    // fallback — if a gateway event was lost, polling the charge directly
    // surfaces confirmations without waiting for a retry.
    if (
      isConfigured() &&
      ["pending", "confirming"].includes(payment.status) &&
      payment.chargeId
    ) {
      try {
        const charge = await getChargeStatus(payment.chargeId);
        const timeline = charge?.timeline || [];
        const last = timeline[timeline.length - 1];
        if (last?.status === "COMPLETED" && last.context === "charge_confirmed") {
          await settlePayment(payment, { eventType: "charge:confirmed" });
        }
      } catch (err) {
        console.error("[payments] charge reconcile failed:", err.message);
      }
    }

    // Demo fast-forward: if the scheduled timer was lost (e.g. restart),
    // settle once enough time has passed.
    if (
      payment.demo &&
      payment.status === "pending" &&
      Date.now() - new Date(payment.createdAt).getTime() >= DEMO_CONFIRM_MS
    ) {
      await settlePayment(payment, {
        txHash: simulatedTxHash(payment.currency),
        network: payment.currency === "BTC" ? "bitcoin" : "ethereum",
        eventType: "demo:confirmed",
      }).catch((err) => console.error("[payments] demo settle failed:", err.message));
    }

    const out = { payment: payment.toSafeJSON() };

    // Attach settlement details once confirmed so the UI can show a receipt.
    if (payment.status === "confirmed" && payment.requestId) {
      const request = await PurchaseRequest.findById(payment.requestId);
      if (request) out.request = request.toSafeJSON();
      const { transaction, token } = await settleInfo(payment);
      if (transaction) out.transaction = transaction.toSafeJSON();
      if (token) out.token = token.toSafeJSON();
    }

    res.json(out);
  } catch (err) {
    next(err);
  }
});

/** Surface a failed settlement to the user + admins + activity feed. */
function notifyFailure(payment) {
  emitToUser(payment.userId, "payment:status", {
    id: payment._id.toString(),
    status: payment.status,
  });
  emitToAdmins("payments:changed");
  logActivity({
    userId: payment.userId,
    type: "payment_failed",
    message: `Crypto payment failed — ${payment.shares} share${payment.shares > 1 ? "s" : ""} in ${payment.propertyName}. ${payment.note || ""}`.trim(),
    meta: { paymentId: payment._id.toString(), chargeId: payment.chargeId },
  }).catch(() => {});
}

/** Pull the Transaction + Token created during settlement for a receipt. */
async function settleInfo(payment) {
  const Transaction = (await import("../models/Transaction.js")).default;
  const Token = (await import("../models/Token.js")).default;
  const transaction = payment.requestId
    ? await Transaction.findOne({ requestId: payment.requestId })
    : null;
  const token = payment.requestId
    ? await Token.findOne({ requestId: payment.requestId })
    : null;
  return { transaction, token };
}

export default router;
