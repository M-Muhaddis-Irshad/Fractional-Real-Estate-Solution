import mongoose from "mongoose";

export const CRYPTO_PAYMENT_STATUSES = [
  "pending",
  "confirming",
  "confirmed",
  "failed",
  "expired",
];
export const SUPPORTED_CURRENCIES = ["BTC", "ETH", "USDC", "USDT"];

/**
 * A single crypto payment attempt for a fractional property purchase.
 * One payment links to one pending PurchaseRequest; when the gateway (or the
 * demo simulator) confirms it, the request is settled through the existing
 * approveRequest pipeline (shares sold + token minted on the Flux Chain).
 *
 * Kept separate from Transaction/other models so fiat-style instant settlement
 * is completely unaffected — crypto is an additional payment method, not a
 * replacement for the existing flow.
 */
const cryptoPaymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
      index: true,
    },
    propertyName: { type: String, required: true },
    requestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PurchaseRequest",
      default: null,
    },
    shares: { type: Number, required: true, min: 1 },
    pricePerShare: { type: Number, required: true, min: 0 },
    // Fiat-equivalent amount charged (computed server-side from shares × price).
    totalUsd: { type: Number, required: true, min: 0 },
    currency: { type: String, enum: SUPPORTED_CURRENCIES, required: true, index: true },
    // Amount of `currency` the user must pay (from gateway pricing, or the
    // demo rate when no gateway is configured).
    cryptoAmount: { type: Number, default: null },

    // Coinbase Commerce charge identity (demo_* ids when simulated).
    chargeId: { type: String, default: null, index: true },
    chargeCode: { type: String, default: null },
    hostedUrl: { type: String, default: null },
    // Demo mode shows a platform address for illustration only.
    walletAddress: { type: String, default: null },

    status: {
      type: String,
      enum: CRYPTO_PAYMENT_STATUSES,
      default: "pending",
      index: true,
    },
    txHash: { type: String, default: null },
    network: { type: String, default: null },
    explorerUrl: { type: String, default: null },
    lastEvent: { type: String, default: null },

    // True when this payment was created without a gateway key (simulated).
    demo: { type: Boolean, default: false },
    expiresAt: { type: Date, default: null },
    confirmedAt: { type: Date, default: null },
    note: { type: String, default: null },
    date: { type: String, default: null },
    time: { type: String, default: null },
  },
  { timestamps: true }
);

cryptoPaymentSchema.methods.toSafeJSON = function toSafeJSON() {
  const obj = this.toObject();
  return { ...obj, id: obj._id.toString() };
};

const CryptoPayment = mongoose.model("CryptoPayment", cryptoPaymentSchema);
export default CryptoPayment;
