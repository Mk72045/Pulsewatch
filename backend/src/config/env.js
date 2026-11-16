import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  PORT: z.coerce.number().int().min(1).max(65535).default(5000),

  MONGO_URI: z.string().min(1),

  CLIENT_URL: z.url(),

  REDIS_URL: z.url(),

  JWT_SECRET: z.string().min(32),

  RATE_LIMIT_TIME: z.string().default(15),

  JWT_EXPIRES_DAYS: z.coerce.number().int().min(1).max(30).default(7),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error("Invalid environment variables:");
  console.error(z.prettifyError(result.error));
  process.exit(1);
}

export const env = result.data;
