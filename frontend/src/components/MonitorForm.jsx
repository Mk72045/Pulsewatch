import { useState } from "react";
import { MONITOR_INTERVALS } from "../utils/constants.js";
import FormField from "./FormField.jsx";

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

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-lg border border-slate-200 bg-white p-4"
    >
      <FormField
        id="name"
        label="Name"
        type="text"
        required
        maxLength={60}
        placeholder="My website"
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
        <select
          id="intervalMinutes"
          name="intervalMinutes"
          value={form.intervalMinutes}
          onChange={handleChange}
          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
        >
          {MONITOR_INTERVALS.map((minutes) => (
            <option key={minutes} value={minutes}>
              {minutes} {minutes === 1 ? "minute" : "minutes"}
            </option>
          ))}
        </select>
        {fieldErrors.intervalMinutes ? (
          <p className="mt-1 text-xs text-red-600">
            {fieldErrors.intervalMinutes}
          </p>
        ) : null}
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
        >
          {submitting ? "Saving..." : submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-100"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
