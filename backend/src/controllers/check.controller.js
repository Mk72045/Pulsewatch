import { addTestCheckJob } from "../services/check.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Temporary route so we can see the API and the worker talk through Redis.
export const createTestCheck = asyncHandler(async (_req, res) => {
  const result = await addTestCheckJob();

  res.status(202).json({
    success: true,
    message: "Test job added",
    data: result,
  });
});
