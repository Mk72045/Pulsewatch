import { Router } from "express";

import { healthRouter } from "./health.routes.js";
import { authRouter } from "./auth.routes.js";
import { monitorRouter } from "./monitor.routes.js";

// Every feature router is mounted here, under /api/v1.
export const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/monitors", monitorRouter);
