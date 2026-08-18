import jwt from "jsonwebtoken";

// Lazy reads — dotenv.config() runs in src/index.js AFTER the import graph is
// evaluated, so module-scope process.env reads here would capture undefined and
// silently fall back to the dev defaults (same bug class as the Google strategy
// and RESET_URL fixes).
const getSecret = () => process.env.JWT_SECRET || "dev-secret-change-me";
const getExpiresIn = () => process.env.JWT_EXPIRES_IN || "7d";

export function signToken(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, getSecret(), {
    expiresIn: getExpiresIn(),
  });
}

export function verifyToken(token) {
  return jwt.verify(token, getSecret());
}
