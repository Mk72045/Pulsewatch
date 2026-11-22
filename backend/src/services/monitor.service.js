import { MAX_MONITORS_PER_USER } from "../config/constants.js";
import { Monitor } from "../models/monitor.model.js";
import { ApiError } from "../utils/ApiError.js";
import { CheckResult } from "../models/checkResult.model.js";
import { deleteIncidents, endOpenIncidents } from "./incident.service.js";

const objectIdPattern = /^[a-f\d]{24}$/i;

// The check data of a monitor that has not been checked yet.
const freshCheckState = () => ({
  status: "pending",
  consecutiveFailures: 0,
  lastCheckedAt: null,
  lastResponseTimeMs: null,
  lastStatusCode: null,
  lastError: null,
  nextCheckAt: new Date(),
});

// The one way to load a single monitor. It always filters by owner, so a user
// can never reach someone else's monitor, even with the right id.
export async function findOwnedMonitor(userId, id) {
  // A malformed id cannot match anything, so it is a 404 and not a database error.
  if (!objectIdPattern.test(id)) {
    throw new ApiError(404, "Monitor not found");
  }

  const monitor = await Monitor.findOne({ _id: id, user: userId });

  if (!monitor) {
    throw new ApiError(404, "Monitor not found");
  }

  return monitor;
}

export async function listMonitors(userId) {
  return Monitor.find({ user: userId }).sort({ createdAt: -1 });
}

export async function createMonitor(userId, data) {
  const count = await Monitor.countDocuments({ user: userId });

  if (count >= MAX_MONITORS_PER_USER) {
    throw new ApiError(
      403,
      `You can add up to ${MAX_MONITORS_PER_USER} monitors`,
    );
  }

  try {
    // `user` comes last so that nothing in `data` can override the owner.
    return await Monitor.create({ ...data, user: userId });
  } catch (error) {
    // 11000 is MongoDB's duplicate key error from the user + url index.
    if (error.code === 11000) {
      throw new ApiError(409, "You are already monitoring this URL");
    }

    throw error;
  }
}

export async function updateMonitor(userId, id, data) {
  const monitor = await findOwnedMonitor(userId, id);
  const urlChanged = data.url !== undefined && data.url !== monitor.url;
  const resumed = data.isActive === true && !monitor.isActive;
  const paused = data.isActive === false && monitor.isActive;

  monitor.set(data);

  // A new URL or a resumed monitor starts from scratch and is checked soon.
  if (urlChanged || resumed) {
    monitor.set(freshCheckState());
  }

  try {
    await monitor.save();
  } catch (error) {
    if (error.code === 11000) {
      throw new ApiError(409, "You are already monitoring this URL");
    }

    throw error;
  }

  // Pausing or resuming ends an open incident without an alert. A new URL does
  // not: if the monitor is up on its next check, the user gets the "back up" alert.
  if (resumed || paused) {
    await endOpenIncidents(monitor._id);
  }

  return monitor;
}

export async function deleteMonitor(userId, id) {
  const monitor = await findOwnedMonitor(userId, id);

  await monitor.deleteOne();
  // The history and incidents of a deleted monitor are of no use, so remove them too.
  await CheckResult.deleteMany({ monitor: monitor._id });
  await deleteIncidents(monitor._id);
}
