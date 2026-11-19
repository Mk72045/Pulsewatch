import api from "./api.js";

// One small function per backend endpoint, like authService.
export async function fetchMonitors() {
  const response = await api.get("/api/v1/monitors");
  return response.data.data.monitors;
}

export async function fetchMonitor(id) {
  const response = await api.get(`/api/v1/monitors/${id}`);
  return response.data.data.monitor;
}

export async function createMonitor(values) {
  const response = await api.post("/api/v1/monitors", values);
  return response.data.data.monitor;
}

export async function updateMonitor(id, changes) {
  const response = await api.patch(`/api/v1/monitors/${id}`, changes);
  return response.data.data.monitor;
}

export async function deleteMonitor(id) {
  await api.delete(`/api/v1/monitors/${id}`);
}
