import {
  deleteAccount as deleteAccountService,
  loginUser,
  registerUser,
  toPublicUser,
} from "../services/auth.service.js";
import { confirmEmail, resendCode } from "../services/verification.service.js";
import { COOKIE_NAME, cookieOptions, signToken } from "../utils/authToken.js";

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

// requireAuth has already put the user on req.
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
