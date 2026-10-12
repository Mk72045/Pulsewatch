import Redis from "ioredis";
import { env } from "./env.js";
import { logger } from "./logger.js";

// Null until connectRedis succeeds. The API runs without Redis.
export let redis = null;

export async function connectRedis() {
  if (!env.REDIS_URL) {
    logger.info("Redis disabled");
    return;
  }

  const client = new Redis(env.REDIS_URL, {
    lazyConnect: true,
    maxRetriesPerRequest: null,
    connectTimeout: 8000,
    // Upstash blocks the INFO command ioredis uses to decide "ready".
    enableReadyCheck: false,
    retryStrategy(times) {
      if (times > 3) {
        return null;
      }

      return 200;
    },
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
    logger.warn({ err: error }, "Redis unavailable; continuing without it");
  }
}

// BullMQ opens its own connections. It must not share the health-check client.
// The worker waits forever on Redis. The API should fail a request quickly.
export function bullmqConnection(role) {
  if (!env.REDIS_URL) {
    return null;
  }

  return {
    url: env.REDIS_URL,
    maxRetriesPerRequest: role === "worker" ? null : 1,
    enableReadyCheck: false,
  };
}

export async function disconnectRedis() {
  if (!redis || redis.status === "end") {
    return;
  }

  await redis.quit();
  redis = null;
  logger.info("Redis disconnected");
}
