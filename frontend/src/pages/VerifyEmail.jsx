import { useEffect, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import FormField from "../components/FormField.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { resendVerification } from "../services/authService.js";
import { handleApi } from "../utils/handleApi.js";
import AuthCard from "../components/auth/AuthCard.jsx";
import SubmitButton from "../components/SubmitButton.jsx";

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
    <AuthCard
      icon="mail"
      title="Confirm your email"
      subtitle={
        <>
          We sent a 6-digit code to{" "}
          <span className="break-all font-semibold text-slate-900">{email}</span>.
          Enter it below to finish creating your account.
        </>
      }
      footer={
        <p>
          Wrong address?{" "}
          <Link
            to="/register"
            className="font-semibold text-emerald-700 hover:underline"
          >
            Register again
          </Link>
        </p>
      }
    >
      {firstEmailSent ? null : (
        <p
          role="alert"
          className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"
        >
          The first email could not be sent. Press Resend code to try again.
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
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
          inputClassName="text-center font-mono tracking-[0.4em]"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          error={fieldError}
          hint="The code expires in 10 minutes."
        />
        <SubmitButton
          loading={submitting}
          disabled={code.trim().length !== 6}
          loadingText="Confirming..."
        >
          Confirm email
        </SubmitButton>
      </form>

      <div className="mt-4 text-center text-sm text-slate-600">
        {waitLeft > 0 ? (
          <p>Did not get it? You can resend a new code in {waitLeft}s.</p>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="font-semibold text-emerald-700 hover:underline disabled:opacity-60"
          >
            {resending ? "Sending..." : "Resend code"}
          </button>
        )}
      </div>
    </AuthCard>
  );
}
