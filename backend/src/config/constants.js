import { env } from "./env.js";

// Check intervals a user may choose, in minutes.
export const MONITOR_INTERVALS = [1, 5, 10, 30];

// Every monitor is checked on a schedule, so the number per user is capped.
export const MAX_MONITORS_PER_USER = env.MAX_MONITORS_PER_USER;

// How many days of check results are kept. MongoDB deletes older ones itself.
export const CHECK_HISTORY_DAYS = 7;

// The scheduler runs at most this many checks at the same time...
export const CHECKS_AT_ONCE = 10;

// ...and takes at most this many due monitors in one round.
export const MAX_CHECKS_PER_TICK = 50;

// A monitor is called down only after this many failed checks in a row.
export const FAILURES_BEFORE_DOWN = 2;

// A failure that is not confirmed yet is checked again after this many seconds.
export const RETRY_DELAY_SECONDS = 60;

// A message that could not be sent is tried again for this many hours.
export const OUTBOX_GIVE_UP_HOURS = 24;

// Sent or given-up messages are kept this many days. MongoDB then deletes them.
export const OUTBOX_KEEP_DAYS = 7;

// Email verification. The user types this many digits from the email.
export const OTP_LENGTH = 6;

// A code stops working this many minutes after it was sent.
export const OTP_EXPIRES_MINUTES = 10;

// A new code can be requested only after this many seconds.
export const OTP_RESEND_SECONDS = 60;

// Wrong guesses allowed for one code before a new one must be requested.
export const OTP_MAX_ATTEMPTS = 5;
