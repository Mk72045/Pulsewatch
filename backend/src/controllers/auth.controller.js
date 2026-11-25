import {
  deleteAccount as deleteAccountService,
  deleteAccountWithCode as deleteAccountWithCodeService,
  loginUser,
  loginWithCode as loginWithCodeService,
  registerUser,
  setPassword as setPasswordService,
  signInWithGoogle,
  toPublicUser,
} from "../services/auth.service.js";
import { sendActionCode } from "../services/otp.service.js";
import { confirmEmail, resendCode } from "../services/verification.service.js";
import { COOKIE_NAME, cookieOptions, signToken } from "../utils/authToken.js";
import { verifyGoogleCredential } from "../utils/googleAuth.js";

export const register = async (req, res) => {
  const { user, emailSent } = await registerUser(req.body);

  // No cookie: the account exists but is not usable until the email is
  // confirmed. The browser is sent to the verification page instead.
  res.status(201).json({
    success: true,
    message: emailSent
      ? "Account created. Check your email for the 6-digit code"
      : "Account created, but the email could not be sent. Use Resend to try again",
    data: { email: user.email, emailSent },
  });
};

export const login = async (req, res) => {
  const user = await loginUser(req.body);

  res.cookie(COOKIE_NAME, signToken(user.id), cookieOptions);
  res.json({
    success: true,
    message: "Logged in",
    data: { user },
  });
};

// optionalAuth has already put the user on req, or null when nobody is
// logged in. That is a normal answer, so it is a 200 either way.
export const me = (req, res) => {
  res.json({ success: true, data: { user: req.user } });
};

export const logout = (_req, res) => {
  // The cookie is removed only if the options match the ones used to set it.
  res.clearCookie(COOKIE_NAME, cookieOptions);
  res.json({ success: true, message: "Logged out" });
};

// The code from the verification page. A correct code both proves the email
// and logs the user in, so the next click goes straight to the dashboard.
export const verifyEmail = async (req, res) => {
  const user = await confirmEmail(req.body.email, req.body.code);

  res.cookie(COOKIE_NAME, signToken(user.id), cookieOptions);
  res.json({
    success: true,
    message: "Email confirmed",
    data: { user: toPublicUser(user) },
  });
};

export const resendVerification = async (req, res) => {
  await resendCode(req.body.email);

  res.json({
    success: true,
    message: "If that address needs a code, a new one has been sent",
  });
};

// The password is checked again by the service before anything is removed.
// The cookie is cleared as well, so the browser is left logged out.
export const deleteAccount = async (req, res) => {
  await deleteAccountService(req.user.id, req.body.password);

  res.clearCookie(COOKIE_NAME, cookieOptions);
  res.json({ success: true, message: "Account deleted" });
};

// Deletes the logged-in account by proving the email address with a code.
// Used by accounts that have no password, such as ones made with Google.
export const deleteAccountWithCode = async (req, res) => {
  await deleteAccountWithCodeService(req.user.id, req.body.code);

  res.clearCookie(COOKIE_NAME, cookieOptions);
  res.json({ success: true, message: "Account deleted" });
};

// Emails a six-digit code. The body holds an address; the purpose is fixed by
// the route, never by the client. The answer is the same whether or not an
// account exists, so this cannot be used to list registered emails.
export const requestLoginCode = async (req, res) => {
  const result = await sendActionCode(req.body.email, "login");

  res.json({
    success: true,
    message: result.ok
      ? "If that address has an account, a code is on its way"
      : "We could not send the email. Please try again in a minute",
    data: { emailSent: result.ok },
  });
};

// Signs in with a code from the email. No password is needed, so this works
// for Google accounts too, and for anyone who has forgotten their password.
export const loginWithCode = async (req, res) => {
  const { email, code } = req.body;
  const user = await loginWithCodeService(email, code);

  res.cookie(COOKIE_NAME, signToken(user.id), cookieOptions);
  res.json({
    success: true,
    message: "Logged in",
    data: { user },
  });
};

// The same code flow, for the delete-account window. Requires a session, so a
// stranger cannot ask for codes against someone else's address.
export const requestDeleteCode = async (req, res) => {
  const result = await sendActionCode(req.user.email, "delete");

  res.json({
    success: true,
    message: result.ok
      ? "A code is on its way to your email"
      : "We could not send the email. Please try again in a minute",
    data: { emailSent: result.ok },
  });
};

// "Continue with Google", used by both the login and register pages. The ID
// token from Google is checked here; nothing about the account is taken from
// the request body. It creates the account on first use, so one endpoint
// covers both pages and an existing email is never a dead end.
export const signInWithGoogleAccount = async (req, res) => {
  const profile = await verifyGoogleCredential(req.body.credential);
  const { user, created } = await signInWithGoogle(profile);

  res.cookie(COOKIE_NAME, signToken(user.id), cookieOptions);
  res.status(created ? 201 : 200).json({
    success: true,
    message: created ? "Account created with Google" : "Logged in with Google",
    data: { user },
  });
};

// Adds a password to an account that has none, so Google is no longer the
// only way in. For password accounts it also works as a password change.
export const setPassword = async (req, res) => {
  const user = await setPasswordService(req.user.id, req.body);

  res.json({
    success: true,
    message: "Password updated",
    data: { user },
  });
};
