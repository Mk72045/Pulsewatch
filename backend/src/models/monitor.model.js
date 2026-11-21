import mongoose from "mongoose";
import { MONITOR_INTERVALS } from "../config/constants.js";

const monitorSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 60 },
    url: { type: String, required: true, trim: true, maxlength: 2048 },
    intervalMinutes: { type: Number, enum: MONITOR_INTERVALS, default: 5 },
    isActive: { type: Boolean, default: true },

    // The result of the latest check. The scheduler fills these in.
    status: {
      type: String,
      enum: ["pending", "up", "down"],
      default: "pending",
    },
    lastCheckedAt: { type: Date, default: null },
    lastResponseTimeMs: { type: Number, default: null },
    lastStatusCode: { type: Number, default: null },
    lastError: { type: String, default: null },
    // When the monitor is due for its next check. A new monitor is due at once.
    nextCheckAt: { type: Date, default: Date.now },
  },
  { timestamps: true, versionKey: false },
);

// A user cannot add the same URL twice. Because `user` is the first field,
// this index also speeds up "list the monitors of this user".
monitorSchema.index({ user: 1, url: 1 }, { unique: true });

// The scheduler asks for "active monitors that are due", so this index serves it.
monitorSchema.index({ isActive: 1, nextCheckAt: 1 });

export const Monitor = mongoose.model("Monitor", monitorSchema);
