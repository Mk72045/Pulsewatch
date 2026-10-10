import { logger } from "../config/logger.js";

// Logs after the response finishes so the status code is known.
export function requestLogger(req, res, next) {
  const startedAt = Date.now();

  res.on("finish", () => {
    logger.info(
      {
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        durationMs: Date.now() - startedAt,
      },
      "request completed",
    );
  });

  next();
}
