// Label, input, and an error or hint line. Extra props go to the <input>.
export default function FormField({ id, label, error, hint, ...inputProps }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        id={id}
        name={id}
        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
        aria-invalid={error ? "true" : undefined}
        {...inputProps}
      />
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
      {hint && !error ? (
        <p className="mt-1 text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}
