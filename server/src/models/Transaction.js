import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
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
    },
    propertyName: { type: String, required: true },
    shares: { type: Number, required: true, min: 1 },
    pricePerShare: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    teamFee: { type: Number, default: 0 },
    teamFeePct: { type: Number, default: 0 },
    date: { type: String, default: null },
    time: { type: String, default: null },
    requestId: { type: mongoose.Schema.Types.ObjectId, ref: "PurchaseRequest" },
  },
  { timestamps: true }
);

transactionSchema.methods.toSafeJSON = function toSafeJSON() {
  const obj = this.toObject();
  return { ...obj, id: obj._id.toString() };
};

const Transaction = mongoose.model("Transaction", transactionSchema);
export default Transaction;
