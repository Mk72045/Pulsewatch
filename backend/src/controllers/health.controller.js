import { getHealth } from "../services/health.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// The controller only shapes the HTTP response.
// Deciding what "healthy" means lives in the service.
export const getHealthStatus = asyncHandler(async (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    data: getHealth(),
  });
});
