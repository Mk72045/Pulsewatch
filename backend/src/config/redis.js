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
    connectTimeout: 5000,
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

export async function disconnectRedis() {
  if (!redis || redis.status === "end") {
    return;
  }

  await redis.quit();
  redis = null;
  logger.info("Redis disconnected");
}
