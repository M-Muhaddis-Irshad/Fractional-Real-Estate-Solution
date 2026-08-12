import mongoose from "mongoose";

export const USER_STATUSES = ["pending", "active", "rejected", "suspended"];
export const USER_ROLES = ["user", "superadmin"];
export const USER_PROVIDERS = ["local", "google"];

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
    // Password is only required for local (email/password) accounts. Google
    // users have no password and can't sign in with one until they set it.
    passwordHash: {
      type: String,
      validate: {
        validator(value) {
          if (this.provider === "google") return value == null;
          return typeof value === "string" && value.length > 0;
        },
        message: "Password is required for local accounts.",
      },
    },
    role: { type: String, enum: USER_ROLES, default: "user" },
    status: { type: String, enum: USER_STATUSES, default: "pending" },
    // Authentication provider: local (email/password) or google (OAuth).
    // A user who later links Google still stays "local" so their password keeps working.
    provider: { type: String, enum: USER_PROVIDERS, default: "local" },
    // Google account id — set only for OAuth users. Sparse + unique so users
    // who never sign in with Google simply don't have the field at all (a
    // default value would conflict with the unique index).
    googleId: { type: String, unique: true, sparse: true },
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
