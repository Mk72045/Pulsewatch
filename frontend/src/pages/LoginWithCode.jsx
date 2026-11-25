import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import FormField from "../components/FormField.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { requestLoginCode } from "../services/authService.js";
import { handleApi } from "../utils/handleApi.js";

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
    <section className="mx-auto max-w-sm">
      <h1 className="text-2xl font-semibold">Log in with a code</h1>
      <p className="mt-2 text-sm text-slate-600">
        No password needed. We email a 6-digit code, and you enter it here.
      </p>

      {step === "email" ? (
        <form onSubmit={handleSend} className="mt-6 space-y-4">
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
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
          >
            {submitting ? "Sending..." : "Email me a code"}
          </button>
        </form>
      ) : (
        <>
          <p className="mt-3 text-sm text-slate-600">
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
              value={code}
              onChange={(event) => setCode(event.target.value)}
              error={fieldErrors.code}
              hint="The code expires in 10 minutes."
            />
            <button
              type="submit"
              disabled={submitting || code.trim().length !== 6}
              className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
            >
              {submitting ? "Logging in..." : "Log in"}
            </button>
          </form>

          <div className="mt-4 text-sm text-slate-600">
            {waitLeft > 0 ? (
              <p>Send a new code in {waitLeft}s.</p>
            ) : (
              <button
                type="button"
                onClick={handleSend}
                disabled={submitting}
                className="font-medium text-slate-900 underline disabled:opacity-60"
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
              className="ml-4 font-medium text-slate-900 underline"
            >
              Use a different email
            </button>
          </div>
        </>
      )}

      <p className="mt-6 text-sm text-slate-600">
        Prefer your password?{" "}
        <Link to="/login" className="font-medium text-slate-900 underline">
          Log in
        </Link>
      </p>
    </section>
  );
}
