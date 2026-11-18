import { z } from "zod";
import { MONITOR_INTERVALS } from "../config/constants.js";
import { isPrivateHost, parseHttpUrl } from "../utils/urlSafety.js";

const name = z
  .string()
  .trim()
  .min(1, "Name is required")
  .max(60, "Name cannot exceed 60 characters");

const url = z
  .string()
  .trim()
  .max(2048, "URL cannot exceed 2048 characters")
  .refine(
    (value) => parseHttpUrl(value) !== null,
    "Enter a valid URL that starts with http:// or https://",
  )
  .refine((value) => {
    const parsed = parseHttpUrl(value);

    // An invalid URL is already reported by the check above.
    return parsed === null || !isPrivateHost(parsed.hostname);
  }, "This address is not allowed");

const intervalMinutes = z
  .number()
  .refine(
    (value) => MONITOR_INTERVALS.includes(value),
    `Interval must be one of: ${MONITOR_INTERVALS.join(", ")} minutes`,
  );

const isActive = z.boolean();

export const createMonitorSchema = z.object({
  name,
  url,
  intervalMinutes: intervalMinutes.default(5),
});

// PATCH: every field is optional, but each one that is sent is still checked.
export const updateMonitorSchema = z
  .object({ name, url, intervalMinutes, isActive })
  .partial();
