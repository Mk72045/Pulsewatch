import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import FormField from "../components/FormField.jsx";
import GoogleButton from "../components/GoogleButton.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { googleEnabled } from "../utils/google.js";
import { handleApi } from "../utils/handleApi.js";

export default function Register() {
  const { user, register, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
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

    const result = await handleApi(() => register(form));

    setSubmitting(false);

    if (!result.ok) {
      setFieldErrors(result.error.fields);
      return;
    }

    // The account exists but is not usable until the code is entered, so the
    // next stop is the verification page. The address travels in router state
    // (not the URL) and the page redirects back here if it is missing.
    // `emailSent` tells the page whether it should offer "Resend" at once.
    navigate("/verify-email", {
      state: { email: result.data.email, emailSent: result.data.emailSent },
    });
  }

  // Google has already verified the address, so there is no code to wait for
  // and the account is usable at once. If this person already has an account
  // with this email, the backend links it and signs them in instead of
  // refusing with "already exists".
  async function handleGoogle(credential) {
    if (submitting) {
      return;
    }

    setSubmitting(true);

    const result = await handleApi(() => signInWithGoogle(credential), {
      success: "Signed in with Google",
    });

    setSubmitting(false);

    if (result.ok) {
      navigate("/dashboard");
    }
  }

  return (
    <section className="mx-auto max-w-sm">
      <h1 className="text-2xl font-semibold">Create your account</h1>

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
