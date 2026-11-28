import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import FormField from "../components/FormField.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { requestLoginCode } from "../services/authService.js";
import { handleApi } from "../utils/handleApi.js";
import AuthCard from "../components/auth/AuthCard.jsx";
import SubmitButton from "../components/SubmitButton.jsx";

// Seconds before "Send a new code" is allowed again. Kept equal to the
// backend's OTP_RESEND_SECONDS so the button never offers a refused request.
const RESEND_SECONDS = 60;

// Sign in with a code emailed to the address instead of a password. Works for
// every account, including ones made with Google and anyone who forgot theirs.
export default function LoginWithCode() {
  const { user, loginWithCode } = useAuth();
  const navigate = useNavigate();

  // "email" asks for the address and sends a code; "code" asks for the code.
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(true);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [waitLeft, setWaitLeft] = useState(0);

  // Counts the resend cooldown down to zero, then stops.
  useEffect(() => {
    if (waitLeft === 0) {
      return;
    }

    const timer = setTimeout(() => setWaitLeft(waitLeft - 1), 1000);

    return () => clearTimeout(timer);
  }, [waitLeft]);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSend(event) {
    event?.preventDefault();

    if (submitting) {
      return;
    }

    setFieldErrors({});
    setSubmitting(true);

    const result = await handleApi(() => requestLoginCode(email));

    setSubmitting(false);

    if (!result.ok) {
      setFieldErrors(result.error.fields);
      return;
    }

    // The address may or may not have an account; the backend answers the same
    // either way, on purpose.
    setStep("code");
    setSent(result.data.emailSent);
    setWaitLeft(result.data.emailSent ? RESEND_SECONDS : 0);
  }

  async function handleLogin(event) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setFieldErrors({});
    setSubmitting(true);

    const result = await handleApi(() => loginWithCode({ email, code }), {
      success: "Logged in",
    });

    setSubmitting(false);

    if (result.ok) {
      navigate("/dashboard", { replace: true });
      return;
    }

    setFieldErrors(result.error.fields);
  }

    return (
    <AuthCard
      icon="mail"
      title="Log in with a code"
      subtitle="No password needed. We email a 6-digit code, and you enter it here."
      footer={
        <p>
          Prefer your password?{" "}
          <Link
            to="/login"
            className="font-semibold text-emerald-700 hover:underline"
          >
            Log in
          </Link>
        </p>
      }
    >
      {step === "email" ? (
        <form onSubmit={handleSend} className="space-y-4">
          <FormField
            id="email"
            label="Email"
            type="email"
            autoComplete="email"
            required
            autoFocus
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            error={fieldErrors.email}
          />
          <SubmitButton loading={submitting} loadingText="Sending...">
            Email me a code
          </SubmitButton>
        </form>
      ) : (
        <>
          <p
            className={`rounded-lg px-3 py-2 text-sm ${
              sent
                ? "bg-slate-50 text-slate-600"
                : "border border-amber-200 bg-amber-50 text-amber-800"
            }`}
          >
            {sent
              ? "If that address has an account, a code is on its way."
              : "The email could not be sent. Press Send a new code to try again."}
          </p>

          <form onSubmit={handleLogin} className="mt-4 space-y-4">
            <FormField
              id="code"
              label="Code from the email"
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
              error={fieldErrors.code}
              hint="The code expires in 10 minutes."
            />
            <SubmitButton
              loading={submitting}
              disabled={code.trim().length !== 6}
              loadingText="Logging in..."
            >
              Log in
            </SubmitButton>
          </form>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-sm text-slate-600">
            {waitLeft > 0 ? (
              <p>Send a new code in {waitLeft}s.</p>
            ) : (
              <button
                type="button"
                onClick={handleSend}
                disabled={submitting}
                className="font-semibold text-emerald-700 hover:underline disabled:opacity-60"
              >
                Send a new code
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setStep("email");
                setCode("");
                setFieldErrors({});
              }}
              className="font-semibold text-emerald-700 hover:underline"
            >
              Use a different email
            </button>
          </div>
        </>
      )}
    </AuthCard>
  );
}
