import mongoose from "mongoose";

export const USER_STATUSES = ["pending", "active", "rejected", "suspended"];
export const USER_ROLES = ["user", "superadmin"];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: USER_ROLES, default: "user" },
    status: { type: String, enum: USER_STATUSES, default: "pending" },
    acceptedTerms: { type: Boolean, default: false },
    acceptedTermsAt: { type: Date, default: null },
    termsVersion: { type: String, default: "1.0" },
    avatar: { type: String, default: null },
    avatarPublicId: { type: String, default: null },
    lastLoginAt: { type: Date, default: null },
    rejectedReason: { type: String, default: null },
    // Onboarding — set once the user has seen/completed the welcome modal on
    // their first login, so it never shows again (persists across devices).
    hasSeenOnboarding: { type: Boolean, default: false },
    // Password reset — stores a SHA-256 hash of the one-time token, so the
    // raw token never touches the DB and each link can be used only once.
    resetTokenHash: { type: String, default: null },
    resetTokenExpires: { type: Date, default: null },
  },
  { timestamps: true }
);

userSchema.methods.toSafeJSON = function toSafeJSON() {
  const { passwordHash, avatarPublicId, ...rest } = this.toObject();
  return { ...rest, id: rest._id.toString() };
};

const User = mongoose.model("User", userSchema);
export default User;
