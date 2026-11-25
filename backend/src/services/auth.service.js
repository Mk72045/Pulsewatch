import bcrypt from "bcrypt";
import { env } from "../config/env.js";
import { CheckResult } from "../models/checkResult.model.js";
import { Incident } from "../models/incident.model.js";
import { Monitor } from "../models/monitor.model.js";
import { OutboxMessage } from "../models/outboxMessage.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { mailEnabled } from "./mail.service.js";
import { verifyActionCode } from "./otp.service.js";
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
    // Google-only accounts may add a password, since they have none.
    hasPassword: Boolean(user.passwordHash),
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
    // 11000 is MongoDB's duplicate key error. It comes from the unique email
    // index (a real "already registered"), but also from any other unique
    // index on the collection. Only the email case may be reported as such:
    // for anything else the message would be wrong and hide a real bug.
    if (error.code === 11000) {
      const isEmail = String(error.keyPattern?.email);
      const field = isEmail ? "email" : Object.keys(error.keyPattern ?? {})[0];

      throw new ApiError(
        409,
        isEmail
          ? "An account with this email already exists. Try logging in"
          : `Could not create the account (${field}). Please try again`,
        undefined,
        isEmail ? "EMAIL_TAKEN" : "ACCOUNT_CREATE_FAILED",
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

  // Google accounts here have no password to compare. Treating them like a
  // wrong password keeps timing flat and tells the visitor nothing.
  const isMatch = await bcrypt.compare(
    password,
    user?.passwordHash ?? fakeHash,
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
  // passwordHash is hidden by default. It is selected here only so
  // toPublicUser can report `hasPassword`; the hash itself never leaves.
  const user = await User.findById(id).select("+passwordHash");

  return user ? toPublicUser(user) : null;
}

// Logs in with a code emailed to the address, no password needed. Works for
// every account, whether it was made with Google or with a password, so it is
// also the way back in for someone who has forgotten their password.
export async function loginWithCode(email, code) {
  const user = await verifyActionCode(email, code, "login");

  // A code proves the mailbox, so an account that was somehow still
  // unverified becomes usable rather than getting stuck.
  if (!user.emailVerified) {
    await User.updateOne({ _id: user._id }, { $set: { emailVerified: true } });
  }

  return toPublicUser(user);
}

// Signs in with a checked Google token. There is one operation, not a
// separate "register" and "login": find the account by Google id, otherwise
// by email and attach Google to it, otherwise create it. The caller only
// needs to know whether the account is new.
//
// Auto-attaching by email is safe because both addresses are proven: Google
// verified this one, and a password account here already passed its email
// code. Refusing instead would leave a user staring at "account exists".
export async function signInWithGoogle(profile) {
  const existing = await findGoogleAccount(profile);

  if (existing) {
    return { user: toPublicUser(existing), created: false };
  }

  try {
    const user = await User.create({
      name: profile.name,
      email: profile.email,
      googleId: profile.googleId,
      emailVerified: true,
    });

    return { user: toPublicUser(user), created: true };
  } catch (error) {
    // A duplicate email or googleId means a second request created the same
    // account in the moment between the lookup and here. Reading it again
    // turns that race into a normal sign-in instead of an error.
    if (error.code === 11000) {
      const user = await findGoogleAccount(profile);

      if (user) {
        return { user: toPublicUser(user), created: false };
      }

      // No account to sign in to, so this duplicate came from an index that
      // has nothing to do with signing in. Say what it was instead of a 500.
      const field = Object.keys(error.keyPattern ?? {})[0] ?? "unknown";

      throw new ApiError(
        409,
        `Could not create the account (${field}). Please try again`,
        undefined,
        "ACCOUNT_CREATE_FAILED",
      );
    }

    throw error;
  }
}

// The account this Google identity belongs to, by Google id or by email. On
// an email match the Google id is attached, so future sign-ins find it
// directly. Returns null when there is no account yet.
async function findGoogleAccount(profile) {
  // passwordHash is selected so the response can report `hasPassword`.
  const byGoogleId = await User.findOne({ googleId: profile.googleId }).select(
    "+passwordHash",
  );

  if (byGoogleId) {
    return byGoogleId;
  }

  const byEmail = await User.findOne({ email: profile.email }).select(
    "+passwordHash",
  );

  if (!byEmail) {
    return null;
  }

  byEmail.googleId = profile.googleId;
  // Signing in with Google proves the address too, so an account that was
  // somehow still unverified becomes usable rather than getting stuck.
  byEmail.emailVerified = true;
  await byEmail.save();

  return byEmail;
}

// Adds a password to an account that was created with Google, so the person
// can also log in without Google. The current password is optional because a
// Google-only account has none to confirm.
export async function setPassword(userId, { currentPassword, newPassword }) {
  const user = await User.findById(userId).select("+passwordHash");

  if (!user) {
    throw new ApiError(401, "Please log in");
  }

  if (user.passwordHash) {
    const isMatch = await bcrypt.compare(
      currentPassword ?? "",
      user.passwordHash,
    );

    if (!isMatch) {
      throw new ApiError(
        401,
        "That password is not correct",
        undefined,
        "WRONG_PASSWORD",
      );
    }
  }

  user.passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await user.save();

  return toPublicUser(user);
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

  // A Google-only account has no password to confirm. The caller should have
  // sent a code to the email instead (see deleteAccountWithCode).
  if (!user.passwordHash) {
    throw new ApiError(
      400,
      "This account has no password. Confirm with a code sent to your email instead",
      undefined,
      "NO_PASSWORD",
    );
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

  await removeAccountData(user);
}

// Permanently removes the account after a code emailed to its address was
// proven. This is the way in for accounts without a password, such as ones
// created with Google. There is no undo.
export async function deleteAccountWithCode(userId, code) {
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(401, "Please log in");
  }

  // A wrong account and a wrong code look the same, so this reveals nothing.
  await verifyActionCode(user.email, code, "delete");

  await removeAccountData(user);
}

// Everything a deleted account owns. Shared by the two proofs above, so the
// two paths can never drift apart. The monitor ids are read first because
// their history has no user field of its own.
async function removeAccountData(user) {
  const monitorIds = await Monitor.distinct("_id", { user: user._id });

  await Monitor.deleteMany({ user: user._id });
  await CheckResult.deleteMany({ monitor: { $in: monitorIds } });
  await Incident.deleteMany({ user: user._id });
  await OutboxMessage.deleteMany({ user: user._id });
  await user.deleteOne();
}
