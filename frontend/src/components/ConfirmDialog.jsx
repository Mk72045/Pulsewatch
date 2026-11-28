import { useEffect, useRef, useState } from "react";
import FormField from "./FormField.jsx";
import NavIcon from "./navbar/NavIcon.jsx";

// A centered modal built on the native <dialog> element. The browser handles
// the dark background, blocking the page behind and keeping Tab inside the box.
// `dialog` holds the text to show, or is null when nothing is open.
export default function ConfirmDialog({
  dialog,
  onConfirm,
  onCancel,
  onSecondary,
}) {
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

  const isDanger = dialog?.tone === "danger";

  const confirmStyle = isDanger
    ? "bg-red-600 text-white hover:bg-red-700 focus-visible:outline-red-600"
    : "bg-slate-900 text-white hover:bg-slate-800 focus-visible:outline-emerald-600";

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

  // The optional second action (for example "Email me a code"). It runs while
  // the dialog stays open, and shows its own error under the input.
  async function handleSecondary() {
    if (busy) {
      return;
    }

    setBusy(true);
    await onSecondary();
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
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl bg-white p-0 text-slate-900 shadow-2xl transition duration-200 backdrop:bg-slate-900/50 backdrop:backdrop-blur-sm starting:scale-95 starting:opacity-0 motion-reduce:transition-none"
    >
      {/* A form, so pressing Enter in the password box confirms. */}
      <form onSubmit={handleSubmit} className="p-6">
        <div className="flex items-start gap-4">
          <span
            className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${
              isDanger
                ? "bg-red-50 text-red-600"
                : "bg-emerald-50 text-emerald-600"
            }`}
          >
            {/* "incidents" is the warning triangle icon */}
            <NavIcon
              name={isDanger ? "incidents" : "info"}
              className="h-5 w-5"
            />
          </span>

          <div className="min-w-0">
            <h2 id="confirm-title" className="text-lg font-semibold">
              {dialog?.title}
            </h2>
            <p id="confirm-message" className="mt-1 text-sm text-slate-600">
              {dialog?.message}
            </p>
          </div>
        </div>

        {dialog?.input ? (
          <div className="mt-5">
            <FormField
              id="confirm-input"
              label={dialog.input.label}
              type={dialog.input.type ?? "text"}
              autoComplete={dialog.input.autoComplete}
              inputMode={dialog.input.inputMode}
              maxLength={dialog.input.maxLength}
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

        {/* On phones the buttons stack and the main action is on top
            (flex-col-reverse). From 640px up they sit in one row. */}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
          {/* The optional second action, kept apart from the danger button so
              it is not clicked by mistake. It leaves the dialog open. */}
          {dialog?.secondary ? (
            <button
              type="button"
              onClick={handleSecondary}
              disabled={busy}
              className="rounded-lg px-2 py-2 text-sm font-medium text-slate-700 underline hover:text-slate-900 hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:opacity-60 sm:mr-auto"
            >
              {dialog.secondary.label}
            </button>
          ) : null}
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:opacity-60"
          >
            {dialog?.cancelLabel ?? "Cancel"}
          </button>
          <button
            type="submit"
            disabled={blocked}
            className={`rounded-lg px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60 ${confirmStyle}`}
          >
            {busy ? "Working..." : (dialog?.confirmLabel ?? "Confirm")}
          </button>
        </div>
      </form>
    </dialog>
  );
}
