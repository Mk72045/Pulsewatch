import { formatDateTime, formatDuration } from "../utils/formatTime.js";

// One outage. It only shows data.
export default function IncidentRow({ incident }) {
  const ongoing = !incident.resolvedAt;
  const duration = formatDuration(incident.startedAt, incident.resolvedAt);

  return (
    <li className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate font-medium">
            {incident.monitor?.name ?? "Deleted monitor"}
          </h2>
          <p className="truncate text-sm text-slate-600">
            {incident.monitor?.url}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
            ongoing
              ? "bg-red-100 text-red-800"
              : "bg-emerald-100 text-emerald-800"
          }`}
        >
          {ongoing ? "Ongoing" : "Resolved"}
        </span>
      </div>

      <p className="mt-2 text-sm text-red-700">
        {incident.error ?? "No details"}
      </p>
      <p className="mt-1 text-xs text-slate-500">
        Started {formatDateTime(incident.startedAt)},{" "}
        {ongoing ? `down for ${duration} so far` : `lasted ${duration}`}
      </p>
    </li>
  );
}
