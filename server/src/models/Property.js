import mongoose from "mongoose";

const propertySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    city: { type: String, required: true, trim: true, maxlength: 80 },
    type: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    totalValue: { type: Number, required: true, min: 0 },
    pricePerShare: { type: Number, required: true, min: 0 },
    totalShares: { type: Number, required: true, min: 1 },
    soldShares: { type: Number, default: 0, min: 0 },
    yieldPct: { type: Number, required: true, min: 0 },
    initials: { type: String, default: "" },
    hue: { type: Number, default: 0 },
    imageUrl: { type: String, default: null },
    imagePublicId: { type: String, default: null },
    status: {
      type: String,
      enum: ["pending", "active", "rejected", "inactive"],
      default: "pending",
    },
    featured: { type: Boolean, default: false },
    investingOpen: { type: Boolean, default: true },
    listedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

propertySchema.methods.toSafeJSON = function toSafeJSON() {
  const { imagePublicId, ...rest } = this.toObject();
  return { ...rest, id: rest._id.toString() };
};

const Property = mongoose.model("Property", propertySchema);
export default Property;
