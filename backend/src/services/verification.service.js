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
import { verificationEmail, welcomeEmail } from "../utils/emailTemplates.js";
import { mailEnabled, sendMail } from "./mail.service.js";

// Codes are hashed with the same slow function as passwords, so a copy of the
// database cannot be scanned for codes fast enough to be useful.
const HASH_ROUNDS = 10;

// "042917" - a leading zero is kept, so the code is always OTP_LENGTH digits.
function makeCode() {
  return String(randomInt(0, 10 ** OTP_LENGTH)).padStart(OTP_LENGTH, "0");
}

// Sends the code. It never throws: the caller decides what a failure means.
async function sendCode(user, code) {
  const email = verificationEmail({ name: user.name, code });

  // Without a mail provider there is nothing to send. In development the code
  // is printed instead, so the flow can be tested. In production the caller
  // has already refused to start the signup.
  if (!mailEnabled) {
    logger.warn(
      { email: user.email, code },
      "Mail is not configured, so the verification code is printed instead",
    );
    return { ok: true, error: null };
  }

  return sendMail({
    to: user.email,
    subject: email.subject,
    text: email.text,
    html: email.html,
  });
}

// Makes a new code for a fresh or still-unverified account and emails it.
// Replaces any earlier code, so only the newest email works.
export async function sendVerificationCode(user) {
  if (!mailEnabled && env.NODE_ENV === "production") {
    throw new ApiError(
      503,
      "Signups are temporarily unavailable. Please try again later",
    );
  }

  const code = makeCode();
  const codeHash = await bcrypt.hash(code, HASH_ROUNDS);

  await User.updateOne(
    { _id: user._id },
    {
      $set: {
        verificationCodeHash: codeHash,
        verificationExpiresAt: new Date(
          Date.now() + OTP_EXPIRES_MINUTES * 60_000,
        ),
        verificationAttempts: 0,
        verificationSentAt: new Date(),
      },
    },
  );

  // Write the code down before sending, so a failed mail still leaves a
  // code the user could be helped with.
  const result = await sendCode(user, code);

  if (!result.ok) {
    logger.error(
      { email: user.email, error: result.error },
      "Verification email could not be sent",
    );
  }

  return result;
}

// Checks the code from the page. On success the email is marked verified,
// the code is thrown away and a welcome email is sent (best effort).
// Returns the full user document so the caller can log the user in.
export async function confirmEmail(email, code) {
  // passwordHash is hidden by default. It is selected only so the response
  // that logs this user in can report `hasPassword`; the hash never leaves.
  const user = await User.findOne({ email }).select(
    "+verificationCodeHash +passwordHash",
  );

  // A wrong email and a wrong code look the same, so this cannot be used to
  // find out which addresses have accounts.
  const invalid = new ApiError(400, "That code is not correct");

  if (!user) {
    throw invalid;
  }

  if (user.emailVerified) {
    throw new ApiError(400, "This email is already verified. Please log in");
  }

  if (
    !user.verificationCodeHash ||
    !user.verificationExpiresAt ||
    user.verificationExpiresAt.getTime() < Date.now()
  ) {
    throw new ApiError(
      400,
      "That code has expired. Request a new code and try again",
    );
  }

  if (user.verificationAttempts >= OTP_MAX_ATTEMPTS) {
    throw new ApiError(
      400,
      "Too many incorrect tries. Request a new code and try again",
    );
  }

  const isMatch = await bcrypt.compare(code, user.verificationCodeHash);

  if (!isMatch) {
    // Counted on the server, so the limit holds even across many tabs or IPs.
    await User.updateOne(
      { _id: user._id },
      { $inc: { verificationAttempts: 1 } },
    );

    throw invalid;
  }

  await User.updateOne(
    { _id: user._id },
    {
      $set: { emailVerified: true },
      $unset: {
        verificationCodeHash: "",
        verificationExpiresAt: "",
        verificationSentAt: "",
      },
    },
  );

  user.emailVerified = true;

  // Not awaited: the user should not wait on a courtesy email before they are
  // logged in. sendWelcome never throws on its own, and the catch is there so
  // a failure can never become an unhandled rejection.
  sendWelcome(user).catch((error) => {
    logger.warn({ err: error }, "Welcome email failed");
  });

  return user;
}

// The welcome email is a courtesy, not a step the user must wait for, so a
// failure is only logged.
async function sendWelcome(user) {
  if (!mailEnabled) {
    return;
  }

  const email = welcomeEmail({ name: user.name });
  const result = await sendMail({
    to: user.email,
    subject: email.subject,
    text: email.text,
    html: email.html,
  });

  if (!result.ok) {
    logger.warn(
      { email: user.email, error: result.error },
      "Welcome email could not be sent",
    );
  }
}

// Sends a fresh code after the 60 second cooldown. The answer is the same
// whether or not the address has an unverified account, so this cannot be
// used to list registered emails.
export async function resendCode(email) {
  const user = await User.findOne({ email });

  if (!user || user.emailVerified) {
    return;
  }

  const waited =
    user.verificationSentAt === null
      ? Infinity
      : (Date.now() - user.verificationSentAt.getTime()) / 1000;

  if (waited < OTP_RESEND_SECONDS) {
    const seconds = Math.ceil(OTP_RESEND_SECONDS - waited);

    throw new ApiError(
      429,
      `Please wait ${seconds} second${seconds === 1 ? "" : "s"} before requesting a new code`,
    );
  }

  const result = await sendVerificationCode(user);

  if (!result.ok) {
    throw new ApiError(
      503,
      "We could not send the email. Please try again in a minute",
    );
  }
}
