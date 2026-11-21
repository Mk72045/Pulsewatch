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
