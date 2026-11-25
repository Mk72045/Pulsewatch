// A tiny uptime figure for one monitor on the dashboard. Kept separate from
// StatusBadge because a monitor can be up right now and still have had a bad day.
export default function UptimeCell({ summary }) {
  if (!summary || summary.uptimePercent === null) {
    return <span className="text-xs text-slate-500">No checks in 24h</span>;
  }

  const { uptimePercent, avgResponseTimeMs, checks } = summary;
  // Anything below 99.5% is worth a second look, so it is not shown in green.
  const tone =
    uptimePercent >= 99.5
      ? "text-emerald-700"
      : uptimePercent >= 95
        ? "text-amber-700"
        : "text-red-700";

  return (
    <span className="text-xs text-slate-500">
      <span className={`font-semibold ${tone}`}>{uptimePercent}%</span> uptime
      {avgResponseTimeMs !== null ? ` · ${avgResponseTimeMs} ms avg` : ""}
      {` · ${checks} checks`}
    </span>
  );
}