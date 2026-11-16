
import { z } from "zod";

const email = z.string().trim().toLowerCase().pipe(z.email());

const password = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .max(72, "Password cannot exceed 72 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

export const registerSchema = z.object({
  name: z.string().trim().min(1).max(60),
  email,
  password,
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1).max(72),
});
