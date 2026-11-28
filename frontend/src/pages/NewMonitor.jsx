import { useNavigate } from "react-router-dom";
import MonitorForm from "../components/MonitorForm.jsx";
import { createMonitor } from "../services/monitorService.js";
import { handleApi } from "../utils/handleApi.js";
import BackLink from "../components/BackLink.jsx";

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
      <BackLink to="/dashboard">Back to dashboard</BackLink>
      <h1 className="mt-3 text-2xl font-bold text-slate-900">New monitor</h1>
      <p className="mt-1 text-sm text-slate-500">
        Enter the address to watch and how often to check it.
      </p>

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
