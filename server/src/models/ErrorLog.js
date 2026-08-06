import mongoose from "mongoose";

const errorLogSchema = new mongoose.Schema(
  {
    type: { type: String, default: "unhandled", index: true },
    message: { type: String, default: "" },
    stack: { type: String, default: "" },
    method: { type: String, default: null },
    path: { type: String, default: null },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

errorLogSchema.index({ createdAt: -1 });

const ErrorLog = mongoose.model("ErrorLog", errorLogSchema);
export default ErrorLog;
