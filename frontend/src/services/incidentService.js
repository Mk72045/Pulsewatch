import api from "./api.js";

export async function fetchIncidents() {
  const response = await api.get("/api/v1/incidents");
  return response.data.data.incidents;
}
