import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import FormField from "../components/FormField.jsx";
import GoogleButton from "../components/GoogleButton.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { googleEnabled } from "../utils/google.js";
import { handleApi } from "../utils/handleApi.js";

export default function Login() {
  const { user, login, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

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

    const result = await handleApi(() => login(form), {
      success: "Logged in successfully",
    });

    setSubmitting(false);

    if (result.ok) {
      return;
    }

    // The backend says the password was right but the email was never
    // confirmed. Send the user to the page where they enter the code.
    if (result.error.code === "EMAIL_UNVERIFIED") {
      navigate("/verify-email", { state: { email: form.email } });
      return;
    }

    setFieldErrors(result.error.fields);
  }

  // Google has already checked who this is, so a success goes straight to the
  // dashboard. It creates the account on the first sign-in.
  async function handleGoogle(credential) {
    if (submitting) {
      return;
    }

    setSubmitting(true);

    const result = await handleApi(() => signInWithGoogle(credential), {
      success: "Logged in with Google",
    });

    setSubmitting(false);

    if (result.ok) {
      navigate("/dashboard");
    }
  }

  return (
    <section className="mx-auto max-w-sm">
      <h1 className="text-2xl font-semibold">Log in</h1>

      {googleEnabled ? (
        <div className="mt-6 space-y-4">
          <GoogleButton onCredential={handleGoogle} disabled={submitting} />
          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-slate-200" />
            <span className="text-xs text-slate-500">or</span>
            <span className="h-px flex-1 bg-slate-200" />
          </div>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <FormField
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={form.email}
          onChange={handleChange}
          error={fieldErrors.email}
        />
        <FormField
          id="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          required
          value={form.password}
          onChange={handleChange}
          error={fieldErrors.password}
        />
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
        >
          {submitting ? "Logging in..." : "Log in"}
        </button>
      </form>

      <p className="mt-4 text-sm text-slate-600">
        No account yet?{" "}
        <Link to="/register" className="font-medium text-slate-900 underline">
          Register
        </Link>
      </p>
      <p className="mt-2 text-sm text-slate-600">
        No password, or forgot it?{" "}
        <Link to="/login/code" className="font-medium text-slate-900 underline">
          Log in with a code instead
        </Link>
      </p>
    </section>
  );
}
