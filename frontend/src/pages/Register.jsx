import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import FormField from "../components/FormField.jsx";

import { useAuth } from "../context/AuthContext.jsx";

import { handleApi } from "../utils/handleApi.js";
import AuthCard from "../components/auth/AuthCard.jsx";
import GoogleSection from "../components/auth/GoogleSection.jsx";
import SubmitButton from "../components/SubmitButton.jsx";

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
    <AuthCard
      icon="register"
      title="Create your account"
      subtitle="Start watching your websites and APIs."
      footer={
        <p>
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-semibold text-emerald-700 hover:underline"
          >
            Log in
          </Link>
        </p>
      }
    >
      <div className="space-y-4">
        <GoogleSection onCredential={handleGoogle} disabled={submitting} />

        <form onSubmit={handleSubmit} className="space-y-4">
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
          <SubmitButton loading={submitting} loadingText="Creating account...">
            Register
          </SubmitButton>
        </form>
      </div>
    </AuthCard>
  );
}
