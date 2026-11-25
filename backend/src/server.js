import { app } from "./app.js";
import { connectDB, disconnectDB } from "./config/db.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { startScheduler, stopScheduler } from "./services/scheduler.service.js";
import {
  startTelegramPolling,
  stopTelegramPolling,
} from "./services/telegramPoller.service.js";

let server;
let shuttingDown = false;

async function shutdown(signal) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  logger.info({ signal }, "Shutting down");

  // If a connection hangs, do not leave the process stuck forever.
  const forceExit = setTimeout(() => {
    logger.error("Shutdown timed out");
    process.exit(1);
  }, 10_000);
  forceExit.unref();

  try {
    if (server) {
      await new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });
    }

    // Stop starting new checks and let a running one finish before the database closes.
    await stopScheduler();
    await stopTelegramPolling();
    await disconnectDB();
    process.exit(0);
  } catch (error) {
    logger.error({ err: error }, "Shutdown failed");
    process.exit(1);
  }
}

async function start() {
  await connectDB();

  server = app.listen(env.PORT, () => {
    logger.info(`Server listening on port ${env.PORT}`);
  });

  startScheduler();
  startTelegramPolling();
}

process.on("SIGINT", () => {
  // SIGINT is what Ctrl+C sends in the terminal
  shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  shutdown("SIGTERM");
});

start().catch(async (error) => {
  logger.error({ err: error }, "Server failed to start");

  // Mongo may already be open if the listen step was what failed.
  await disconnectDB().catch(() => {});
  process.exit(1);
});
