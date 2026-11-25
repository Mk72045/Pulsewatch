import { useEffect, useRef, useState } from "react";
import FormField from "./FormField.jsx";

// A centered modal built on the native <dialog> element. The browser handles
// the dark background, blocking the page behind and keeping Tab inside the box.
// `dialog` holds the text to show, or is null when nothing is open.
export default function ConfirmDialog({ dialog, onConfirm, onCancel }) {
  const ref = useRef(null);
  const isOpen = dialog !== null;

  // What the user typed into the optional input, e.g. the password.
  const [value, setValue] = useState("");
  // True while `dialog.action` is running. The buttons wait for it.
  const [busy, setBusy] = useState(false);
  const wasOpen = useRef(false);

  // The box keeps its state between openings, so start clean each time it opens.
  // Checking the transition (instead of every change of `dialog`) means typing
  // is not wiped when the context updates the dialog with an error.
  useEffect(() => {
    if (isOpen && !wasOpen.current) {
      setValue(dialog?.input?.initialValue ?? "");
      setBusy(false);
    }

    wasOpen.current = isOpen;
  }, [isOpen, dialog]);

  useEffect(() => {
    const element = ref.current;

    if (isOpen && !element.open) {
      element.showModal();
    } else if (!isOpen && element.open) {
      element.close();
    }
  }, [isOpen]);

  const confirmStyle =
    dialog?.tone === "danger"
      ? "bg-red-600 text-white hover:bg-red-700"
      : "bg-slate-900 text-white hover:bg-slate-700";

  // An input box makes its value required, unless the caller says otherwise.
  const valueRequired =
    Boolean(dialog?.input) && dialog?.input?.required !== false;
  const blocked = busy || (valueRequired && value.trim() === "");

  async function handleSubmit(event) {
    event.preventDefault();

    if (blocked) {
      return;
    }

    setBusy(true);
    await onConfirm(value);
    setBusy(false);
  }

  return (
    <dialog
      ref={ref}
      aria-labelledby="confirm-title"
      aria-describedby="confirm-message"
      // A click on the dark area lands on the <dialog> itself, not on the box inside.
      onClick={(event) => {
        if (event.target === event.currentTarget && !busy) {
          onCancel();
        }
      }}
      // The Escape key. We close it ourselves, so there is only one way it closes.
      onCancel={(event) => {
        event.preventDefault();

        if (!busy) {
          onCancel();
        }
      }}
      // m-auto: Tailwind resets margins, which would push the box to the top left.
      // The width follows the screen on phones and stops growing at max-w-md.
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-lg bg-white p-0 text-slate-900 shadow-xl backdrop:bg-slate-900/50"
    >
      {/* A form, so pressing Enter in the password box confirms. */}
      <form onSubmit={handleSubmit} className="p-6">
        <h2 id="confirm-title" className="text-lg font-semibold">
          {dialog?.title}
        </h2>
        <p id="confirm-message" className="mt-2 text-sm text-slate-600">
          {dialog?.message}
        </p>

        {dialog?.input ? (
          <div className="mt-4">
            <FormField
              id="confirm-input"
              label={dialog.input.label}
              type={dialog.input.type ?? "text"}
              autoComplete={dialog.input.autoComplete}
              value={value}
              onChange={(event) => setValue(event.target.value)}
              error={dialog.error}
              autoFocus
            />
          </div>
        ) : null}

        {/* An error from the last attempt, when there was no input to show it under. */}
        {!dialog?.input && dialog?.error ? (
          <p className="mt-4 text-sm text-red-600">{dialog.error}</p>
        ) : null}

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-100 disabled:opacity-60"
          >
            {dialog?.cancelLabel ?? "Cancel"}
          </button>
          <button
            type="submit"
            disabled={blocked}
            className={`rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-60 ${confirmStyle}`}
          >
            {busy ? "Working..." : (dialog?.confirmLabel ?? "Confirm")}
          </button>
        </div>
      </form>
    </dialog>
  );
}
