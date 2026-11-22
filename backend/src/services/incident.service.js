import { Incident } from "../models/incident.model.js";

// Starts an incident for a monitor that was just confirmed down. If one is
// already open, for example one that survived a URL edit, nothing new starts
// and null is returned.
export async function openIncident(monitor, error) {
  const alreadyOpen = await Incident.exists({
    monitor: monitor._id,
    resolvedAt: null,
  });

  if (alreadyOpen) {
    return null;
  }

  return Incident.create({ monitor: monitor._id, user: monitor.user, error });
}

// Ends the open incident of a monitor that is up again.
// Returns the incident, or null if there was none.
export async function closeOpenIncident(monitor) {
  const incident = await Incident.findOne({
    monitor: monitor._id,
    resolvedAt: null,
  });

  if (!incident) {
    return null;
  }

  incident.resolvedAt = new Date();
  await incident.save();

  return incident;
}

// Ends open incidents without an email. Used when the user pauses, resumes or
// edits a monitor: whatever was wrong before no longer applies.
export async function endOpenIncidents(monitorId) {
  await Incident.updateMany(
    { monitor: monitorId, resolvedAt: null },
    { $set: { resolvedAt: new Date() } },
  );
}

export async function deleteIncidents(monitorId) {
  await Incident.deleteMany({ monitor: monitorId });
}

// The latest incidents of one user, newest first. populate() replaces the
// monitor id with its name and url, using one extra query for all rows.
export function listIncidents(userId) {
  return Incident.find({ user: userId })
    .sort({ startedAt: -1 })
    .limit(50)
    .populate("monitor", "name url");
}

// The incidents of one user that are still going on, newest first.
export function listOpenIncidents(userId) {
  return Incident.find({ user: userId, resolvedAt: null })
    .sort({ startedAt: -1 })
    .limit(5)
    .populate("monitor", "name url");
}
