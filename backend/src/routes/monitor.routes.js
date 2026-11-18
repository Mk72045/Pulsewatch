import { Router } from "express";
import {
  addMonitor,
  editMonitor,
  getMonitor,
  getMonitors,
  removeMonitor,
} from "../controllers/monitor.controller.js";
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
monitorRouter.get("/:id", asyncHandler(getMonitor));
monitorRouter.patch(
  "/:id",
  validate(updateMonitorSchema),
  asyncHandler(editMonitor),
);
monitorRouter.delete("/:id", asyncHandler(removeMonitor));
