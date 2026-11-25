import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { getUserById } from "../services/auth.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { COOKIE_NAME } from "../utils/authToken.js";

// Reads the login cookie when there is one, but never refuses the request.
// This is for "who is logged in?" checks: the answer "nobody" is a normal
// answer, not an error, so the browser is not handed a 401 it must log.
//
// Everything that actually needs a user still uses requireAuth.
export const optionalAuth = asyncHandler(async (req, _res, next) => {
  req.user = null;
  const token = req.cookies[COOKIE_NAME];

  if (token) {
    try {
      const payload = jwt.verify(token, env.JWT_SECRET, {
        algorithms: ["HS256"],
      });

      // Null when the account was deleted since the cookie was made.
      req.user = await getUserById(payload.sub);
    } catch {
      // Broken or expired cookie: that just means "not logged in".
      req.user = null;
    }
  }

  next();
});
