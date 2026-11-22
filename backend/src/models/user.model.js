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

    // Telegram alerts. The chat id is set when the user presses Start in the bot.
    telegramChatId: { type: String, default: null },
    // A one-time code that proves who is pressing Start. It expires in 10 minutes.
    telegramLinkCode: { type: String, default: null, index: true },
    telegramLinkExpiresAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export const User = mongoose.model("User", userSchema);
