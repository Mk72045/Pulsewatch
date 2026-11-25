import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchPublicStatus } from "../services/statusService.js";
import { timeAgo } from "../utils/formatTime.js";
import { handleApi } from "../utils/handleApi.js";

const badgeStyles = {
  up: "bg-emerald-100 text-emerald-800",
  down: "bg-red-100 text-red-800",
  pending: "bg-amber-100 text-amber-800",
};

const badgeLabels = {
  up: "Operational",
  down: "Down",
  pending: "Checking",
};

const headlines = {
  up: "All systems operational",
  down: "Some systems are down",
  empty: "No monitors yet",
};

const headlineTones = {
  up: "border-emerald-200 bg-emerald-50 text-emerald-900",
  down: "border-red-200 bg-red-50 text-red-900",
  empty: "border-slate-200 bg-white text-slate-900",
};

// The page a user shares with their customers. No login, no navigation, and
// nothing private: only names, urls, status and when they were last checked.
export default function PublicStatus() {
  const { token } = useParams();
  const [status, setStatus] = useState(null);
  const [loadState, setLoadState] = useState("loading");

  useEffect(() => {
    async function load() {
      const result = await handleApi(() => fetchPublicStatus(token), {
        showError: false,
      });

      if (result.ok) {
        setStatus(result.data);
        setLoadState("ready");
      } else {
        setLoadState("notfound");
      }
    }

    load();
  }, [token]);

  if (loadState === "loading") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <div className="h-24 animate-pulse rounded-lg bg-slate-100" />
        <div className="mt-4 space-y-2">
          <div className="h-14 animate-pulse rounded-lg bg-slate-100" />
          <div className="h-14 animate-pulse rounded-lg bg-slate-100" />
        </div>
      </div>
    );
  }

  if (loadState === "notfound") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Status page not found</h1>
        <p className="mt-2 text-sm text-slate-600">
          This address is wrong, or the owner has turned the page off.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
        {status.owner}
      </p>
      <h1 className="mt-1 text-2xl font-semibold">Service status</h1>

      <div
        className={`mt-6 rounded-lg border px-4 py-4 ${headlineTones[status.overall]}`}
      >
        <p className="font-medium">{headlines[status.overall]}</p>
        <p className="mt-0.5 text-sm">
          {status.monitorCount === 0
            ? "Nothing is being monitored yet."
            : `${status.monitorCount - status.downCount} of ${status.monitorCount} services are up.`}
        </p>
      </div>

      {status.monitors.length > 0 ? (
        <ul className="mt-4 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
          {status.monitors.map((monitor) => (
            <li
              key={monitor.url}
              className="flex items-center justify-between gap-3 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{monitor.name}</p>
                <p className="truncate text-xs text-slate-500">
                  {monitor.lastCheckedAt
                    ? `Checked ${timeAgo(monitor.lastCheckedAt)}`
                    : "Waiting for the first check"}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  badgeStyles[monitor.status] ?? badgeStyles.pending
                }`}
              >
                {badgeLabels[monitor.status] ?? "Checking"}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      <p className="mt-8 text-center text-xs text-slate-500">
        Powered by Pulsewatch · updates automatically
      </p>
    </div>
  );
}