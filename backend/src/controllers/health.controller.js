import { getHealth } from "../services/health.service.js";

// The controller only shapes the HTTP response.
// Deciding what "healthy" means lives in the service.
export const getHealthStatus = async (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    data: getHealth(),
  });
};
