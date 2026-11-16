import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

// connected to the root directory
const backendRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const envFile = path.join(backendRoot, ".env");

if (!fs.existsSync(envFile)) {
  console.error(
    "Could not load backend/.env. Copy backend/.env.example to backend/.env.",
  );
  process.exit(1);
}

// Read the file in JavaScript and assign process.env ourselves.
// Node's process.loadEnvFile writes to the real environment, but Jest keeps
// its own copy of process.env and would not see those values.
for (const line of fs.readFileSync(envFile, "utf8").split(/\r?\n/)) {
  const trimmed = line.trim();

  if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
    continue;
  }

  const separator = trimmed.indexOf("=");
  const key = trimmed.slice(0, separator).trim();
  const value = trimmed.slice(separator + 1).trim();

  // Keep a variable that the shell or the test runner already set.
  if (process.env[key] === undefined) {
    process.env[key] = value;
  }
}

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]),
  PORT: z.coerce.number().int().min(1).max(65535),
  MONGO_URI: z.string().min(1),
  CLIENT_URL: z.url(),
  REDIS_URL: z.url().optional(),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_DAYS: z.coerce.number().int().min(1).max(30).default(7),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error(z.prettifyError(result.error));
  process.exit(1);
}

export const env = result.data;
