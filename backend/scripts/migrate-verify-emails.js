import mongoose from "mongoose";
import { connectDB, disconnectDB } from "../src/config/db.js";
import { logger } from "../src/config/logger.js";
import { User } from "../src/models/user.model.js";

// One-time backfill, run once after deploying email verification.
//
// Accounts created before this feature existed have no `emailVerified` field.
// They were already in use, so they are treated as verified instead of being
// locked out. Accounts created after the deploy get the model default (false)
// and are left alone.
//
// The filter is "the field is missing", so running this twice changes nothing.
// Usage: npm run migrate:verify-emails
async function main() {
  await connectDB();

  const result = await User.updateMany(
    { emailVerified: { $exists: false } },
    { $set: { emailVerified: true } },
  );

  logger.info(
    { matched: result.matchedCount, changed: result.modifiedCount },
    "Existing accounts marked as verified",
  );

  await disconnectDB();
}

main()
  .then(() => process.exit(0))
  .catch(async (error) => {
    logger.error({ err: error }, "Migration failed");
    // A failed migration can leave the connection open, so close it before exit.
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  });
