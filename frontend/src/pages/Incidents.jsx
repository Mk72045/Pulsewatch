import { useEffect, useState } from "react";
import IncidentRow from "../components/IncidentRow.jsx";
import ListSkeleton from "../components/ListSkeleton.jsx";
import LoadError from "../components/LoadError.jsx";
import { fetchIncidents } from "../services/incidentService.js";
import { handleApi } from "../utils/handleApi.js";

export default function Incidents() {
  const [incidents, setIncidents] = useState([]);
  // Exactly one of "loading", "error" or "ready".
  const [status, setStatus] = useState("loading");
  const [loadError, setLoadError] = useState("");
  // Changing this number runs the loading effect again. Retry uses it.
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    async function load() {
      // A failed load is shown inside the page, so no error toast here.
      const result = await handleApi(fetchIncidents, { showError: false });

      if (result.ok) {
        setIncidents(result.data);
        setStatus("ready");
      } else {
        setLoadError(result.error.message);
        setStatus("error");
      }
    }

    load();
  }, [reloadKey]);

  function handleRetry() {
    setStatus("loading");
    setReloadKey(reloadKey + 1);
  }

  return (
    <section>
      <h1 className="text-2xl font-semibold">Incidents</h1>
      <p className="mt-1 text-sm text-slate-600">
        Every time one of your monitors was confirmed down. Showing the latest
        50.
      </p>

      <div className="mt-6">
        {status === "loading" ? <ListSkeleton /> : null}

        {status === "error" ? (
          <LoadError message={loadError} onRetry={handleRetry} />
        ) : null}

        {status === "ready" && incidents.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
            <p className="font-medium">No incidents yet</p>
            <p className="mt-1 text-sm text-slate-600">
              That is good news. A monitor shows up here after two failed checks
              in a row.
            </p>
          </div>
        ) : null}

        {status === "ready" && incidents.length > 0 ? (
          <ul className="space-y-3">
            {incidents.map((incident) => (
              <IncidentRow key={incident._id} incident={incident} />
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
