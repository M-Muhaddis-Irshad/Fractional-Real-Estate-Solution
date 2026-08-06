import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

export function signToken(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, SECRET, {
    expiresIn: EXPIRES_IN,
  });
}

export function verifyToken(token) {
  return jwt.verify(token, SECRET);
}
