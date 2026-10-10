import dns from "node:dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);

import mongoose from "mongoose";
import { env } from "./env.js";
import { logger } from "./logger.js";

export async function connectDB() {
  // registers an event listener that runs when the connection emits an error
  mongoose.connection.on("error", (error) => {
    logger.error({ err: error }, "MongoDB connection error");
  });

  await mongoose.connect(env.MONGO_URI, {
    serverSelectionTimeoutMS: 5000,
  });

  logger.info("MongoDB connected");
}

export async function disconnectDB() {
  await mongoose.disconnect();
  logger.info("MongoDB disconnected");
}
