import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      select: false,
      // Accounts created with Google have no password. Every account has at
      // least one way to sign in, so this is required unless googleId is set.
      required() {
        return !this.googleId;
      },
    },

    // The stable id Google gives this account. Null for password accounts that
    // never used Google. Unique only where it exists, so many accounts can
    // share the null value.
    googleId: { type: String, default: null },

    // False until the user enters the code sent to their email. Login is
    // refused while it is false. Existing accounts are set to true by
    // `npm run migrate:verify-emails`.
    emailVerified: { type: Boolean, default: false },

    // The current verification code, stored hashed so a stolen database dump
    // cannot be used to verify an account. Hidden unless asked for.
    verificationCodeHash: { type: String, default: null, select: false },
    verificationExpiresAt: { type: Date, default: null },
    // Wrong guesses so far. At the limit the code stops working.
    verificationAttempts: { type: Number, default: 0 },
    // When the last code was sent, used to slow down "resend".
    verificationSentAt: { type: Date, default: null },

    // A code that proves the mailbox for something other than signup: logging
    // in without a password, or deleting the account. It is kept apart from
    // the signup fields above, because those are thrown away once the email is
    // verified and cannot be used again. `otpPurpose` records what the code was
    // issued for, so a code sent to delete can never log anyone in.
    otpCodeHash: { type: String, default: null, select: false },
    otpPurpose: {
      type: String,
      enum: ["login", "delete", null],
      default: null,
    },
    otpExpiresAt: { type: Date, default: null },
    otpAttempts: { type: Number, default: 0 },
    otpSentAt: { type: Date, default: null },

    // Telegram alerts. The chat id is set when the user presses Start in the bot.
    telegramChatId: { type: String, default: null },
    // A one-time code that proves who is pressing Start. It expires in 10 minutes.
    telegramLinkCode: { type: String, default: null, index: true },
    telegramLinkExpiresAt: { type: Date, default: null },

    // The random part of the public status page address. It is absent until
    // the user turns the page on, and unset again when they turn it off. It is
    // long and random so the address cannot be guessed, and it exposes only
    // what the status page shows: monitor names, urls and status. Never the
    // email or anything else on this document.
    //
    // No `default: null` on purpose. This index is unique+sparse, and sparse
    // skips only documents that LACK the field. A default would write an
    // explicit null on every account, and the unique index allows just one
    // such value, so the second signup would fail with a duplicate key.
    publicStatusToken: {
      type: String,
      unique: true,
      sparse: true,
    },
  },
  { timestamps: true },
);

// "Which account does this Google user sign in to?" A partial index covers
// only rows where googleId is a real value: password-only accounts store null
// and would otherwise collide with each other.
userSchema.index(
  { googleId: 1 },
  { unique: true, partialFilterExpression: { googleId: { $type: "string" } } },
);

export const User = mongoose.model("User", userSchema);
