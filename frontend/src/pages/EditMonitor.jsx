import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import MonitorForm from "../components/MonitorForm.jsx";
import { fetchMonitor, updateMonitor } from "../services/monitorService.js";
import { handleApi } from "../utils/handleApi.js";

export default function EditMonitor() {
  // The :id part of the URL /monitors/:id/edit
  const { id } = useParams();
  const navigate = useNavigate();
  const [monitor, setMonitor] = useState(null);
  // Exactly one of "loading", "error" or "ready".
  const [status, setStatus] = useState("loading");
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    async function load() {
      // The error is shown inside the page, so no error toast here.
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
  }, [id]);

  async function handleSubmit(values) {
    const result = await handleApi(() => updateMonitor(id, values), {
      success: "Monitor updated",
    });

    if (result.ok) {
      navigate("/dashboard");
    }

    return result;
  }

  return (
    <section>
      <Link to="/dashboard" className="text-sm text-slate-600 underline">
        Back to dashboard
      </Link>
      <h1 className="mt-3 text-2xl font-semibold">Edit monitor</h1>

      <div className="mt-6 max-w-lg">
        {status === "loading" ? (
          <div
            role="status"
            className="h-64 animate-pulse rounded-lg bg-slate-200"
          >
            <span className="sr-only">Loading monitor...</span>
          </div>
        ) : null}

        {status === "error" ? (
          <p
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {loadError}
          </p>
        ) : null}

        {status === "ready" ? (
          <MonitorForm
            submitLabel="Save changes"
            initial={monitor}
            onSubmit={handleSubmit}
            onCancel={() => navigate("/dashboard")}
          />
        ) : null}
      </div>
    </section>
  );
}
