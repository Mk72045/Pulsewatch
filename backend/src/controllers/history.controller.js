import {
  getMonitorHistory,
  getMonitorsSummary,
} from "../services/history.service.js";
import {
  DEFAULT_HISTORY_RANGE,
  HISTORY_RANGES,
} from "../config/constants.js";
import { ApiError } from "../utils/ApiError.js";

// GET /monitors/summary
// Uptime of every monitor over the last day, for the cards on the dashboard.
export const getSummary = async (req, res) => {
  const summary = await getMonitorsSummary(req.user.id);

  res.json({ success: true, data: { summary } });
};

// GET /monitors/:id/history?range=24h
// The response-time line and uptime of one monitor over the chosen window.
export const getHistory = async (req, res) => {
  const range = req.query.range ?? DEFAULT_HISTORY_RANGE;

  // An unknown range is a client mistake, so it is a 400 and not a silent default.
  if (!Object.hasOwn(HISTORY_RANGES, range)) {
    throw new ApiError(400, "Unknown range", [
      {
        field: "range",
        message: `Use one of: ${Object.keys(HISTORY_RANGES).join(", ")}`,
      },
    ]);
  }

  const history = await getMonitorHistory(req.user.id, req.params.id, range);

  res.json({ success: true, data: { history } });
};
