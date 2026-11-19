import { useEffect, useRef } from "react";

// A centered modal built on the native <dialog> element. The browser handles
// the dark background, blocking the page behind and keeping Tab inside the box.
// `dialog` holds the text to show, or is null when nothing is open.
export default function ConfirmDialog({ dialog, onConfirm, onCancel }) {
  const ref = useRef(null);
  const isOpen = dialog !== null;

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

  return (
    <dialog
      ref={ref}
      aria-labelledby="confirm-title"
      aria-describedby="confirm-message"
      // A click on the dark area lands on the <dialog> itself, not on the box inside.
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onCancel();
        }
      }}
      // The Escape key. We close it ourselves, so there is only one way it closes.
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
      // m-auto: Tailwind resets margins, which would push the box to the top left.
      // The width follows the screen on phones and stops growing at max-w-md.
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-lg bg-white p-0 text-slate-900 shadow-xl backdrop:bg-slate-900/50"
    >
      <div className="p-6">
        <h2 id="confirm-title" className="text-lg font-semibold">
          {dialog?.title}
        </h2>
        <p id="confirm-message" className="mt-2 text-sm text-slate-600">
          {dialog?.message}
        </p>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-100"
          >
            {dialog?.cancelLabel ?? "Cancel"}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${confirmStyle}`}
          >
            {dialog?.confirmLabel ?? "Confirm"}
          </button>
        </div>
      </div>
    </dialog>
  );
}
