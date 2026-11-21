import { CHECKS_AT_ONCE, MAX_CHECKS_PER_TICK } from "../config/constants.js";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { CheckResult } from "../models/checkResult.model.js";
import { Monitor } from "../models/monitor.model.js";
import { checkUrl } from "./checker.service.js";

let timer = null;
// The round that is running now, or null when the scheduler is idle.
let currentTick = null;

// Checks one monitor and saves the result. It never throws, so one broken
// monitor cannot stop the others.
async function checkMonitor(monitor) {
  try {
    // Claim the monitor by moving its next check time forward. The filter says
    // "only if nextCheckAt is still what I read". If another round, or another
    // server, already claimed it, nothing matches and we skip.
    const claim = await Monitor.updateOne(
      { _id: monitor._id, nextCheckAt: monitor.nextCheckAt },
      {
        $set: {
          nextCheckAt: new Date(Date.now() + monitor.intervalMinutes * 60_000),
        },
      },
      { timestamps: false },
    );

    if (claim.matchedCount === 0) {
      return;
    }

    const result = await checkUrl(monitor.url);

    // Save the latest result. Matching on the url means: if the user changed the
    // URL or deleted the monitor while we were checking, throw this result away.
    const update = await Monitor.updateOne(
      { _id: monitor._id, url: monitor.url },
      {
        $set: {
          status: result.ok ? "up" : "down",
          lastCheckedAt: new Date(),
          lastResponseTimeMs: result.responseTimeMs,
          lastStatusCode: result.statusCode,
          lastError: result.error,
        },
      },
      { timestamps: false },
    );

    if (update.matchedCount === 0) {
      return;
    }

    await CheckResult.create({
      monitor: monitor._id,
      ok: result.ok,
      statusCode: result.statusCode,
      responseTimeMs: result.responseTimeMs,
      error: result.error,
    });

    logger.debug(
      {
        monitor: monitor.name,
        url: monitor.url,
        ok: result.ok,
        statusCode: result.statusCode,
        responseTimeMs: result.responseTimeMs,
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
