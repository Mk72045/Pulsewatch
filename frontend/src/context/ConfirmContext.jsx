import { createContext, useContext, useState } from "react";
import ConfirmDialog from "../components/ConfirmDialog.jsx";

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  // What the open dialog shows, plus the function that answers the promise.
  // It is null when no dialog is open.
  const [dialog, setDialog] = useState(null);

  // Use it like window.confirm: const ok = await confirmAction({ ... })
  //
  // An optional `action` makes the dialog wait for real work: it is called
  // with whatever the user typed, and the dialog stays open with the error
  // shown if the action answers { ok: false, error }. When the dialog is
  // cancelled or the action fails, the promise answers false.
  function confirmAction(options) {
    return new Promise((resolve) => {
      setDialog({ ...options, resolve });
    });
  }

  function finish(answer) {
    if (!dialog) {
      return;
    }

    dialog.resolve(answer);
    setDialog(null);
  }

  async function runAndFinish(value) {
    const { action } = dialog ?? {};

    if (!action) {
      finish(true);
      return;
    }

    let result;

    try {
      result = await action(value);
    } catch {
      // The action should handle its own errors, but a bug must not leave
      // the dialog stuck on "Working...".
      result = { ok: false, error: "Something went wrong. Please try again." };
    }

    if (result?.ok) {
      finish(true);
      return;
    }

    // Keep the dialog open so the message sits under the input.
    setDialog((current) =>
      current
        ? {
            ...current,
            error: result?.error ?? "Something went wrong. Please try again.",
          }
        : current,
    );
  }

  // The optional second action, e.g. "Email me a code". It never closes the
  // dialog: it either reports an error or clears it, and the user then types
  // the value the extra step produced.
  async function runSecondary() {
    const { secondary } = dialog ?? {};

    if (!secondary) {
      return;
    }

    let result;

    try {
      result = await secondary.run();
    } catch {
      result = { ok: false, error: "Something went wrong. Please try again." };
    }

    setDialog((current) =>
      current
        ? {
            ...current,
            error: result?.ok ? null : (result?.error ?? "Please try again."),
          }
        : current,
    );
  }

  return (
    <ConfirmContext.Provider value={confirmAction}>
      {children}
      <ConfirmDialog
        dialog={dialog}
        onConfirm={runAndFinish}
        onSecondary={runSecondary}
        onCancel={() => finish(false)}
      />
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  return useContext(ConfirmContext);
}
