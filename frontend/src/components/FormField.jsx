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
  inputClassName = "",
  ...inputProps
}) {
  const [visible, setVisible] = useState(false);
  const isPassword = type === "password";
  const messageId = `${id}-message`;

  const borderStyle = error
    ? "border-red-400 focus:border-red-500 focus:ring-red-200"
    : "border-slate-300 hover:border-slate-400 focus:border-emerald-600 focus:ring-emerald-200";

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      <div className="relative mt-1.5">
        <input
          id={id}
          name={id}
          type={isPassword && visible ? "text" : type}
          className={`w-full rounded-lg border bg-white px-3 py-2.5 text-base text-slate-900 transition-colors placeholder:text-slate-400 focus:outline-none focus:ring-2 sm:text-sm ${borderStyle} ${
            isPassword ? "pr-11" : ""
          } ${inputClassName}`}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={error || hint ? messageId : undefined}
          {...inputProps}
        />
        {isPassword ? (
          <button
            type="button"
            onClick={() => setVisible(!visible)}
            aria-label={visible ? "Hide password" : "Show password"}
            aria-pressed={visible}
            className="absolute inset-y-0 right-0 flex items-center rounded-r-lg px-3 text-slate-500 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-emerald-600"
          >
            <EyeIcon open={visible} />
          </button>
        ) : null}
      </div>
      {error ? (
        <p id={messageId} className="mt-1.5 text-xs font-medium text-red-600">
          {error}
        </p>
      ) : null}
      {hint && !error ? (
        <p id={messageId} className="mt-1.5 text-xs text-slate-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}