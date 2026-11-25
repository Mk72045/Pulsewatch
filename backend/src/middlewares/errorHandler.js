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
  let statusCode = 500;
  let message = "Internal server error";

  if (isApiError) {
    statusCode = error.statusCode;
    message = error.message;
  } else if (error.type?.startsWith("entity.")) {
    // express.json() errors: broken JSON (400) or body over the size limit (413).
    statusCode = error.status;
    message =
      error.status === 413 ? "Request body too large" : "Invalid JSON body";
  }

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

  if (isApiError && error.code) {
    body.code = error.code;
  }

  // Stack traces help locally. They are hidden in production.
  if (env.NODE_ENV === "development" && error.stack) {
    body.stack = error.stack;
  }

  res.status(statusCode).json(body);
}
