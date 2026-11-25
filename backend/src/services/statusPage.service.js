import { randomBytes } from "node:crypto";
import { Monitor } from "../models/monitor.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";

// 24 random bytes make an address nobody can guess by trying names.
const TOKEN_BYTES = 24;

const tokenPattern = /^[a-f\d]{48}$/;

// What the public page is allowed to know about a user, and nothing more.
const PUBLIC_USER_FIELDS = "name";

// Turns the public status page on and returns the address, or turns it off.
// Turning it on again reuses the same token, so a link a user already shared
// starts working again instead of silently 404ing.
export async function setPublicStatus(userId, enabled) {
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(401, "Not signed in");
  }

  if (enabled && !user.publicStatusToken) {
    user.publicStatusToken = randomBytes(TOKEN_BYTES).toString("hex");
  }

  if (!enabled) {
    // Removed, not set to null. The field is unique+sparse, and a stored null
    // would count as a value: the second account turned off would collide.
    user.publicStatusToken = undefined;
  }

  await user.save();

  return {
    enabled: Boolean(user.publicStatusToken),
    token: user.publicStatusToken,
  };
}

// The public snapshot behind /status/:token. No login, so it must reveal
// nothing private: no monitor error text, no email, no response times of a
// paused monitor. A bad token is a 404, which gives nothing away.
export async function getPublicStatus(token) {
  if (!tokenPattern.test(token)) {
    throw new ApiError(404, "Status page not found");
  }

  const user = await User.findOne({ publicStatusToken: token }).select(
    PUBLIC_USER_FIELDS,
  );

  if (!user) {
    throw new ApiError(404, "Status page not found");
  }

  const monitors = await Monitor.find({ user: user._id, isActive: true })
    .select("name url status lastCheckedAt consecutiveFailures")
    .sort({ name: 1 })
    .lean();

  // One line for the top of the page: all up, or how many are not.
  const down = monitors.filter((monitor) => monitor.status === "down").length;

  return {
    owner: user.name,
    overall: monitors.length === 0 ? "empty" : down > 0 ? "down" : "up",
    monitorCount: monitors.length,
    downCount: down,
    monitors: monitors.map((monitor) => ({
      name: monitor.name,
      url: monitor.url,
      // "pending" is shown as is, so a brand new monitor is not called up.
      status: monitor.status,
      lastCheckedAt: monitor.lastCheckedAt,
    })),
  };
}
