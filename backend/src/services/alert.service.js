import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { User } from "../models/user.model.js";
import { formatAlertTime } from "../utils/formatDate.js";
import { mailEnabled } from "./mail.service.js";
import { processOutbox, queueMessages } from "./outbox.service.js";
import { telegramEnabled } from "./telegram.service.js";

// A monitor name typed by a user could hold line breaks, so flatten it.
const oneLine = (text) => text.replace(/\s+/g, " ");

async function recipientOf(userId) {
  const user = await User.findById(userId).select("email telegramChatId");

  return user
    ? { email: user.email, telegramChatId: user.telegramChatId }
    : null;
}

// Puts the alert in the outbox, one message for every channel the user has,
// and then sends what is due. A channel that fails keeps its message in the
// outbox, and it is sent again later.
async function notify(monitor, { subject, text, short }) {
  const recipient = await recipientOf(monitor.user);

  if (!recipient) {
    return;
  }

  const messages = [];

  if (mailEnabled) {
    messages.push({
      user: monitor.user,
      channel: "email",
      to: recipient.email,
      subject,
      text,
    });
  } else {
    logger.warn({ subject }, "Email is not configured, so no email was queued");
  }

  if (telegramEnabled && recipient.telegramChatId) {
    messages.push({
      user: monitor.user,
      channel: "telegram",
      to: recipient.telegramChatId,
      text: short,
    });
  }

  if (messages.length === 0) {
    return;
  }

  await queueMessages(messages);
  await processOutbox();
}

export async function sendDownAlert(monitor, incident) {
  const dashboard = `${env.CLIENT_URL}/dashboard`;

  await notify(monitor, {
    subject: `[Pulsewatch] ${oneLine(monitor.name)} is DOWN`,
    text: [
      `Your monitor "${monitor.name}" is down.`,
      "",
      `URL: ${monitor.url}`,
      `Problem: ${incident.error}`,
      `Since: ${formatAlertTime(incident.startedAt)}`,
      "",
      `Dashboard: ${dashboard}`,
    ].join("\n"),
    short: `[DOWN] ${oneLine(monitor.name)}\n${monitor.url}\nProblem: ${incident.error}\n${dashboard}`,
  });
}

export async function sendRecoveredAlert(monitor, incident) {
  const dashboard = `${env.CLIENT_URL}/dashboard`;
  const minutes = Math.max(
    1,
    Math.round((incident.resolvedAt - incident.startedAt) / 60_000),
  );
  const downFor = `${minutes} ${minutes === 1 ? "minute" : "minutes"}`;

  await notify(monitor, {
    subject: `[Pulsewatch] ${oneLine(monitor.name)} is back UP`,
    text: [
      `Your monitor "${monitor.name}" is back up.`,
      "",
      `URL: ${monitor.url}`,
      `Back up at: ${formatAlertTime(incident.resolvedAt)}`,
      `It was down for about ${downFor}.`,
      "",
      `Dashboard: ${dashboard}`,
    ].join("\n"),
    short: `[UP] ${oneLine(monitor.name)} is back up after about ${downFor}.\n${dashboard}`,
  });
}
