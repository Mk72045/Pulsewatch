import dotenv from "dotenv";
import { z } from "zod";

dotenv.config({ quiet: true });

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  PORT: z.coerce.number().int().min(1).max(65535).default(5000),

  MONGO_URI: z.string().min(1),

  CLIENT_URL: z.url(),

  REDIS_URL: z.url(),

  JWT_SECRET: z.string().min(32),

  RATE_LIMIT_TIME: z.coerce.number().int().min(1).default(15),

  JWT_EXPIRES_DAYS: z.coerce.number().int().min(1).max(30).default(7),

  MAX_MONITORS_PER_USER: z.coerce.number().int().min(1),

  // How long one URL check may take before it counts as failed.
  CHECK_TIMEOUT_MS: z.coerce.number().int().min(1000).max(30000).default(10000),

  // How often the scheduler looks for monitors that are due for a check.
  SCHEDULER_TICK_SECONDS: z.coerce.number().int().min(5).max(300).default(15),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error("Invalid environment variables:");
  console.error(z.prettifyError(result.error));
  process.exit(1);
}

export const env = result.data;
