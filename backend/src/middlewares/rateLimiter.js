import { rateLimit } from "express-rate-limit";
import { env } from "../config/env.js";

const windowMs = env.RATE_LIMIT_TIME * 60 * 1000;

// Normal API traffic. The limit is higher in development because React
// StrictMode sends some requests twice and we refresh a lot while testing.
export const rateLimiter = rateLimit({
  windowMs,
  limit: env.NODE_ENV === "development" ? 1000 : 100,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});


// Stricter limit for login and register, to slow down password guessing.
// Only failed attempts count, so a real user who logs in fine is never blocked.
export const authLimiter = rateLimit({
  windowMs,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many failed attempts. Please try again in 15 minutes.",
  },
});