import { env } from "../config/env.js";

// "22 Nov 2026, 9:25 pm IST". The server keeps times in UTC, so messages use one
// configured time zone, and the zone is part of the text so nobody has to guess.
export function formatAlertTime(date) {
  return date.toLocaleString("en-IN", {
    timeZone: env.ALERT_TIME_ZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}
