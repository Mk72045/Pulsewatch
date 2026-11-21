import { Link } from "react-router-dom";
import { timeAgo } from "../utils/formatTime.js";
import StatusBadge from "./StatusBadge.jsx";

const actionButton =
  "rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-100 disabled:opacity-60";

// The line that says what the latest check found.
function describeCheck(monitor) {
  if (!monitor.isActive) {
    return { text: "Paused. Not being checked.", isProblem: false };
  }

  if (monitor.status === "pending") {
    return { text: "Waiting for the first check...", isProblem: false };
  }

  const checked = `checked ${timeAgo(monitor.lastCheckedAt)}`;

  if (monitor.status === "up") {
    return {
      text: `Responded in ${monitor.lastResponseTimeMs} ms, ${checked}`,
      isProblem: false,
    };
  }

  return { text: `${monitor.lastError}, ${checked}`, isProblem: true };
}

// One monitor in the list. It only shows data. The page decides what
// Pause and Delete do. Edit is a link to the edit page.
export default function MonitorCard({ monitor, busy, onToggle, onDelete }) {
  const unit = monitor.intervalMinutes === 1 ? "minute" : "minutes";
  const check = describeCheck(monitor);

  return (
    <li className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate font-medium">{monitor.name}</h2>
          <p className="truncate text-sm text-slate-600">{monitor.url}</p>
          <p
            className={`mt-1 text-sm ${
              check.isProblem ? "text-red-700" : "text-slate-600"
            }`}
          >
            {check.text}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            Checks every {monitor.intervalMinutes} {unit}
          </p>
        </div>
        <StatusBadge monitor={monitor} />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Link to={`/monitors/${monitor._id}/edit`} className={actionButton}>
          Edit
        </Link>
        <button
          type="button"
          onClick={onToggle}
          disabled={busy}
          className={actionButton}
        >
          {monitor.isActive ? "Pause" : "Resume"}
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={busy}
          className={`${actionButton} border-red-300 text-red-700 hover:bg-red-50`}
        >
          Delete
        </button>
      </div>
    </li>
  );
}