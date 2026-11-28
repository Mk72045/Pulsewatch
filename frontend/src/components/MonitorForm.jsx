import { useState } from "react";
import { MONITOR_INTERVALS } from "../utils/constants.js";
import FormField from "./FormField.jsx";
import NavIcon from "./navbar/NavIcon.jsx";
import SubmitButton from "./SubmitButton.jsx";

// Used for both adding and editing. `initial` is set only when editing.
// onSubmit must return the handleApi result, so this form can show field errors.
export default function MonitorForm({
  submitLabel,
  initial,
  onSubmit,
  onCancel,
}) {
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    url: initial?.url ?? "",
    intervalMinutes: initial?.intervalMinutes ?? 5,
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    // Stops a double click from sending the request twice.
    if (submitting) {
      return;
    }

    setFieldErrors({});
    setSubmitting(true);

    // A <select> gives a string, but the backend expects a number.
    const result = await onSubmit({
      ...form,
      intervalMinutes: Number(form.intervalMinutes),
    });

    setSubmitting(false);

    if (!result.ok) {
      setFieldErrors(result.error.fields);
    }
  }

    // Same look as FormField: green focus, red border when the backend complains.
  const selectStyle = fieldErrors.intervalMinutes
    ? "border-red-400 focus:border-red-500 focus:ring-red-200"
    : "border-slate-300 hover:border-slate-400 focus:border-emerald-600 focus:ring-emerald-200";

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
    >
      <FormField
        id="name"
        label="Name"
        type="text"
        required
        maxLength={60}
        placeholder="My website"
        hint="A short name to recognise this monitor."
        value={form.name}
        onChange={handleChange}
        error={fieldErrors.name}
      />
      <FormField
        id="url"
        label="URL"
        type="url"
        required
        placeholder="https://example.com"
        hint="The address Pulsewatch will check, starting with https://"
        value={form.url}
        onChange={handleChange}
        error={fieldErrors.url}
      />

      <div>
        <label
          htmlFor="intervalMinutes"
          className="block text-sm font-medium text-slate-700"
        >
          Check every
        </label>
        <div className="relative mt-1.5">
          <select
            id="intervalMinutes"
            name="intervalMinutes"
            value={form.intervalMinutes}
            onChange={handleChange}
            aria-invalid={fieldErrors.intervalMinutes ? "true" : undefined}
            aria-describedby="intervalMinutes-message"
            className={`w-full appearance-none rounded-lg border bg-white py-2.5 pl-3 pr-10 text-base text-slate-900 transition-colors focus:outline-none focus:ring-2 sm:text-sm ${selectStyle}`}
          >
            {MONITOR_INTERVALS.map((minutes) => (
              <option key={minutes} value={minutes}>
                {minutes} {minutes === 1 ? "minute" : "minutes"}
              </option>
            ))}
          </select>
          <NavIcon
            name="chevron-down"
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          />
        </div>
        {fieldErrors.intervalMinutes ? (
          <p
            id="intervalMinutes-message"
            className="mt-1.5 text-xs font-medium text-red-600"
          >
            {fieldErrors.intervalMinutes}
          </p>
        ) : (
          <p
            id="intervalMinutes-message"
            className="mt-1.5 text-xs text-slate-500"
          >
            How often Pulsewatch checks this address.
          </p>
        )}
      </div>

      {/* On phones the buttons stack with the main action on top. */}
      <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
        >
          Cancel
        </button>
        <SubmitButton
          loading={submitting}
          loadingText="Saving..."
          className="sm:w-auto sm:px-6"
        >
          {submitLabel}
        </SubmitButton>
      </div>
    </form>
  );
}