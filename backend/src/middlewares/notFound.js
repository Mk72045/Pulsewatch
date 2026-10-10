import { ApiError } from "../utils/ApiError.js";

// Runs after every route. If nothing else answered, the URL does not exist.
export function notFound(req, res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}
