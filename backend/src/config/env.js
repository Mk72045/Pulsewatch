import dotenv from "dotenv";
import { z } from "zod";

// A time zone name such as "Asia/Kolkata". Used to check ALERT_TIME_ZONE.
function isValidTimeZone(name) {
  try {
    new Intl.DateTimeFormat("en", { timeZone: name });
    return true;
  } catch {
    return false;
  }
}

// quiet: true stops dotenv from printing a message on every start.
dotenv.config({ quiet: true });

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  PORT: z.coerce.number().int().min(1).max(65535).default(5000),

  MONGO_URI: z.string().min(1),

  CLIENT_URL: z.url(),

  JWT_SECRET: z.string().min(32),

  RATE_LIMIT_TIME: z.coerce.number().int().min(1).default(15),

  JWT_EXPIRES_DAYS: z.coerce.number().int().min(1).max(30).default(7),

  MAX_MONITORS_PER_USER: z.coerce.number().int().min(1),

  // How long one URL check may take before it counts as failed.
  CHECK_TIMEOUT_MS: z.coerce.number().int().min(1000).max(30000).default(10000),

  // How often the scheduler looks for monitors that are due for a check.
  SCHEDULER_TICK_SECONDS: z.coerce.number().int().min(5).max(300).default(15),

  // Email alerts go out through Brevo's HTTP API. Without these keys the app
  // still runs, it just cannot send email.
  BREVO_API_KEY: z.string().optional(),
  MAIL_FROM_EMAIL: z.string().optional(),
  MAIL_FROM_NAME: z.string().default("Pulsewatch"),

  // Alert messages show times in this time zone. The server itself keeps UTC.
  ALERT_TIME_ZONE: z
    .string()
    .refine(isValidTimeZone, "Not a valid time zone name")
    .default("Asia/Kolkata"),

  // How many proxies sit in front of the server. Behind Vercel and Render it is
  // 2, so the real visitor address is found. On a laptop there is none, so 0.
  TRUST_PROXY: z.coerce.number().int().min(0).max(5).default(0),

  // Telegram alerts. Without them the app still runs, it just has no Telegram.
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  TELEGRAM_BOT_USERNAME: z.string().optional(),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error("Invalid environment variables:");
  console.error(z.prettifyError(result.error));
  process.exit(1);
}

export const env = result.data;
