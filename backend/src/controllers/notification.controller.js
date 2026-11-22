import {
  createTelegramLink,
  disconnectTelegram,
  sendTelegramTest,
} from "../services/notification.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const startTelegramLink = asyncHandler(async (req, res) => {
  const link = await createTelegramLink(req.user.id);

  res.json({ success: true, data: link });
});

export const testTelegram = asyncHandler(async (req, res) => {
  await sendTelegramTest(req.user.id);

  res.json({ success: true, message: "Test message sent" });
});

export const removeTelegram = asyncHandler(async (req, res) => {
  await disconnectTelegram(req.user.id);

  res.json({ success: true, message: "Telegram disconnected" });
});
