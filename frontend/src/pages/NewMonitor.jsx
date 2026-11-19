import { Link, useNavigate } from "react-router-dom";
import MonitorForm from "../components/MonitorForm.jsx";
import { createMonitor } from "../services/monitorService.js";
import { handleApi } from "../utils/handleApi.js";

export default function NewMonitor() {
  const navigate = useNavigate();

  async function handleSubmit(values) {
    const result = await handleApi(() => createMonitor(values), {
      success: "Monitor created",
    });

    if (result.ok) {
      navigate("/dashboard");
    }

    // The form uses the result to show field errors.
    return result;
  }

  return (
    <section>
      <Link to="/dashboard" className="text-sm text-slate-600 underline">
        Back to dashboard
      </Link>
      <h1 className="mt-3 text-2xl font-semibold">New monitor</h1>

      <div className="mt-6 max-w-lg">
        <MonitorForm
          submitLabel="Add monitor"
          onSubmit={handleSubmit}
          onCancel={() => navigate("/dashboard")}
        />
      </div>
    </section>
  );
}
