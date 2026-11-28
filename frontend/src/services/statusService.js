import api from "./api.js";

// Is the public status page on, and what is its address?
export async function fetchStatusSettings() {
  const response = await api.get("/api/v1/status-settings");
  return response.data.data;
}

// Turn the public status page on or off.
export async function updateStatusSettings(enabled) {
  const response = await api.put("/api/v1/status-settings", { enabled });
  return response.data.data;
}

// The public page itself. Called without a login.
export async function fetchPublicStatus(token) {
  const response = await api.get(`/api/v1/status/${token}`);
  return response.data.data.status;
}
