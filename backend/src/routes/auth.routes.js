import { Router } from "express";
import {
  deleteAccount,
  login,
  logout,
  me,
  register,
  resendVerification,
  verifyEmail,
} from "../controllers/auth.controller.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import { authLimiter } from "../middlewares/rateLimiter.js";
import { validate } from "../middlewares/validate.js";
import {
  deleteAccountSchema,
  loginSchema,
  registerSchema,
  resendVerificationSchema,
  verifyEmailSchema,
} from "../validators/auth.validator.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const authRouter = Router();

authRouter.post(
  "/register",
  authLimiter,
  validate(registerSchema),
  asyncHandler(register),
);
authRouter.post(
  "/login",
  authLimiter,
  validate(loginSchema),
  asyncHandler(login),
);
authRouter.post("/logout", logout);
authRouter.get("/me", requireAuth, me);

// Email verification. Both share the strict limiter because they take an
// address and a code, which is exactly what guessing would need.
authRouter.post(
  "/verify-email",
  authLimiter,
  validate(verifyEmailSchema),
  asyncHandler(verifyEmail),
);
authRouter.post(
  "/resend-verification",
  authLimiter,
  validate(resendVerificationSchema),
  asyncHandler(resendVerification),
);

// Deletes the account and all of its data. The shared limiter also slows down
// guessing the password here, since a wrong password is a failed request.
authRouter.delete(
  "/account",
  requireAuth,
  authLimiter,
  validate(deleteAccountSchema),
  asyncHandler(deleteAccount),
);
