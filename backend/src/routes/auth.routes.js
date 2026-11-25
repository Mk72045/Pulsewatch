import { Router } from "express";
import {
  deleteAccount,
  deleteAccountWithCode,
  login,
  loginWithCode,
  logout,
  me,
  register,
  requestDeleteCode,
  requestLoginCode,
  resendVerification,
  setPassword,
  signInWithGoogleAccount,
  verifyEmail,
} from "../controllers/auth.controller.js";
import { optionalAuth } from "../middlewares/optionalAuth.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import { authLimiter } from "../middlewares/rateLimiter.js";
import { validate } from "../middlewares/validate.js";
import {
  deleteAccountSchema,
  deleteAccountWithCodeSchema,
  googleCredentialSchema,
  loginSchema,
  otpLoginSchema,
  otpRequestSchema,
  registerSchema,
  resendVerificationSchema,
  setPasswordSchema,
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
// Who is logged in? Answering "nobody" is a normal answer, so this never
// refuses the request: logged out is `user: null` with a 200, not a 401.
authRouter.get("/me", optionalAuth, me);

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

// The same deletion, proven with a code instead of a password. A session is
// still required, so nobody can ask for codes against another person's
// address. The request always answers the same way.
authRouter.post(
  "/account/otp/request",
  requireAuth,
  authLimiter,
  asyncHandler(requestDeleteCode),
);
authRouter.delete(
  "/account/otp",
  requireAuth,
  authLimiter,
  validate(deleteAccountWithCodeSchema),
  asyncHandler(deleteAccountWithCode),
);

// Sign in without a password by proving the email address. The request always
// answers the same way, and the strict limiter slows both guessing the code
// and using this to find out which addresses have accounts.
authRouter.post(
  "/otp/request",
  authLimiter,
  validate(otpRequestSchema),
  asyncHandler(requestLoginCode),
);
authRouter.post(
  "/otp/login",
  authLimiter,
  validate(otpLoginSchema),
  asyncHandler(loginWithCode),
);

// Google sign-in, used by both pages. The body holds only Google's signed ID
// token; the account details are read from that token after it is verified,
// never from the body. It shares the strict limiter because a bad token
// counts as a failed try.
authRouter.post(
  "/google",
  authLimiter,
  validate(googleCredentialSchema),
  asyncHandler(signInWithGoogleAccount),
);

// Adds a password to an account created with Google, so it is not the only
// way in. Registered users use this from Settings.
authRouter.post(
  "/password",
  requireAuth,
  validate(setPasswordSchema),
  asyncHandler(setPassword),
);
