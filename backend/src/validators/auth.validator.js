import { z } from "zod";

const email = z.string().trim().toLowerCase().pipe(z.email());

const password = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .max(72, "Password cannot exceed 72 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(
    /[^A-Za-z0-9]/,
    "Password must contain at least one special character",
  );

export const registerSchema = z.object({
  name: z.string().trim().min(1).max(60),
  email,
  password,
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1).max(72),
});

// The code is always six digits, but it is trimmed so a pasted code with a
// stray space still works.
export const verifyEmailSchema = z.object({
  email,
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Enter the 6-digit code from the email"),
});

// Resend only needs the address. Whether an account exists is deliberately
// not revealed by the response.
export const resendVerificationSchema = z.object({ email });

// Deleting an account asks for the password again, so a stolen cookie (or a
// stray click) alone cannot wipe the account.
export const deleteAccountSchema = z.object({
  password: z.string().min(1, "Enter your password").max(72),
});
