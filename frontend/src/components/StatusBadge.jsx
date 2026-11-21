const styles = {
  up: "bg-emerald-100 text-emerald-800",
  down: "bg-red-100 text-red-800",
  pending: "bg-amber-100 text-amber-800",
  paused: "bg-slate-200 text-slate-700",
};

const labels = {
  up: "Up",
  down: "Down",
  pending: "Checking",
  paused: "Paused",
};

// A paused monitor is not checked, so "Paused" wins over its old status.
export default function StatusBadge({ monitor }) {
  const state = monitor.isActive ? monitor.status : "paused";

  return (
    <span
      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${styles[state]}`}
    >
      {labels[state]}
    </span>
  );
}