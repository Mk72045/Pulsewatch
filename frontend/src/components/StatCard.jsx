const tones = {
  normal: "text-slate-900",
  good: "text-emerald-700",
  bad: "text-red-700",
  muted: "text-slate-500",
};

// One number with a label, used for uptime and average response time.
export default function StatCard({ label, value, unit, tone = "normal", hint }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className={`mt-1 text-2xl font-semibold ${tones[tone]}`}>
        {value}
        {unit ? (
          <span className="ml-1 text-sm font-normal text-slate-500">{unit}</span>
        ) : null}
      </p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}