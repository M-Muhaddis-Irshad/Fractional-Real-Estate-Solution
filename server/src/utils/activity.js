import Activity from "../models/Activity.js";

export async function logActivity({ userId, byUserId = null, type, message, meta = {} }) {
  try {
    await Activity.create({ userId, byUserId, type, message, meta });
  } catch (err) {
    console.error("[activity] failed to log:", err.message);
  }
}
