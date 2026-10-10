import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { ApiError } from "../utils/ApiError.js";

// Last middleware. Four arguments are required or Express will not treat
// this function as an error handler.
export function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    next(error);
    return;
  }

  const isApiError = error instanceof ApiError;
  const statusCode = isApiError ? error.statusCode : 500;
  const message = isApiError ? error.message : "Internal server error";

  if (statusCode >= 500) {
    logger.error({ err: error }, "Request failed");
  }

  const body = {
    success: false,
    message,
  };

  if (isApiError && error.details) {
    body.details = error.details;
  }

  // Stack traces help locally. They are hidden in production.
  if (env.NODE_ENV === "development" && error.stack) {
    body.stack = error.stack;
  }

  res.status(statusCode).json(body);
}
