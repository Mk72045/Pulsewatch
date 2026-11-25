import { useEffect, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import FormField from "../components/FormField.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { resendVerification } from "../services/authService.js";
import { handleApi } from "../utils/handleApi.js";

// Seconds before "Resend code" is allowed again. Kept equal to the backend's
// OTP_RESEND_SECONDS so the button does not offer a request that is refused.
const RESEND_SECONDS = 60;

export default function VerifyEmail() {
  const { user, confirmEmail } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;
  // False when the backend could not send the first email, so the page knows
  // to offer "Resend" immediately instead of a 60 second wait.
  const firstEmailSent = location.state?.emailSent !== false;
  const [code, setCode] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [waitLeft, setWaitLeft] = useState(firstEmailSent ? RESEND_SECONDS : 0);
  const [resending, setResending] = useState(false);

  // Counts the resend cooldown down to zero, then stops.
  useEffect(() => {
    if (waitLeft === 0) {
      return;
    }

    const timer = setTimeout(() => setWaitLeft(waitLeft - 1), 1000);

    return () => clearTimeout(timer);
  }, [waitLeft]);

  // Opened without an address (a bookmark, a refresh). There is nothing to
  // verify, so send the user to the form that starts the flow.
  if (!email) {
    return <Navigate to="/register" replace />;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setFieldError("");
    setSubmitting(true);

    const result = await handleApi(() => confirmEmail({ email, code }), {
      success: "Email confirmed. Welcome to Pulsewatch",
    });

    setSubmitting(false);

    if (result.ok) {
      navigate("/dashboard", { replace: true });
      return;
    }

    // Field problems are shown under the input; anything else uses the toast
    // that handleApi already showed.
    setFieldError(result.error.fields.code ?? "");
  }

  async function handleResend() {
    setResending(true);

    const result = await handleApi(() => resendVerification(email), {
      success: "A new code is on its way",
    });

    setResending(false);

    // On failure handleApi has already shown the error toast.
    if (result.ok) {
      setWaitLeft(RESEND_SECONDS);
    }
  }

  return (
    <section className="mx-auto max-w-sm">
      <h1 className="text-2xl font-semibold">Confirm your email</h1>
      <p className="mt-2 text-sm text-slate-600">
        We sent a 6-digit code to <span className="font-medium">{email}</span>.
        Enter it below to finish creating your account.
      </p>

      {firstEmailSent ? null : (
        <p
          role="alert"
          className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"
        >
          The first email could not be sent. Press Resend code to try again.
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <FormField
          id="code"
          label="Verification code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          required
          autoFocus
          placeholder="123456"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          error={fieldError}
          hint="The code expires in 10 minutes."
        />
        <button
          type="submit"
          disabled={submitting || code.trim().length !== 6}
          className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
        >
          {submitting ? "Confirming..." : "Confirm email"}
        </button>
      </form>

      <div className="mt-4 text-sm text-slate-600">
        {waitLeft > 0 ? (
          <p>Did not get it? You can resend a new code in {waitLeft}s.</p>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="font-medium text-slate-900 underline disabled:opacity-60"
          >
            {resending ? "Sending..." : "Resend code"}
          </button>
        )}
      </div>

      <p className="mt-6 text-sm text-slate-600">
        Wrong address?{" "}
        <Link to="/register" className="font-medium text-slate-900 underline">
          Register again
        </Link>
      </p>
    </section>
  );
}
