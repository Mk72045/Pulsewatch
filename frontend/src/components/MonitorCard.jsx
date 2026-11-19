import { Link } from "react-router-dom";

const actionButton =
  "rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-100 disabled:opacity-60";

// One monitor in the list. It only shows data. The page decides what
// Pause and Delete do. Edit is a link to the edit page.
export default function MonitorCard({ monitor, busy, onToggle, onDelete }) {
  const unit = monitor.intervalMinutes === 1 ? "minute" : "minutes";

  return (
    <li className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate font-medium">{monitor.name}</h2>
          <p className="truncate text-sm text-slate-600">{monitor.url}</p>
          <p className="mt-1 text-xs text-slate-500">
            Checks every {monitor.intervalMinutes} {unit}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
            monitor.isActive
              ? "bg-emerald-100 text-emerald-800"
              : "bg-slate-200 text-slate-700"
          }`}
        >
          {monitor.isActive ? "Active" : "Paused"}
        </span>
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
