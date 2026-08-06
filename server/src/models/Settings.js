import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema(
  {
    _id: { type: String, default: "singleton" },
    teamFee: { type: Number, default: 2.25 },
    teamEarnings: { type: Number, default: 0 },
    termsVersion: { type: String, default: "1.0" },
    termsText: { type: String, default: "" },
    content: { type: mongoose.Schema.Types.Mixed, default: null },
    platform: { type: mongoose.Schema.Types.Mixed, default: {} },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

const Settings = mongoose.model("Settings", settingsSchema);

export async function getSettings() {
  const existing = await Settings.findById("singleton");
  if (existing) return existing;
  return Settings.create({ _id: "singleton" });
}

export default Settings;
