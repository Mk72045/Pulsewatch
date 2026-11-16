import { z } from "zod";

const email = z.string().trim().toLowerCase().pipe(z.email());

export const registerSchema = z.object({
  name: z.string().trim().min(1).max(60),
  email,
  // bcrypt only reads the first 72 bytes, so a longer password adds nothing.
  password: z.string().min(8).max(72),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1).max(72),
});
