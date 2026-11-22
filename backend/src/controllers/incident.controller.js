import { listIncidents } from "../services/incident.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getIncidents = asyncHandler(async (req, res) => {
  const incidents = await listIncidents(req.user.id);

  res.json({ success: true, data: { incidents } });
});
