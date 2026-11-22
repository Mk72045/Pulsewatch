import { logger } from "../config/logger.js";
import { linkTelegramChat } from "./notification.service.js";
import {
  callTelegram,
  sendTelegramMessage,
  telegramEnabled,
} from "./telegram.service.js";
import { listOpenIncidents } from "./incident.service.js";

let running = false;
let controller = null;
let loop = null;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Reads one message sent to the bot. Only "/start <code>" does something.
async function handleUpdate(update) {
  const message = update.message;

  // Only text sent in a private chat is handled.
  if (!message?.text || message.chat.type !== "private") {
    return;
  }

  const chatId = String(message.chat.id);
  const [command, code] = message.text.trim().split(/\s+/);

  if (command !== "/start" || !code) {
    await sendTelegramMessage(
      chatId,
      "I only send Pulsewatch alerts. Open Settings in Pulsewatch and press Connect Telegram to link this chat.",
    );
    return;
  }

  const user = await linkTelegramChat(code, chatId);

  if (!user) {
    await sendTelegramMessage(
      chatId,
      "This link is wrong or has expired. Press Connect Telegram in Pulsewatch again.",
    );
    return;
  }

  await sendTelegramMessage(
    chatId,
    `Connected. Alerts for the account of ${user.name} will arrive here.`,
  );

  // Alerts sent before Telegram was connected never reached this chat, so
  // tell the user about outages that are still going on.
  const open = await listOpenIncidents(user._id);

  if (open.length > 0) {
    const lines = open.map(
      (incident) =>
        `${incident.monitor?.name ?? "Deleted monitor"}: ${incident.error ?? "down"}`,
    );

    await sendTelegramMessage(
      chatId,
      `Still down right now:\n${lines.join("\n")}`,
    );
  }
}

async function poll() {
  // Telegram remembers what we have already read, if we tell it the next number.
  let offset = 0;

  while (running) {
    try {
      controller = new AbortController();

      // Long polling: Telegram holds this request open for up to 25 seconds
      // and answers the moment a message arrives.
      const updates = await callTelegram(
        "getUpdates",
        { offset, timeout: 25, allowed_updates: ["message"] },
        controller.signal,
      );

      for (const update of updates) {
        offset = update.update_id + 1;
        await handleUpdate(update);
      }
    } catch (error) {
      if (!running) {
        break;
      }

      logger.warn(
        { err: error },
        "Telegram polling failed, trying again in 5s",
      );
      await wait(5000);
    }
  }
}

export function startTelegramPolling() {
  if (!telegramEnabled) {
    logger.info("Telegram is not configured, so Telegram alerts are off");
    return;
  }

  running = true;
  loop = poll();
  logger.info("Telegram polling started");
}

export async function stopTelegramPolling() {
  running = false;
  // Cancels the request that is waiting, so shutdown does not wait 25 seconds.
  controller?.abort();
  await loop;
}
