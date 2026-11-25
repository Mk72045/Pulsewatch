import { useEffect, useRef, useState } from "react";
import { GOOGLE_CLIENT_ID, googleEnabled } from "../utils/google.js";

// Google's own script. Loaded once, the first time a Google button is drawn.
const SCRIPT_SRC = "https://accounts.google.com/gsi/client";

// The credential handler the current button wants called. Google's library
// keeps ONE global instance, so this is set once and always delegates to the
// button that is on screen now. That is why initialize() runs only once.
let onCredential = null;

// The promise for the script, so two buttons mounting at the same time do not
// each add a tag. It is created on first use and kept.
let scriptPromise = null;

function loadGoogleScript() {
  if (window.google?.accounts?.id) {
    return Promise.resolve();
  }

  if (scriptPromise) {
    return scriptPromise;
  }

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${SCRIPT_SRC}"]`);

    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(), { once: true });
      return;
    }

    const script = document.createElement("script");

    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener("error", () => reject(), { once: true });
    document.head.appendChild(script);
  });

  return scriptPromise;
}

// Runs once per page load, however many Google buttons mount.
let initialized = false;

function initializeGoogle() {
  if (initialized || !window.google?.accounts?.id) {
    return;
  }

  window.google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: (response) => onCredential?.(response.credential),
    // No automatic One Tap prompt. Only the button below asks Google anything.
    auto_select: false,
    cancel_on_tap_outside: true,
    // Render in a popup instead of an iframe. An iframe is what makes the
    // browser warn about Cross-Origin-Opener-Policy and window.postMessage.
    ux_mode: "popup",
  });

  initialized = true;
}

// The "Continue with Google" button.
//
// We draw the button ourselves rather than letting Google render its iframe:
// the iframe produces Cross-Origin-Opener-Policy warnings in the console and
// cannot be styled to match the form. Clicking asks Google for a signed ID
// token, and `handleCredential(credential)` sends it to our backend, which is
// what actually decides whether the sign-in is real.
export default function GoogleButton({
  onCredential: handleCredential,
  disabled,
}) {
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  // A ref so a new function on each render does not need a new Google setup.
  const handlerRef = useRef(handleCredential);
  handlerRef.current = handleCredential;

  useEffect(() => {
    if (!googleEnabled) {
      return;
    }

    let cancelled = false;

    // Keep the shared handler pointing at this mount's function.
    onCredential = (credential) => handlerRef.current(credential);

    loadGoogleScript()
      .then(() => {
        if (cancelled || !window.google?.accounts?.id) {
          return;
        }

        initializeGoogle();
        setReady(true);
      })
      .catch(() => {
        // No Google today (offline, blocked, or the id is wrong). The form
        // below still works, so saying nothing is enough.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function handleClick() {
    if (!ready || busy || disabled) {
      return;
    }

    setBusy(true);

    // prompt() opens Google's account chooser and calls the callback with a
    // credential on success. It is the same token the iframe button produced.
    window.google.accounts.id.prompt((notification) => {
      // "isNotDisplayed" covers the case where the browser or the user's Google
      // settings blocked the prompt, so the spinner must not stay forever.
      if (
        notification.isNotDisplayed?.() ||
        notification.isSkippedMoment?.() ||
        notification.isDismissedMoment?.()
      ) {
        setBusy(false);
      }
    });

    // The callback above may never fire if Google never shows anything, so the
    // button frees itself after a short wait. Selecting an account replaces it.
    setTimeout(() => setBusy(false), 60_000);
  }

  if (!googleEnabled) {
    return null;
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || busy || !ready}
        className="flex w-full items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
      >
        {/* Google's mark, drawn inline so no extra request is made. */}
        <svg
          viewBox="0 0 48 48"
          className="h-5 w-5 shrink-0"
          aria-hidden="true"
        >
          <path
            fill="#EA4335"
            d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
          />
          <path
            fill="#4285F4"
            d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
          />
          <path
            fill="#FBBC05"
            d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
          />
          <path
            fill="#34A853"
            d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
          />
        </svg>
        {busy ? "Opening Google..." : "Continue with Google"}
      </button>
      {!ready ? (
        <p className="mt-1 text-center text-xs text-slate-500">
          Loading Google sign-in...
        </p>
      ) : null}
    </div>
  );
}
