import bcrypt from "bcrypt";
import { env } from "../config/env.js";
import { CheckResult } from "../models/checkResult.model.js";
import { Incident } from "../models/incident.model.js";
import { Monitor } from "../models/monitor.model.js";
import { OutboxMessage } from "../models/outboxMessage.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { mailEnabled } from "./mail.service.js";
import { sendVerificationCode } from "./verification.service.js";

const SALT_ROUNDS = 12;

// Compared against when the email is unknown, so a wrong email takes as long
// as a wrong password and does not reveal which emails are registered.
const fakeHash = bcrypt.hashSync("not-a-real-password", SALT_ROUNDS);

// The only user fields that are allowed to leave the server.
export function toPublicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    emailVerified: Boolean(user.emailVerified),
    telegramConnected: Boolean(user.telegramChatId),
  };
}

// Creates an unverified account and emails a code. No session is started here:
// the user is logged in only after they enter the code (see confirmEmail).
export async function registerUser({ name, email, password }) {
  // Without a mail provider nobody could ever verify, so refuse before
  // creating an account that could not be used.
  if (!mailEnabled && env.NODE_ENV === "production") {
    throw new ApiError(
      503,
      "Signups are temporarily unavailable. Please try again later",
    );
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  let user;

  try {
    user = await User.create({ name, email, passwordHash });
  } catch (error) {
    // 11000 is MongoDB's duplicate key error from the unique email index.
    if (error.code === 11000) {
      throw new ApiError(
        409,
        "An account with this email already exists. Try logging in",
      );
    }

    throw error;
  }

  const sent = await sendVerificationCode(user);

  return { user: toPublicUser(user), emailSent: sent.ok };
}

export async function loginUser({ email, password }) {
  // passwordHash is hidden by default, so it must be asked for here.
  const user = await User.findOne({ email }).select("+passwordHash");

  const isMatch = await bcrypt.compare(
    password,
    user ? user.passwordHash : fakeHash,
  );

  if (!user || !isMatch) {
    throw new ApiError(401, "Invalid email or password");
  }

  // Checked only after the password matches, so an unverified account is not
  // revealed to someone who does not know its password.
  if (!user.emailVerified) {
    throw new ApiError(
      403,
      "Please confirm your email first. Check your inbox for the code",
      undefined,
      "EMAIL_UNVERIFIED",
    );
  }

  return toPublicUser(user);
}

export async function getUserById(id) {
  const user = await User.findById(id);

  return user ? toPublicUser(user) : null;
}

// Permanently removes the account and everything that belongs to it. The
// password is checked again first, so a stolen cookie or a stray click alone
// cannot delete the account. There is no undo.
export async function deleteAccount(userId, password) {
  // passwordHash is hidden by default, so it must be asked for here.
  const user = await User.findById(userId).select("+passwordHash");

  if (!user) {
    throw new ApiError(401, "Please log in");
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);

  if (!isMatch) {
    throw new ApiError(
      401,
      "That password is not correct",
      undefined,
      "WRONG_PASSWORD",
    );
  }

  // The monitor ids are needed to find their history and incidents after the
  // monitors themselves are gone.
  const monitorIds = await Monitor.distinct("_id", { user: user._id });

  await Monitor.deleteMany({ user: user._id });
  await CheckResult.deleteMany({ monitor: { $in: monitorIds } });
  await Incident.deleteMany({ user: user._id });
  await OutboxMessage.deleteMany({ user: user._id });
  await user.deleteOne();
}
