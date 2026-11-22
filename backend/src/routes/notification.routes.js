import { Router } from "express";
import {
  removeTelegram,
  startTelegramLink,
  testTelegram,
} from "../controllers/notification.controller.js";
import { requireAuth } from "../middlewares/requireAuth.js";

export const notificationRouter = Router();

// Every notification route needs a logged-in user.
notificationRouter.use(requireAuth);

notificationRouter.post("/telegram/link", startTelegramLink);
notificationRouter.post("/telegram/test", testTelegram);
notificationRouter.delete("/telegram", removeTelegram);
