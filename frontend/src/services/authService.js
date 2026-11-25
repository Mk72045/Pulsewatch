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

// Who is logged in? The backend answers 200 with `user: null` when nobody is,
// so a logged-out visitor's session check is not an error in the console.
// It also means "not logged in" and "server unreachable" stay distinguishable.
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

// Sign in without a password. The backend emails a code, answers the same
// way whether or not an account exists, and the code proves the mailbox.
export async function requestLoginCode(email) {
  const response = await api.post("/api/v1/auth/otp/request", { email });
  return response.data.data;
}

export async function loginWithCode({ email, code }) {
  const response = await api.post("/api/v1/auth/otp/login", { email, code });
  return response.data.data.user;
}

// For the delete-account window. Asking for the code needs the session;
// deleting with the code proves the mailbox instead of the password.
export async function requestDeleteCode() {
  const response = await api.post("/api/v1/auth/account/otp/request");
  return response.data.data;
}

export async function deleteAccountWithCode(code) {
  await api.delete("/api/v1/auth/account/otp", { data: { code } });
}

// Google sign-in. `credential` is the signed ID token Google's button hands
// the page. The backend verifies it, creates the account on first use, and
// sets the login cookie. One endpoint serves both the login and register
// pages, so an existing email is never a dead end.
export async function signInWithGoogle(credential) {
  const response = await api.post("/api/v1/auth/google", { credential });
  return response.data.data.user;
}

// Adds or changes the password of the logged-in user. `currentPassword` can
// be omitted for an account created with Google, which has none yet.
export async function updatePassword(data) {
  const response = await api.post("/api/v1/auth/password", data);
  return response.data.data.user;
}
