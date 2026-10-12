import { Worker } from "bullmq";
import { bullmqConnection } from "../config/redis.js";
import { logger } from "../config/logger.js";

const connection = bullmqConnection("worker");

if (!connection) {
  logger.error("Set REDIS_URL in backend/.env before starting the worker.");
  process.exit(1);
}

// This file is a second Node process. It only pulls jobs from the "checks" queue.
const worker = new Worker(
  "checks",
  async (job) => {
    logger.info(`Processing job ${job.id}`);
  },
  { connection },
);

worker.on("failed", (job, error) => {
  logger.error({ err: error, jobId: job?.id }, "Job failed");
});

async function shutdown(signal) {
  logger.info({ signal }, "Worker shutting down");
  await worker.close();
  process.exit(0);
}

process.on("SIGINT", () => {
  shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  shutdown("SIGTERM");
});

logger.info("Worker waiting for jobs on the checks queue");
