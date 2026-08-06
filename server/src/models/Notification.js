import mongoose from "mongoose";

const AUDIENCES = ["all", "users", "admins"];
const CHANNELS = ["in_app", "email", "push"];

const notificationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    message: { type: String, required: true, trim: true, maxlength: 1000 },
    audience: { type: String, enum: AUDIENCES, default: "all" },
    channel: { type: String, enum: CHANNELS, default: "in_app" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    active: { type: Boolean, default: true },
    readBy: { type: [mongoose.Schema.Types.ObjectId], ref: "User", default: [] },
  },
  { timestamps: true }
);

notificationSchema.methods.toSafeJSON = function toSafeJSON() {
  const obj = this.toObject();
  return { ...obj, id: obj._id.toString(), read: false };
};

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
