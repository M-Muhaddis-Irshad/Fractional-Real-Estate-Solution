import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/User.js";
import { getSettings } from "../models/Settings.js";
import { logActivity } from "./activity.js";

/**
 * Register the Google OAuth strategy once. Env vars are read LAZILY inside this
 * function — not at module scope — because local dev loads server/.env via
 * dotenv AFTER ES module imports are evaluated (see src/index.js). Reading them
 * at module load would capture `undefined` and silently disable Google auth.
 */
export function configurePassport() {
  if (passport._fluxGoogleConfigured) return passport;

  const clientID = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const callbackURL = process.env.GOOGLE_CALLBACK_URL;

  if (!clientID || !clientSecret) {
    console.warn("[auth] GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET not set — Google sign-in disabled");
    return passport;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID,
        clientSecret,
        callbackURL,
        passReqToCallback: true,
      },
      async (req, accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value?.toLowerCase();
          const name = String(
            profile.displayName || email?.split("@")[0] || "Google user"
          ).trim();
          // Google serves the photo at lh3.googleusercontent.com — works
          // directly in the avatar <img> (no broken host).
          const avatar = profile.photos?.[0]?.value || null;
          const googleId = String(profile.id);

          if (!email) {
            return done(null, false, { message: "Your Google account has no verified email." });
          }

          // Link an existing account (e.g. previously signed up by email).
          let user = await User.findOne({ email });
          if (user) {
            if (!user.googleId) user.googleId = googleId;
            // Fill name/avatar only if they're empty — never overwrite custom data.
            // Provider stays "local" for linked accounts so their password keeps working.
            if (!user.name && name) user.name = name;
            if (!user.avatar && avatar) user.avatar = avatar;
            await user.save();
            await logActivity({
              userId: user._id,
              type: "google_signin",
              message: `Signed in with Google (${user.googleId ? "linked" : "existing"} account).`,
            });
            return done(null, user);
          }

          // New Google-only user — no password (local login disabled for them).
          const settings = await getSettings();
          const requireApproval = settings.platform?.requireApproval === true;
          user = await User.create({
            email,
            name,
            avatar,
            provider: "google",
            googleId,
            role: "user",
            status: requireApproval ? "pending" : "active",
            acceptedTerms: true,
            acceptedTermsAt: new Date(),
            termsVersion: settings.termsVersion,
          });
          await logActivity({
            userId: user._id,
            type: "google_signup",
            message: "Account created via Google sign-in.",
          });
          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );

  passport._fluxGoogleConfigured = true;
  return passport;
}

export { passport };