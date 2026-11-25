import api from "./api.js";

// One small function per backend endpoint. Pages never call axios directly.

// Registering does NOT log the user in: the backend answers with the address
// a code was sent to, and the browser goes to the verification page.
export async function registerUser(data) {
  const response = await api.post("/api/v1/auth/register", data);
  return response.data.data;
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

// A correct code both confirms the email and logs the user in.
export async function verifyEmail({ email, code }) {
  const response = await api.post("/api/v1/auth/verify-email", { email, code });
  return response.data.data.user;
}

export async function resendVerification(email) {
  await api.post("/api/v1/auth/resend-verification", { email });
}

// Deletes the account and everything that belongs to it. The password is
// asked for again by the backend, which also clears the login cookie.
export async function deleteAccount(password) {
  await api.delete("/api/v1/auth/account", { data: { password } });
}
