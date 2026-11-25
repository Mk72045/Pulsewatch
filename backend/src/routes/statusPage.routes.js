import { Router } from "express";
import {
  getStatusPage,
  getStatusSettings,
  updateStatusSettings,
} from "../controllers/statusPage.controller.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Two routers on the same router file, because the public page and the
// settings are mounted at different addresses with different protection.
export const publicStatusRouter = Router();
export const statusSettingsRouter = Router();

// No requireAuth: this is the address the user shares with anyone.
publicStatusRouter.get("/:token", asyncHandler(getStatusPage));

// The settings are private to the owner.
statusSettingsRouter.use(requireAuth);
statusSettingsRouter.get("/", asyncHandler(getStatusSettings));
statusSettingsRouter.put("/", ...updateStatusSettings);