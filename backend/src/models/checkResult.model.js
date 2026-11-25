import mongoose from "mongoose";
import { CHECK_HISTORY_DAYS } from "../config/constants.js";

// One row for every check that ran. The history endpoint turns these rows into
// the response-time chart and the uptime percentage.
const checkResultSchema = new mongoose.Schema(
  {
    monitor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Monitor",
      required: true,
    },
    ok: { type: Boolean, required: true },
    statusCode: { type: Number, default: null },
    responseTimeMs: { type: Number, default: null },
    error: { type: String, default: null },
    // MongoDB deletes each row by itself once it is older than this many seconds.
    checkedAt: {
      type: Date,
      default: Date.now,
      expires: CHECK_HISTORY_DAYS * 24 * 60 * 60,
    },
  },
  { versionKey: false },
);

// "The latest results of one monitor", newest first.
checkResultSchema.index({ monitor: 1, checkedAt: -1 });

export const CheckResult = mongoose.model("CheckResult", checkResultSchema);
