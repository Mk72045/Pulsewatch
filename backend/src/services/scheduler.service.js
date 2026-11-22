import {
  CHECKS_AT_ONCE,
  FAILURES_BEFORE_DOWN,
  MAX_CHECKS_PER_TICK,
  RETRY_DELAY_SECONDS,
} from "../config/constants.js";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { CheckResult } from "../models/checkResult.model.js";
import { Monitor } from "../models/monitor.model.js";
import { sendDownAlert, sendRecoveredAlert } from "./alert.service.js";
import { checkUrl } from "./checker.service.js";
import { closeOpenIncident, openIncident } from "./incident.service.js";
import { processOutbox } from "./outbox.service.js";

let timer = null;
// The round that is running now, or null when the scheduler is idle.
let currentTick = null;

// Moves nextCheckAt forward. The filter says "only if nextCheckAt is still what
// I read", so if another round or another server already took this monitor,
// nothing matches and we skip it. Returns true if we got it.
async function claim(monitor) {
  const claimed = await Monitor.updateOne(
    { _id: monitor._id, nextCheckAt: monitor.nextCheckAt },
    {
      $set: {
        nextCheckAt: new Date(Date.now() + monitor.intervalMinutes * 60_000),
      },
    },
    { timestamps: false },
  );

  return claimed.matchedCount === 1;
}

// Works out the monitor's status after this check. One failure is not enough
// to call it down: it has to fail FAILURES_BEFORE_DOWN times in a row.
function nextState(monitor, result) {
  const failures = result.ok ? 0 : monitor.consecutiveFailures + 1;
  const confirmedDown = failures >= FAILURES_BEFORE_DOWN;

  // While a failure is being confirmed, the old status stays.
  let status = monitor.status;

  if (result.ok) {
    status = "up";
  } else if (confirmedDown) {
    status = "down";
  }

  return { status, failures, confirmedDown };
}

// Saves the latest result on the monitor. Matching on the url means: if the
// user changed the URL or deleted the monitor while we were checking, the
// result is thrown away. Returns false in that case.
async function saveResult(monitor, result, state) {
  const changes = {
    status: state.status,
    consecutiveFailures: state.failures,
    lastCheckedAt: new Date(),
    lastResponseTimeMs: result.responseTimeMs,
    lastStatusCode: result.statusCode,
    lastError: result.error,
  };

  // A failure that is not confirmed yet is checked again soon, not after a full interval.
  if (!result.ok && !state.confirmedDown) {
    changes.nextCheckAt = new Date(Date.now() + RETRY_DELAY_SECONDS * 1000);
  }

  const update = await Monitor.updateOne(
    { _id: monitor._id, url: monitor.url },
    { $set: changes },
    { timestamps: false },
  );

  return update.matchedCount === 1;
}

// An email goes out only when the state changes, never on every failed check.
async function handleStateChange(monitor, result, state) {
  const wasDown = monitor.status === "down";
  // A monitor that was just edited starts as "pending" but can still have an
  // open incident, so it is looked up as well.
  const mayHaveIncident = wasDown || monitor.status === "pending";

  if (state.confirmedDown && !wasDown) {
    const incident = await openIncident(monitor, result.error);

    if (incident) {
      await sendDownAlert(monitor, incident);
    }
  } else if (result.ok && mayHaveIncident) {
    const incident = await closeOpenIncident(monitor);

    if (incident) {
      await sendRecoveredAlert(monitor, incident);
    }
  }
}

// Checks one monitor and saves everything. It never throws, so one broken
// monitor cannot stop the others.
async function checkMonitor(monitor) {
  try {
    if (!(await claim(monitor))) {
      return;
    }

    const result = await checkUrl(monitor.url);
    const state = nextState(monitor, result);

    if (!(await saveResult(monitor, result, state))) {
      return;
    }

    await CheckResult.create({
      monitor: monitor._id,
      ok: result.ok,
      statusCode: result.statusCode,
      responseTimeMs: result.responseTimeMs,
      error: result.error,
    });

    await handleStateChange(monitor, result, state);

    logger.debug(
      {
        monitor: monitor.name,
        url: monitor.url,
        ok: result.ok,
        status: state.status,
        failures: state.failures,
        error: result.error,
      },
      "Check finished",
    );
  } catch (error) {
    logger.error({ err: error, monitorId: monitor.id }, "Check failed");
  }
}

// One round: find the monitors that are due and check them in small groups.
async function tick() {
  try {
    const due = await Monitor.find({
      isActive: true,
      nextCheckAt: { $lte: new Date() },
    })
      .sort({ nextCheckAt: 1 })
      .limit(MAX_CHECKS_PER_TICK);

    for (let start = 0; start < due.length; start += CHECKS_AT_ONCE) {
      const group = due.slice(start, start + CHECKS_AT_ONCE);

      await Promise.all(group.map((monitor) => checkMonitor(monitor)));
    }

    // Messages that failed earlier are tried again here, once they are due.
    await processOutbox();
  } catch (error) {
    logger.error({ err: error }, "Scheduler round failed");
  }
}

function runTick() {
  // The last round is still working, so skip this one.
  if (currentTick) {
    return;
  }

  currentTick = tick().finally(() => {
    currentTick = null;
  });
}

export function startScheduler() {
  timer = setInterval(runTick, env.SCHEDULER_TICK_SECONDS * 1000);
  runTick();

  logger.info(
    `Scheduler started, looking for due monitors every ${env.SCHEDULER_TICK_SECONDS}s`,
  );
}

export async function stopScheduler() {
  clearInterval(timer);
  timer = null;

  // Let a round that is already running finish, before the database closes.
  await currentTick;
}
