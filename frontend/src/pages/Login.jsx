import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import FormField from "../components/FormField.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { parseApiError } from "../utils/parseApiError.js";

const noError = { message: "", fields: {} };

export default function Login() {
  const { user, login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState(noError);
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

    setError(noError);
    setSubmitting(true);

    try {
      await login(form);
    } catch (err) {
      setError(parseApiError(err));
      setSubmitting(false);
    }
  }

  return (
    <section className="mx-auto max-w-sm">
      <h1 className="text-2xl font-semibold">Log in</h1>

      {error.message ? (
        <p role="alert" className="mt-4 text-sm text-red-600">
          {error.message}
        </p>
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
          error={error.fields.email}
        />
        <FormField
          id="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          required
          value={form.password}
          onChange={handleChange}
          error={error.fields.password}
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
    </section>
  );
}
