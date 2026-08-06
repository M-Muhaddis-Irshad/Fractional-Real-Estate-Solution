import mongoose from "mongoose";

const REQUEST_STATUSES = ["pending", "approved", "rejected"];

const purchaseRequestSchema = new mongoose.Schema(
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
    shares: { type: Number, required: true, min: 1 },
    pricePerShare: { type: Number, required: true, min: 0 },
    totalCost: { type: Number, required: true, min: 0 },
    teamFeePct: { type: Number, default: 0 },
    teamFeeAmount: { type: Number, default: 0 },
    status: { type: String, enum: REQUEST_STATUSES, default: "pending" },
    processedAt: { type: Date, default: null },
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    date: { type: String, default: null },
    time: { type: String, default: null },
  },
  { timestamps: true }
);

purchaseRequestSchema.methods.toSafeJSON = function toSafeJSON() {
  const obj = this.toObject();
  return { ...obj, id: obj._id.toString() };
};

const PurchaseRequest = mongoose.model("PurchaseRequest", purchaseRequestSchema);
export default PurchaseRequest;
