import mongoose from "mongoose";

// One row for every outage of a monitor. resolvedAt stays null while it is going on.
const incidentSchema = new mongoose.Schema(
  {
    monitor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Monitor",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    startedAt: { type: Date, default: Date.now },
    resolvedAt: { type: Date, default: null },
    // What the check reported when the monitor was confirmed down.
    error: { type: String, default: null },
  },
  { versionKey: false },
);

// "Is there an open incident for this monitor?"
incidentSchema.index({ monitor: 1, resolvedAt: 1 });

// "The incidents of this user, newest first." The incidents page will use it.
incidentSchema.index({ user: 1, startedAt: -1 });

export const Incident = mongoose.model("Incident", incidentSchema);
