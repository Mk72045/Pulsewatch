import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { getUserById } from "../services/auth.service.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { COOKIE_NAME } from "../utils/authToken.js";

// Put this before any route that needs a logged-in user.
export const requireAuth = asyncHandler(async (req, _res, next) => {
  const token = req.cookies[COOKIE_NAME];

  if (!token) {
    throw new ApiError(401, "Please log in");
  }

  let payload;

  try {
    payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ["HS256"] });
  } catch {
    // Wrong signature, broken token or expired: all mean "log in again".
    throw new ApiError(401, "Session expired or invalid. Please log in again");
  }

  // The token can be valid while the user was deleted since.
  const user = await getUserById(payload.sub);

  if (!user) {
    throw new ApiError(401, "Please log in");
  }

  req.user = user;
  next();
});
