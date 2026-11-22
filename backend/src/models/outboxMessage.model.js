import mongoose from "mongoose";
import { OUTBOX_KEEP_DAYS } from "../config/constants.js";

// One message waiting to be sent to one channel. It stays here until it is
// sent, or given up after too many hours.
const outboxMessageSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    channel: { type: String, enum: ["email", "telegram"], required: true },
    // The email address, or the Telegram chat id, this message goes to.
    to: { type: String, required: true },
    // Emails only.
    subject: { type: String, default: null },
    text: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "sent", "failed"],
      default: "pending",
    },
    attempts: { type: Number, default: 0 },
    nextAttemptAt: { type: Date, default: Date.now },
    lastError: { type: String, default: null },
    // Set when the message is sent or given up. MongoDB deletes the row some
    // days later. A row that is still pending has null here and never expires.
    finishedAt: {
      type: Date,
      default: null,
      expires: OUTBOX_KEEP_DAYS * 24 * 60 * 60,
    },
  },
  { timestamps: true, versionKey: false },
);

// "Which pending messages are due now?"
outboxMessageSchema.index({ status: 1, nextAttemptAt: 1 });

export const OutboxMessage = mongoose.model(
  "OutboxMessage",
  outboxMessageSchema,
);
