
import Redis from "ioredis";
import { env } from "./env.js";
import { logger } from "./logger.js";

export let redis = null;

// Connect to Redis
export async function connectRedis() {
  if (!env.REDIS_URL) {
    logger.info("Redis disabled");
    return;
  }

  const client = new Redis(env.REDIS_URL, {
    lazyConnect: true,
    enableReadyCheck: false,
    retryStrategy: (times) => (times > 3 ? null : 200),
  });

  client.on("error", (error) => {
    logger.error({ err: error }, "Redis connection error");
  });

  try {
    await client.connect();
    await client.ping();

    redis = client;
    logger.info("Redis connected");
  } catch (error) {
    client.disconnect();
    redis = null;

    logger.warn({ err: error }, "Redis unavailable");
  }
}

// BullMQ connection configuration
export function bullmqConnection(role) {
  if (!env.REDIS_URL) return null;

  return {
    url: env.REDIS_URL,
    maxRetriesPerRequest: role === "worker" ? null : 1,
    enableReadyCheck: false,
  };
}

// Disconnect Redis
export async function disconnectRedis() {
  if (!redis || redis.status === "end") return;

  await redis.quit();
  redis = null;

  logger.info("Redis disconnected");
}
