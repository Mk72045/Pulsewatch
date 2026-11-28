import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import FormField from "../components/FormField.jsx";

import { useAuth } from "../context/AuthContext.jsx";

import { handleApi } from "../utils/handleApi.js";
import AuthCard from "../components/auth/AuthCard.jsx";
import GoogleSection from "../components/auth/GoogleSection.jsx";
import SubmitButton from "../components/SubmitButton.jsx";

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
    <AuthCard
      icon="login"
      title="Welcome back"
      subtitle="Log in to check on your monitors."
      footer={
        <>
          <p>
            No account yet?{" "}
            <Link
              to="/register"
              className="font-semibold text-emerald-700 hover:underline"
            >
              Register
            </Link>
          </p>
          <p>
            No password, or forgot it?{" "}
            <Link
              to="/login/code"
              className="font-semibold text-emerald-700 hover:underline"
            >
              Log in with a code instead
            </Link>
          </p>
        </>
      }
    >
      <div className="space-y-4">
        <GoogleSection onCredential={handleGoogle} disabled={submitting} />

        <form onSubmit={handleSubmit} className="space-y-4">
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
          <SubmitButton loading={submitting} loadingText="Logging in...">
            Log in
          </SubmitButton>
        </form>
      </div>
    </AuthCard>
  );
}
