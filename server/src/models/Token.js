import mongoose from "mongoose";

const tokenSchema = new mongoose.Schema(
  {
    tokenId: { type: String, required: true, unique: true, index: true },
    kind: { type: String, enum: ["genesis", "mint"], default: "mint" },
    // Chain linkage — every block references the hash of the previous one.
    blockNumber: { type: Number, required: true, unique: true, index: true },
    previousHash: { type: String, default: "0".repeat(64) },
    hash: { type: String, required: true, index: true },
    nonce: { type: Number, default: 0 },
    // Canonical payload the block hash is computed over, so the whole
    // chain can be re-verified deterministically.
    data: { type: String, required: true },

    // Tokenised ownership details.
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    ownerName: { type: String, default: "" },
    propertyId: { type: mongoose.Schema.Types.ObjectId, ref: "Property", default: null, index: true },
    propertyName: { type: String, default: "" },
    symbol: { type: String, default: "" },
    shares: { type: Number, default: 0 },
    pricePerShare: { type: Number, default: 0 },
    totalValue: { type: Number, default: 0 },
    txHash: { type: String, default: "" },
    transactionId: { type: mongoose.Schema.Types.ObjectId, ref: "Transaction", default: null },
    requestId: { type: mongoose.Schema.Types.ObjectId, ref: "PurchaseRequest", default: null },
    status: { type: String, enum: ["minted", "burned"], default: "minted" },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

tokenSchema.methods.toSafeJSON = function toSafeJSON() {
  const obj = this.toObject();
  return { ...obj, id: obj._id.toString() };
};

const Token = mongoose.model("Token", tokenSchema);
export default Token;
