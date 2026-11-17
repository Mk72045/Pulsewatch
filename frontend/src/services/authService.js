import api from "./api.js";

// One small function per backend endpoint. Pages never call axios directly.
export async function registerUser(data) {
  const response = await api.post("/api/v1/auth/register", data);
  return response.data.data.user;
}

export async function loginUser(data) {
  const response = await api.post("/api/v1/auth/login", data);
  return response.data.data.user;
}

export async function logoutUser() {
  await api.post("/api/v1/auth/logout");
}

export async function fetchCurrentUser() {
  const response = await api.get("/api/v1/auth/me");
  return response.data.data.user;
}
