import {
  HISTORY_RANGES,
  SUMMARY_WINDOW_HOURS,
} from "../config/constants.js";
import { CheckResult } from "../models/checkResult.model.js";
import { Monitor } from "../models/monitor.model.js";
import { findOwnedMonitor } from "./monitor.service.js";

// Rounds a percentage to one decimal, so 99.949 becomes 99.9 and not 99.9500001.
const round1 = (value) => Math.round(value * 10) / 10;

// Turns raw counters into the numbers the UI shows. `total` of zero means there
// is nothing to report yet, which is different from zero percent uptime.
function summarise(total, okCount, responseSum) {
  if (total === 0) {
    return { checks: 0, uptimePercent: null, avgResponseTimeMs: null };
  }

  return {
    checks: total,
    uptimePercent: round1((okCount / total) * 100),
    avgResponseTimeMs: okCount === 0 ? null : Math.round(responseSum / okCount),
  };
}

// The history of one monitor, split into even time buckets for the chart.
// Six hours is 36 buckets of ten minutes; a week is 42 buckets of four hours.
// Empty buckets come back as null, so a gap in the data looks like a gap and
// not like a slow response.
export async function getMonitorHistory(userId, monitorId, rangeKey) {
  // Throws 404 when the monitor is missing or belongs to someone else.
  const monitor = await findOwnedMonitor(userId, monitorId);
  const range = HISTORY_RANGES[rangeKey];

  const now = Date.now();
  const startMs = now - range.hours * 60 * 60 * 1000;
  const bucketMs = (range.hours * 60 * 60 * 1000) / range.buckets;

  // One query that counts and averages per bucket. Doing this in the database
  // keeps the response small: a week of one-minute checks is over 10,000 rows,
  // but the answer is 42 points.
  const rows = await CheckResult.aggregate([
    {
      $match: {
        monitor: monitor._id,
        // Bounded on both sides, so every matching row lands in a bucket that
        // the loop below actually visits. Without the upper bound a check
        // saved at the exact moment of the query would be counted nowhere.
        checkedAt: { $gte: new Date(startMs), $lt: new Date(now) },
      },
    },
    {
      $group: {
        _id: {
          $floor: {
            $divide: [{ $subtract: ["$checkedAt", new Date(startMs)] }, bucketMs],
          },
        },
        total: { $sum: 1 },
        // A boolean sums as 0 or 1, so this counts the successful checks.
        okCount: { $sum: { $cond: ["$ok", 1, 0] } },
        // $avg skips nulls, so only successful checks affect the line.
        avgMs: { $avg: { $cond: ["$ok", "$responseTimeMs", null] } },
        responseSum: {
          $sum: { $cond: ["$ok", { $ifNull: ["$responseTimeMs", 0] }, 0] },
        },
      },
    },
  ]);

  const byBucket = new Map(rows.map((row) => [row._id, row]));

  let totalChecks = 0;
  let totalOk = 0;
  let totalResponseSum = 0;

  const points = [];

  for (let index = 0; index < range.buckets; index += 1) {
    const row = byBucket.get(index);

    if (row) {
      totalChecks += row.total;
      totalOk += row.okCount;
      totalResponseSum += row.responseSum;
    }

    points.push({
      at: new Date(startMs + index * bucketMs).toISOString(),
      avgResponseTimeMs: row?.avgMs == null ? null : Math.round(row.avgMs),
      // How much of this bucket was healthy, so the strip under the chart can
      // show a partly-failed bucket as partly red.
      okRatio: row ? row.okCount / row.total : null,
      checks: row?.total ?? 0,
    });
  }

  return {
    monitor: {
      _id: monitor._id,
      name: monitor.name,
      url: monitor.url,
      status: monitor.status,
      isActive: monitor.isActive,
      intervalMinutes: monitor.intervalMinutes,
    },
    range: rangeKey,
    from: new Date(startMs).toISOString(),
    to: new Date(now).toISOString(),
    ...summarise(totalChecks, totalOk, totalResponseSum),
    points,
  };
}

// Uptime and average response time per monitor, for the cards on the dashboard.
// One aggregation covers every monitor, so the page needs a single extra query
// no matter how many monitors the user has.
export async function getMonitorsSummary(userId) {
  const monitors = await Monitor.find({ user: userId })
    .select("_id name url status isActive")
    .lean();

  if (monitors.length === 0) {
    return [];
  }

  const since = new Date(Date.now() - SUMMARY_WINDOW_HOURS * 60 * 60 * 1000);
  const ids = monitors.map((monitor) => monitor._id);

  const rows = await CheckResult.aggregate([
    { $match: { monitor: { $in: ids }, checkedAt: { $gte: since } } },
    {
      $group: {
        _id: "$monitor",
        total: { $sum: 1 },
        okCount: { $sum: { $cond: ["$ok", 1, 0] } },
        responseSum: {
          $sum: { $cond: ["$ok", { $ifNull: ["$responseTimeMs", 0] }, 0] },
        },
      },
    },
  ]);

  const byMonitor = new Map(rows.map((row) => [String(row._id), row]));

  return monitors.map((monitor) => {
    const row = byMonitor.get(String(monitor._id));

    return {
      _id: monitor._id,
      ...summarise(row?.total ?? 0, row?.okCount ?? 0, row?.responseSum ?? 0),
    };
  });
}
