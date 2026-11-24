import { env } from "../config/env.js";
import { logger } from "../config/logger.js";

export const telegramEnabled = Boolean(
  env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_BOT_USERNAME,
);

// Calls one method of the Telegram Bot API. The token is part of the URL,
// so the URL is never logged.
export async function callTelegram(method, body, signal) {
  const response = await fetch(
    `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/${method}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal,
    },
  );

  const data = await response.json();

  if (!data.ok) {
    const error = new Error(
      `Telegram ${method} failed: ${data.description}`,
    );

    // Telegram specifies how long we should wait before retrying.
    error.retryAfter = data.parameters?.retry_after ?? null;
    error.telegramErrorCode = data.error_code;

    throw error;
  }

  return data.result;
}

// Sends a plain text message. It makes one attempt and never throws. It
// returns { ok, error }. The outbox decides when to try again.
export async function sendTelegramMessage(chatId, text) {
  if (!telegramEnabled) {
    return { ok: false, error: "Telegram is not configured" };
  }

  try {
    await callTelegram(
      "sendMessage",
      { chat_id: chatId, text },
      AbortSignal.timeout(10_000),
    );

    return { ok: true, error: null };
  } catch (error) {
    logger.warn({ err: error }, "Sending Telegram message failed");

    return { ok: false, error: "Telegram request failed" };
  }
}
