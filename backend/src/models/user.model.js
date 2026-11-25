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
    passwordHash: { type: String, required: true, select: false },

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

    // Telegram alerts. The chat id is set when the user presses Start in the bot.
    telegramChatId: { type: String, default: null },
    // A one-time code that proves who is pressing Start. It expires in 10 minutes.
    telegramLinkCode: { type: String, default: null, index: true },
    telegramLinkExpiresAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export const User = mongoose.model("User", userSchema);
