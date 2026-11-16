import { Queue } from "bullmq";
import { logger } from "../config/logger.js";
import { bullmqConnection } from "../config/redis.js";

const connection = bullmqConnection("api");

// One named list in Redis. The API adds jobs. The worker takes them.
export const checkQueue = connection
  ? new Queue("checks", { connection })
  : null;

if (checkQueue) {
  checkQueue.on("error", (error) => {
    logger.error({ err: error }, "Check queue error");
  });
}
