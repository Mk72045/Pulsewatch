import { useState } from "react";
import FormField from "../components/FormField.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { handleApi } from "../utils/handleApi.js";

const saveButton =
  "rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60";

// Lets a Google account add a password, so Google stops being the only way in.
// Accounts that already have one can change it here too. Either way the
// password field is the same form; `hasPassword` only changes the wording.
export default function PasswordSettings() {
  const { user, changePassword } = useAuth();
  const [form, setForm] = useState({ currentPassword: "", newPassword: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const hasPassword = user.hasPassword;

  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setFieldErrors({});
    setSubmitting(true);

    // currentPassword is only sent for an account that already has one.
    const result = await handleApi(
      () =>
        changePassword({
          newPassword: form.newPassword,
          ...(hasPassword ? { currentPassword: form.currentPassword } : {}),
        }),
      {
        success: hasPassword ? "Password changed" : "Password added",
        showError: false,
      },
    );

    setSubmitting(false);

    if (!result.ok) {
      setFieldErrors(result.error.fields);
      // A wrong current password comes back as a message, not a field error.
      if (result.error.code === "WRONG_PASSWORD") {
        setFieldErrors({ currentPassword: result.error.message });
      }
      return;
    }

    // The form starts clean, ready for the next change.
    setForm({ currentPassword: "", newPassword: "" });
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="font-medium">
        {hasPassword ? "Change password" : "Add a password"}
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        {hasPassword
          ? "Use a strong password you do not use anywhere else."
          : "You signed up with Google. Add a password so you can also log in with your email."}
      </p>

      {!hasPassword ? (
        <p className="mt-2 text-xs text-slate-500">
          This also lets you delete your account later, which asks for a
          password.
        </p>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-3 space-y-3">
        {hasPassword ? (
          <FormField
            id="currentPassword"
            label="Current password"
            type="password"
            autoComplete="current-password"
            required
            value={form.currentPassword}
            onChange={handleChange}
            error={fieldErrors.currentPassword}
          />
        ) : null}

        <FormField
          id="newPassword"
          label={hasPassword ? "New password" : "Password"}
          type="password"
          autoComplete="new-password"
          required
          value={form.newPassword}
          onChange={handleChange}
          error={fieldErrors.newPassword}
          hint="At least 8 characters, with an uppercase letter, a lowercase letter and a special character."
        />

        <button type="submit" disabled={submitting} className={saveButton}>
          {submitting
            ? "Saving..."
            : hasPassword
              ? "Change password"
              : "Add password"}
        </button>
      </form>
    </div>
  );
}
