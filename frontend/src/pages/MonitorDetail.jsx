import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import ListSkeleton from "../components/ListSkeleton.jsx";
import LoadError from "../components/LoadError.jsx";
import ResponseChart from "../components/ResponseChart.jsx";
import StatCard from "../components/StatCard.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { useConfirm } from "../context/ConfirmContext.jsx";
import { fetchMonitorHistory } from "../services/historyService.js";
import { deleteMonitor, fetchMonitor } from "../services/monitorService.js";
import { timeAgo } from "../utils/formatTime.js";
import { handleApi } from "../utils/handleApi.js";

const secondaryButton =
  "rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-100 disabled:opacity-60";

// The three windows the chart can show, with the wording used on the buttons.
const RANGES = [
  { key: "6h", label: "6 hours" },
  { key: "24h", label: "24 hours" },
  { key: "7d", label: "7 days" },
];

const SPAN_HOURS = { "6h": 6, "24h": 24, "7d": 24 * 7 };

function uptimeTone(percent) {
  if (percent === null) {
    return "muted";
  }

  if (percent >= 99.5) {
    return "good";
  }

  return percent >= 95 ? "normal" : "bad";
}

// The unit is shown only when there is a real number, so an empty value does not
// get a "%" or "ms" stuck to it while the history is still loading.
// A loose != catches both null and undefined on purpose.
const unitIf = (value, unit) => (value != null ? unit : "");

export default function MonitorDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const confirmAction = useConfirm();

  const [monitor, setMonitor] = useState(null);
  const [history, setHistory] = useState(null);
  const [range, setRange] = useState("24h");
  // "loading" | "error" | "ready" for the monitor itself.
  const [status, setStatus] = useState("loading");
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  // The chart loads separately, so changing the range does not blank the page.
  const [historyStatus, setHistoryStatus] = useState("loading");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function load() {
      const result = await handleApi(() => fetchMonitor(id), {
        showError: false,
      });

      if (result.ok) {
        setMonitor(result.data);
        setStatus("ready");
      } else {
        setLoadError(result.error.message);
        setStatus("error");
      }
    }

    load();
  }, [id, reloadKey]);

  useEffect(() => {
    let cancelled = false;

    async function loadHistory() {
      setHistoryStatus("loading");

      const result = await handleApi(() => fetchMonitorHistory(id, range), {
        showError: false,
      });

      // The user can change the range again before this answers, so the older
      // answer must not overwrite the newer one.
      if (cancelled) {
        return;
      }

      if (result.ok) {
        setHistory(result.data);
        setHistoryStatus("ready");
      } else {
        setHistoryStatus("error");
      }
    }

    loadHistory();

    return () => {
      cancelled = true;
    };
  }, [id, range, reloadKey]);

  async function handleDelete() {
    const confirmed = await confirmAction({
      title: "Delete monitor?",
      message: `"${monitor.name}" and its history will be deleted. This cannot be undone.`,
      confirmLabel: "Delete",
      tone: "danger",
    });

    if (!confirmed) {
      return;
    }

    setDeleting(true);

    const result = await handleApi(() => deleteMonitor(id), {
      success: "Monitor deleted",
    });

    setDeleting(false);

    if (result.ok) {
      navigate("/dashboard");
    }
  }

  if (status === "loading") {
    return <ListSkeleton />;
  }

  if (status === "error") {
    return (
      <div>
        <LoadError message={loadError} onRetry={() => setReloadKey(reloadKey + 1)} />
        <Link to="/dashboard" className="mt-4 inline-block text-sm text-slate-600 hover:underline">
          Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <section>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <Link
            to="/dashboard"
            className="text-sm text-slate-600 hover:underline"
          >
            ← Dashboard
          </Link>
          <h1 className="mt-2 truncate text-2xl font-semibold">{monitor.name}</h1>
          <p className="truncate text-sm text-slate-600">{monitor.url}</p>
        </div>
        <StatusBadge monitor={monitor} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link to={`/monitors/${monitor._id}/edit`} className={secondaryButton}>
          Edit
        </Link>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className={`${secondaryButton} border-red-300 text-red-700 hover:bg-red-50`}
        >
          {deleting ? "Deleting..." : "Delete"}
        </button>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={`Uptime (${range})`}
          value={history?.uptimePercent ?? "—"}
          unit={unitIf(history?.uptimePercent, "%")}
          tone={uptimeTone(history?.uptimePercent ?? null)}
          hint={history ? `${history.checks} checks` : undefined}
        />
        <StatCard
          label="Average response"
          value={history?.avgResponseTimeMs ?? "—"}
          unit={unitIf(history?.avgResponseTimeMs, "ms")}
          hint="Successful checks only"
        />
        <StatCard
          label="Last checked"
          value={monitor.lastCheckedAt ? timeAgo(monitor.lastCheckedAt) : "Never"}
          hint={
            monitor.lastStatusCode ? `HTTP ${monitor.lastStatusCode}` : undefined
          }
        />
        <StatCard
          label="Check interval"
          value={`${monitor.intervalMinutes}`}
          unit={monitor.intervalMinutes === 1 ? "minute" : "minutes"}
        />
      </div>

      {monitor.lastError && monitor.isActive ? (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          Last check reported: {monitor.lastError}
          {monitor.status !== "down"
            ? " — checking again to confirm before opening an incident."
            : ""}
        </p>
      ) : null}

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-medium">Response time</h2>
          <div className="flex gap-1" role="group" aria-label="Chart time range">
            {RANGES.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => setRange(option.key)}
                aria-pressed={range === option.key}
                className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                  range === option.key
                    ? "bg-slate-900 text-white"
                    : "border border-slate-300 text-slate-700 hover:bg-slate-100"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {historyStatus === "loading" ? (
          <div className="h-56 animate-pulse rounded-md bg-slate-100" />
        ) : null}

        {historyStatus === "error" ? (
          <p className="py-8 text-center text-sm text-slate-600">
            Could not load the history for this monitor.
          </p>
        ) : null}

        {historyStatus === "ready" && history ? (
          <ResponseChart points={history.points} spanHours={SPAN_HOURS[range]} />
        ) : null}
      </div>
    </section>
  );
}