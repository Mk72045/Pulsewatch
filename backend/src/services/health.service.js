import mongoose from "mongoose";
import { redis } from "../config/redis.js";

const mongoStates = {
  0: "disconnected",
  1: "connected",
  2: "connecting",
  3: "disconnecting",
};

// Read-only snapshot. This does not open a new connection.
export function getHealth() {
  const mongoState = mongoStates[mongoose.connection.readyState] ?? "unknown";

  return {
    status: "ok",
    uptime: Math.round(process.uptime()),
    mongodb: mongoState,
    // ioredis uses "ready" once the socket can take commands.
    redis: !redis
      ? "disabled"
      : redis.status === "ready"
        ? "connected"
        : "disconnected",
  };
}
