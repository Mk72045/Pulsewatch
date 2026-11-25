import { randomBytes } from "node:crypto";
import { env } from "../config/env.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { sendTelegramMessage, telegramEnabled } from "./telegram.service.js";

const LINK_MINUTES = 10;

// Makes a one-time code for the user and returns the link that carries it.
export async function createTelegramLink(userId) {
  if (!telegramEnabled) {
    throw new ApiError(503, "Telegram alerts are not available right now");
  }

  // A connected account does not need a new link, and a code made here could
  // never be used: the first press connects, the second finds it cleared.
  // Refusing keeps the frontend from offering a link that only says "expired".
  const user = await User.findById(userId).select("telegramChatId");

  if (user?.telegramChatId) {
    throw new ApiError(
      409,
      "Telegram is already connected. Disconnect it first to link another chat",
      undefined,
      "TELEGRAM_ALREADY_CONNECTED",
    );
  }

  const code = randomBytes(16).toString("hex");

  await User.updateOne(
    { _id: userId },
    {
      $set: {
        telegramLinkCode: code,
        telegramLinkExpiresAt: new Date(Date.now() + LINK_MINUTES * 60_000),
      },
    },
  );

  return { url: `https://t.me/${env.TELEGRAM_BOT_USERNAME}?start=${code}` };
}

// Called when someone sends "/start <code>" to the bot. Returns the user, or
// null if the code is wrong, used or expired.
export async function linkTelegramChat(code, chatId) {
  const user = await User.findOne({
    telegramLinkCode: code,
    telegramLinkExpiresAt: { $gt: new Date() },
  });

  if (!user) {
    return null;
  }

  // One Telegram chat belongs to one account.
  await User.updateMany(
    { telegramChatId: chatId },
    { $set: { telegramChatId: null } },
  );

  await User.updateOne(
    { _id: user._id },
    {
      $set: {
        telegramChatId: chatId,
        telegramLinkCode: null,
        telegramLinkExpiresAt: null,
      },
    },
  );

  return user;
}

// The account this chat is already connected to, or null.
//
// The link is single-use: once used, its code is cleared, so pressing the same
// link a second time finds no code. That is normal, and the bot should say
// "already connected" rather than "expired", because nothing is wrong.
export function findUserByTelegramChat(chatId) {
  return User.findOne({ telegramChatId: chatId }).select("name");
}

export async function disconnectTelegram(userId) {
  await User.updateOne({ _id: userId }, { $set: { telegramChatId: null } });
}

export async function sendTelegramTest(userId) {
  const user = await User.findById(userId).select("telegramChatId");

  if (!user?.telegramChatId) {
    throw new ApiError(400, "Telegram is not connected");
  }

  const result = await sendTelegramMessage(
    user.telegramChatId,
    "Pulsewatch test: your alerts will arrive in this chat.",
  );

  if (!result.ok) {
    throw new ApiError(502, "Could not send the Telegram message");
  }
}
