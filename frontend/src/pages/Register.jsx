import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import FormField from "../components/FormField.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { handleApi } from "../utils/handleApi.js";

export default function Register() {
  const { user, register } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
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

    if (submitting) {
      return;
    }

    setFieldErrors({});
    setSubmitting(true);

    const result = await handleApi(() => register(form), {
      success: "Account created successfully",
    });

    setSubmitting(false);

    if (!result.ok) {
      setFieldErrors(result.error.fields);
    }
  }

  return (
    <section className="mx-auto max-w-sm">
      <h1 className="text-2xl font-semibold">Create your account</h1>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <FormField
          id="name"
          label="Name"
          type="text"
          autoComplete="name"
          required
          value={form.name}
          onChange={handleChange}
          error={fieldErrors.name}
        />
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
          autoComplete="new-password"
          required
          value={form.password}
          onChange={handleChange}
          error={fieldErrors.password}
          hint="At least 8 characters, with an uppercase letter, a lowercase letter and a special character."
        />
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
        >
          {submitting ? "Creating account..." : "Register"}
        </button>
      </form>

      <p className="mt-4 text-sm text-slate-600">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-slate-900 underline">
          Log in
        </Link>
      </p>
    </section>
  );
}
