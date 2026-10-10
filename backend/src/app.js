import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { notFound } from "./middlewares/notFound.js";
import { rateLimiter } from "./middlewares/rateLimiter.js";
import { requestLogger } from "./middlewares/requestLogger.js";
import { apiRouter } from "./routes/index.js";

// This file builds the app. It does not listen on a port.
// Tests can import `app` without starting a real server.
const app = express();

// Security headers (X-Content-Type-Options, and others) on every response.
app.use(helmet());

// Browsers may call the API only from the frontend origin in CLIENT_URL.
app.use(
  cors({
    origin: env.CLIENT_URL,
  }),
);

// Reject huge JSON bodies early. 16kb is enough for this API.
app.use(express.json({ limit: "16kb" }));

app.use(requestLogger);
app.use(rateLimiter);
app.use("/api/v1", apiRouter);

// 404 and the error handler must be registered last.
app.use(notFound);
app.use(errorHandler);

export { app };
