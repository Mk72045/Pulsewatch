import api from "./api.js";

// Uptime and average response time of every monitor, last 24 hours.
export async function fetchMonitorsSummary() {
  const response = await api.get("/api/v1/monitors/summary");
  return response.data.data.summary;
}

// The response-time line and uptime of one monitor. range is "6h", "24h" or "7d".
export async function fetchMonitorHistory(id, range) {
  const response = await api.get(`/api/v1/monitors/${id}/history`, {
    params: { range },
  });
  return response.data.data.history;
}
