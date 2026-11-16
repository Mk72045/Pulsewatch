import { loginUser, registerUser } from "../services/auth.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { COOKIE_NAME, cookieOptions, signToken } from "../utils/authToken.js";

export const register = asyncHandler(async (req, res) => {
  const user = await registerUser(req.body);

  res.cookie(COOKIE_NAME, signToken(user.id), cookieOptions);
  res.status(201).json({
    success: true,
    message: "Account created",
    data: { user },
  });
});

export const login = asyncHandler(async (req, res) => {
  const user = await loginUser(req.body);

  res.cookie(COOKIE_NAME, signToken(user.id), cookieOptions);
  res.json({
    success: true,
    message: "Logged in",
    data: { user },
  });
});

// requireAuth has already put the user on req.
export const me = (req, res) => {
  res.json({ success: true, data: { user: req.user } });
};

export const logout = (_req, res) => {
  // The cookie is removed only if the options match the ones used to set it.
  res.clearCookie(COOKIE_NAME, cookieOptions);
  res.json({ success: true, message: "Logged out" });
};
