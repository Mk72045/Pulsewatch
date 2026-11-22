import { Router } from "express";
import { getIncidents } from "../controllers/incident.controller.js";
import { requireAuth } from "../middlewares/requireAuth.js";

export const incidentRouter = Router();

incidentRouter.get("/", requireAuth, getIncidents);
