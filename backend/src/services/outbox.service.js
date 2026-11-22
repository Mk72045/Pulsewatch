import { OUTBOX_GIVE_UP_HOURS } from "../config/constants.js";
import { logger } from "../config/logger.js";
import { OutboxMessage } from "../models/outboxMessage.model.js";
import { sendMail } from "./mail.service.js";
import { sendTelegramMessage } from "./telegram.service.js";

// How long a message is held for itself while it is being sent, in seconds.
const CLAIM_SECONDS = 60;
const MAX_PER_ROUND = 20;

// Saves messages in the outbox. Nothing is sent here, processOutbox does that.
// Each message looks like { user, channel, to, subject, text }.
export function queueMessages(messages) {
  return OutboxMessage.insertMany(messages);
}

// Writes down what happened to a message after one attempt.
async function saveOutcome(message, result) {
  const attempts = message.attempts + 1;

  if (result.ok) {
    await OutboxMessage.updateOne(
      { _id: message._id },
      {
        $set: {
          status: "sent",
          attempts,
          lastError: null,
          finishedAt: new Date(),
        },
      },
    );
    return;
  }

  const ageMs = Date.now() - message.createdAt.getTime();

  if (ageMs > OUTBOX_GIVE_UP_HOURS * 60 * 60 * 1000) {
    await OutboxMessage.updateOne(
      { _id: message._id },
      {
        $set: {
          status: "failed",
          attempts,
          lastError: result.error,
          finishedAt: new Date(),
        },
      },
    );
    logger.error(
      { channel: message.channel, error: result.error },
      "Message given up after too many hours",
    );
    return;
  }

  // Waits 2, 4, 8 minutes and then 15 minutes between tries.
  const minutes = Math.min(2 ** attempts, 15);

  await OutboxMessage.updateOne(
    { _id: message._id },
    {
      $set: {
        attempts,
        lastError: result.error,
        nextAttemptAt: new Date(Date.now() + minutes * 60_000),
      },
    },
  );
  logger.warn(
    { channel: message.channel, error: result.error, attempts },
    `Message not sent, trying again in ${minutes} minutes`,
  );
}

// Sends one message. It never throws.
async function deliver(message) {
  try {
    // Claim it: move nextAttemptAt a minute ahead, but only if it is still what
    // we read. If another round already took this message, nothing matches.
    const claim = await OutboxMessage.updateOne(
      {
        _id: message._id,
        status: "pending",
        nextAttemptAt: message.nextAttemptAt,
      },
      { $set: { nextAttemptAt: new Date(Date.now() + CLAIM_SECONDS * 1000) } },
    );

    if (claim.matchedCount === 0) {
      return;
    }

    const result =
      message.channel === "email"
        ? await sendMail({
            to: message.to,
            subject: message.subject,
            text: message.text,
          })
        : await sendTelegramMessage(message.to, message.text);

    await saveOutcome(message, result);
  } catch (error) {
    logger.error({ err: error, messageId: message.id }, "Delivery failed");
  }
}

// Sends every pending message that is due. A message that fails stays in the
// outbox and is tried again later.
export async function processOutbox() {
  const due = await OutboxMessage.find({
    status: "pending",
    nextAttemptAt: { $lte: new Date() },
  })
    .sort({ nextAttemptAt: 1 })
    .limit(MAX_PER_ROUND);

  await Promise.all(due.map((message) => deliver(message)));
}
