import { useState } from "react";
import EyeIcon from "./EyeIcon";

// Label, input, and an error or hint line. Extra props go to the <input>.
// A password field also gets a button to show or hide what is typed.
export default function FormField({
  id,
  label,
  error,
  hint,
  type = "text",
  ...inputProps
}) {
  const [visible, setVisible] = useState(false);
  const isPassword = type === "password";

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      <div className="relative mt-1">
        <input
          id={id}
          name={id}
          type={isPassword && visible ? "text" : type}
          className={`w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 ${
            isPassword ? "pr-10" : ""
          }`}
          aria-invalid={error ? "true" : undefined}
          {...inputProps}
        />
        {isPassword ? (
          <button
            type="button"
            onClick={() => setVisible(!visible)}
            aria-label={visible ? "Hide password" : "Show password"}
            aria-pressed={visible}
            className="absolute inset-y-0 right-0 flex items-center rounded-r-lg px-3 text-slate-500 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-slate-900"
          >
            <EyeIcon open={visible} />
          </button>
        ) : null}
      </div>
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
      {hint && !error ? (
        <p className="mt-1 text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}
