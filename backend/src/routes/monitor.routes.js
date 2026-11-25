import { Router } from "express";
import {
  addMonitor,
  editMonitor,
  getMonitor,
  getMonitors,
  removeMonitor,
} from "../controllers/monitor.controller.js";
import {
  getHistory,
  getSummary,
} from "../controllers/history.controller.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import { validate } from "../middlewares/validate.js";
import {
  createMonitorSchema,
  updateMonitorSchema,
} from "../validators/monitor.validator.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const monitorRouter = Router();

// Every monitor route needs a logged-in user.
monitorRouter.use(requireAuth);

monitorRouter.get("/", asyncHandler(getMonitors));
monitorRouter.post(
  "/",
  validate(createMonitorSchema),
  asyncHandler(addMonitor),
);

// These two must stay above "/:id". Express matches in order, so a later
// "/summary" would be read as a monitor whose id is the word "summary".
monitorRouter.get("/summary", asyncHandler(getSummary));
monitorRouter.get("/:id/history", asyncHandler(getHistory));

monitorRouter.get("/:id", asyncHandler(getMonitor));
monitorRouter.patch(
  "/:id",
  validate(updateMonitorSchema),
  asyncHandler(editMonitor),
);
monitorRouter.delete("/:id", asyncHandler(removeMonitor));
