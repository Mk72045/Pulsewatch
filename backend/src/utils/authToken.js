import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export const COOKIE_NAME = "token";

export function signToken(userId) {
  return jwt.sign({ sub: userId }, env.JWT_SECRET, {
    expiresIn: `${env.JWT_EXPIRES_DAYS}d`,
  });
}

// One place for the cookie rules, so login, register and logout stay in sync.
export const cookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: env.JWT_EXPIRES_DAYS * 24 * 60 * 60 * 1000,
};
