import { Router } from "express";
import { createTestCheck } from "../controllers/check.controller.js";

export const checkRouter = Router();

checkRouter.post("/test", createTestCheck);
