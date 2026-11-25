import { z } from "zod";

const email = z.string().trim().toLowerCase().pipe(z.email());

// A six-digit code, trimmed so a pasted code with a stray space still works.
// Defined before the schemas that use it: they are built when this module
// loads, so a later `const` would be read before it exists.
const sixDigitCode = z
  .string()
  .trim()
  .regex(/^\d{6}$/, "Enter the 6-digit code from the email");

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
  code: sixDigitCode,
});

// Resend only needs the address. Whether an account exists is deliberately
// not revealed by the response.
export const resendVerificationSchema = z.object({ email });

// Deleting an account asks for the password again, so a stolen cookie (or a
// stray click) alone cannot wipe the account.
export const deleteAccountSchema = z.object({
  password: z.string().min(1, "Enter your password").max(72),
});

// The ID token Google hands the browser. It is long but finite; anything
// wildly larger is not a real token. The real check happens in googleAuth.
export const googleCredentialSchema = z.object({
  credential: z.string().min(20, "Google sign-in failed").max(4000),
});

// Asking for a code by email. The kind of code is chosen by the caller, not
// named in the body, so a client cannot ask for any other purpose.
export const otpRequestSchema = z.object({ email });

export const otpLoginSchema = z.object({
  email,
  code: sixDigitCode,
});

// Deletes the logged-in account by proving the mailbox instead of a password.
export const deleteAccountWithCodeSchema = z.object({ code: sixDigitCode });

// Adding a password to a Google account. `currentPassword` is optional because
// such an account has no password to confirm. For an account that already has
// one, the service requires it and checks it.
export const setPasswordSchema = z.object({
  currentPassword: z.string().max(72).optional(),
  newPassword: password,
});
