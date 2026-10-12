import { Router } from "express";
import { checkRouter } from "./check.routes.js";
import { healthRouter } from "./health.routes.js";

// Every feature router is mounted here, under /api/v1.
export const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/checks", checkRouter);
