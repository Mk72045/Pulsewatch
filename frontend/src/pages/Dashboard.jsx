import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ListSkeleton from "../components/ListSkeleton.jsx";
import LoadError from "../components/LoadError.jsx";
import MonitorCard from "../components/MonitorCard.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useConfirm } from "../context/ConfirmContext.jsx";
import { fetchMonitorsSummary } from "../services/historyService.js";
import {
  deleteMonitor,
  fetchMonitors,
  updateMonitor,
} from "../services/monitorService.js";
import { MAX_MONITORS } from "../utils/constants.js";
import { handleApi } from "../utils/handleApi.js";

const primaryButton =
  "rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700";

// How often the list is refreshed in the background, so new check results show up.
const REFRESH_SECONDS = 30;

export default function Dashboard() {
  const { user } = useAuth();
  const confirmAction = useConfirm();
  const [monitors, setMonitors] = useState([]);
  // Uptime of each monitor over the last day, keyed by monitor id. Loading it
  // separately means a failed summary never hides the monitor list.
  const [summaryById, setSummaryById] = useState({});
  // The list is always in exactly one of these: "loading", "error" or "ready".
  const [status, setStatus] = useState("loading");
  const [loadError, setLoadError] = useState("");
  // Changing this number runs the loading effect again. Retry uses it.
  const [reloadKey, setReloadKey] = useState(0);
  // The monitor with a request running, so its buttons can be disabled.
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    async function load() {
      // A failed load is shown inside the page, so no error toast here.
      const result = await handleApi(fetchMonitors, { showError: false });

      if (result.ok) {
        setMonitors(result.data);
        setStatus("ready");
      } else {
        setLoadError(result.error.message);
        setStatus("error");
      }
    }

    load();
  }, [reloadKey]);

  // The uptime figures are a separate request. If it fails the cards simply
  // show "No checks in 24h", which is honest and does not break the page.
  useEffect(() => {
    async function loadSummary() {
      const result = await handleApi(fetchMonitorsSummary, {
        showError: false,
      });

      if (result.ok) {
        setSummaryById(
          Object.fromEntries(result.data.map((row) => [row._id, row])),
        );
      }
    }

    loadSummary();
  }, [reloadKey]);

  // Refresh the list now and then, so new check results appear without a reload.
  useEffect(() => {
    if (status !== "ready") {
      return;
    }

    const timer = setInterval(async () => {
      // No need to ask the server while the tab is hidden.
      if (document.hidden) {
        return;
      }

      const result = await handleApi(fetchMonitors, { showError: false });

      if (result.ok) {
        setMonitors(result.data);
      }
    }, REFRESH_SECONDS * 1000);

    // Runs when the page closes or `status` changes, so no timer is left running.
    return () => clearInterval(timer);
  }, [status]);

  function handleRetry() {
    setStatus("loading");
    setReloadKey(reloadKey + 1);
  }

  async function handleToggle(monitor) {
    setBusyId(monitor._id);

    const result = await handleApi(
      () => updateMonitor(monitor._id, { isActive: !monitor.isActive }),
      { success: monitor.isActive ? "Monitor paused" : "Monitor resumed" },
    );

    setBusyId(null);

    if (result.ok) {
      setMonitors((current) =>
        current.map((item) => (item._id === monitor._id ? result.data : item)),
      );
    }
  }

  async function handleDelete(monitor) {
    const confirmed = await confirmAction({
      title: "Delete monitor?",
      message: `"${monitor.name}" will be deleted. This cannot be undone.`,
      confirmLabel: "Delete",
      tone: "danger",
    });

    if (!confirmed) {
      return;
    }

    setBusyId(monitor._id);

    const result = await handleApi(() => deleteMonitor(monitor._id), {
      success: "Monitor deleted",
    });

    setBusyId(null);

    if (result.ok) {
      setMonitors((current) =>
        current.filter((item) => item._id !== monitor._id),
      );
    }
  }

  const atLimit = monitors.length >= MAX_MONITORS;

  return (
    <section>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Your monitors</h1>
          <p className="mt-1 text-sm text-slate-600">
            Hi {user.name}.{" "}
            {status === "ready"
              ? `${monitors.length} of ${MAX_MONITORS} monitors used.`
              : null}
          </p>
        </div>
        {status === "ready" && !atLimit ? (
          <Link to="/monitors/new" className={`shrink-0 ${primaryButton}`}>
            Add monitor
          </Link>
        ) : null}
      </div>

      <div className="mt-6">
        {status === "loading" ? <ListSkeleton /> : null}

        {status === "error" ? (
          <LoadError message={loadError} onRetry={handleRetry} />
        ) : null}

        {status === "ready" && monitors.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
            <p className="font-medium">No monitors yet</p>
            <p className="mt-1 text-sm text-slate-600">
              Add a website or API URL to start monitoring it.
            </p>
            <Link
              to="/monitors/new"
              className={`mt-4 inline-block ${primaryButton}`}
            >
              Add your first monitor
            </Link>
          </div>
        ) : null}

        {status === "ready" && monitors.length > 0 ? (
          <ul className="space-y-3">
            {monitors.map((monitor) => (
              <MonitorCard
                key={monitor._id}
                monitor={monitor}
                summary={summaryById[monitor._id]}
                busy={busyId === monitor._id}
                onToggle={() => handleToggle(monitor)}
                onDelete={() => handleDelete(monitor)}
              />
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
