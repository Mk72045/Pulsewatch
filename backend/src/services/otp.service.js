import { randomInt } from "node:crypto";
import bcrypt from "bcrypt";
import {
  OTP_EXPIRES_MINUTES,
  OTP_LENGTH,
  OTP_MAX_ATTEMPTS,
  OTP_RESEND_SECONDS,
} from "../config/constants.js";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { actionCodeEmail } from "../utils/emailTemplates.js";
import { mailEnabled, sendMail } from "./mail.service.js";

// Same slow hash as passwords, so a copy of the database cannot be scanned
// for codes. Kept equal to the signup codes in verification.service.js.
const HASH_ROUNDS = 10;

// A code proves the mailbox for one of these two jobs. Anything else is
// refused, so a code can never be used for a job it was not issued for.
const PURPOSES = ["login", "delete"];

function makeCode() {
  return String(randomInt(0, 10 ** OTP_LENGTH)).padStart(OTP_LENGTH, "0");
}

export function isOtpPurpose(value) {
  return PURPOSES.includes(value);
}

// Emails are handled case-insensitively everywhere else, so the lookup is too.
function normaliseEmail(email) {
  return String(email ?? "")
    .trim()
    .toLowerCase();
}

// Sends a code for `purpose` to the address that belongs to the account.
//
// It answers the same way whether or not an account exists, so this cannot be
// used to find out which addresses are registered. `ok` is false only when an
// email could not be sent.
export async function sendActionCode(email, purpose) {
  if (!mailEnabled) {
    // Without a provider there is nothing to send. In development the code is
    // printed so the flow can still be tried; in production the caller is told
    // it failed rather than pretending an email went out.
    if (env.NODE_ENV !== "production") {
      logger.warn("Mail is not configured, so no action code was sent");
    }

    return { ok: false, error: "Email is not configured" };
  }

  const user = await User.findOne({ email: normaliseEmail(email) });

  if (!user) {
    // Nothing to send, but the caller must not learn that.
    return { ok: true, error: null };
  }

  const waited =
    user.otpSentAt === null
      ? Infinity
      : (Date.now() - user.otpSentAt.getTime()) / 1000;

  if (waited < OTP_RESEND_SECONDS) {
    const seconds = Math.ceil(OTP_RESEND_SECONDS - waited);

    throw new ApiError(
      429,
      `Please wait ${seconds} second${seconds === 1 ? "" : "s"} before requesting a new code`,
    );
  }

  const code = makeCode();
  const codeHash = await bcrypt.hash(code, HASH_ROUNDS);

  await User.updateOne(
    { _id: user._id },
    {
      $set: {
        otpCodeHash: codeHash,
        otpPurpose: purpose,
        otpExpiresAt: new Date(Date.now() + OTP_EXPIRES_MINUTES * 60_000),
        otpAttempts: 0,
        otpSentAt: new Date(),
      },
    },
  );

  const email_ = actionCodeEmail({ name: user.name, code, purpose });

  const result = await sendMail({
    to: user.email,
    subject: email_.subject,
    text: email_.text,
    html: email_.html,
  });

  if (!result.ok) {
    logger.error(
      { email: user.email, error: result.error },
      "Action code email could not be sent",
    );
  }

  return result;
}

// Checks a code for `purpose` and, when it matches, clears it so it cannot be
// used twice. The caller decides what the proof unlocks.
//
// Throws ApiError on anything wrong, so a wrong code never falls through.
export async function verifyActionCode(email, code, purpose) {
  const user = await User.findOne({ email: normaliseEmail(email) }).select(
    "+otpCodeHash",
  );

  // A wrong email and a wrong code look the same, so this cannot be used to
  // find out which addresses have accounts.
  const invalid = new ApiError(
    400,
    "That code is not correct",
    undefined,
    "OTP_INVALID",
  );

  if (!user) {
    throw invalid;
  }

  if (
    !user.otpCodeHash ||
    !user.otpExpiresAt ||
    user.otpExpiresAt.getTime() < Date.now()
  ) {
    throw new ApiError(
      400,
      "That code has expired. Request a new one and try again",
      undefined,
      "OTP_EXPIRED",
    );
  }

  if (user.otpPurpose !== purpose) {
    throw new ApiError(
      400,
      `That code was not issued for this. Request a new one`,
      undefined,
      "OTP_WRONG_PURPOSE",
    );
  }

  if (user.otpAttempts >= OTP_MAX_ATTEMPTS) {
    throw new ApiError(
      400,
      "Too many incorrect tries. Request a new code and try again",
      undefined,
      "OTP_TOO_MANY_ATTEMPTS",
    );
  }

  const isMatch = await bcrypt.compare(code, user.otpCodeHash);

  if (!isMatch) {
    // Counted on the server, so the limit holds across tabs and IPs.
    await User.updateOne({ _id: user._id }, { $inc: { otpAttempts: 1 } });

    throw invalid;
  }

  // Single use: clear the code the moment it is proven.
  await User.updateOne(
    { _id: user._id },
    {
      $unset: { otpCodeHash: "", otpExpiresAt: "", otpSentAt: "" },
      $set: { otpPurpose: null, otpAttempts: 0 },
    },
  );

  return user;
}
