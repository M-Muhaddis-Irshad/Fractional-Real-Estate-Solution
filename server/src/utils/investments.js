import User from "../models/User.js";
import Property from "../models/Property.js";
import Transaction from "../models/Transaction.js";
import { getSettings } from "../models/Settings.js";
import { logActivity } from "./activity.js";
import { money, nowParts } from "./format.js";
import { mintTokens } from "./tokenchain.js";

/**
 * Settle a pending purchase request end-to-end:
 *  - atomically sell the shares on the property,
 *  - accrue the team fee,
 *  - create the transaction record,
 *  - mark the request approved,
 *  - mint the ownership token on the Flux Chain,
 *  - log the activity.
 *
 * `actor` is the approving admin document, or `null` for system
 * auto-approval (e.g. when the platform runs without a review gate).
 */
export async function approveRequest(actor, request) {
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

  // Atomic guard so concurrent purchases can never oversell the property.
  const updated = await Property.findOneAndUpdate(
    { _id: property._id, soldShares: { $lte: property.totalShares - request.shares } },
    { $inc: { soldShares: request.shares } },
    { new: true }
  );
  if (!updated) {
    return { ok: false, error: "Not enough shares remaining for this request." };
  }

  const settings = await getSettings();
  settings.teamEarnings += request.teamFeeAmount;
  settings.updatedBy = actor ? actor._id : null;
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
  request.processedBy = actor ? actor._id : null;
  await request.save();

  let token = null;
  try {
    token = await mintTokens({
      user,
      property,
      shares: request.shares,
      pricePerShare: request.pricePerShare,
      totalValue: request.totalCost,
      requestId: request._id,
      transactionId: transaction._id,
    });
  } catch (err) {
    console.error("[tokenchain] mint failed (settlement kept):", err.message);
  }

  await logActivity({
    userId: user._id,
    byUserId: actor ? actor._id : null,
    type: "request_approved",
    message: `${request.shares} share${request.shares > 1 ? "s" : ""} secured in ${property.name} (${money(request.totalCost)})${
      actor ? "" : " — auto-approved"
    }.`,
    meta: {
      requestId: request._id.toString(),
      propertyId: property._id.toString(),
      transactionId: transaction._id.toString(),
      tokenId: token ? token.tokenId : null,
    },
  });

  return { ok: true, request, transaction, user, property, token };
}
