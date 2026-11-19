import { env } from "./env.js";

// Check intervals a user may choose, in minutes.
export const MONITOR_INTERVALS = [1, 5, 10, 30];

// Every monitor is checked on a schedule, so the number per user is capped.
export const MAX_MONITORS_PER_USER = env.MAX_MONITORS_PER_USER;
