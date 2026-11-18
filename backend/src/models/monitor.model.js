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
  },
  { timestamps: true, versionKey: false },
);

// A user cannot add the same URL twice. Because `user` is the first field,
// this index also speeds up "list the monitors of this user".
monitorSchema.index({ user: 1, url: 1 }, { unique: true });

export const Monitor = mongoose.model("Monitor", monitorSchema);
