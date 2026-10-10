import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

// connected to the root directory
const backendRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

process.loadEnvFile(path.join(backendRoot, ".env"));

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]),
  PORT: z.coerce.number().int().min(1).max(65535),
  MONGO_URI: z.string().min(1),
  CLIENT_URL: z.url(),
  REDIS_URL: z.url().optional(),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error(z.prettifyError(result.error));
  process.exit(1);
}

export const env = result.data;
