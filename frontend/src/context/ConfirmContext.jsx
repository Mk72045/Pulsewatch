import { createContext, useContext, useState } from "react";
import ConfirmDialog from "../components/ConfirmDialog.jsx";

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  // What the open dialog shows, plus the function that answers the promise.
  // It is null when no dialog is open.
  const [dialog, setDialog] = useState(null);

  // Use it like window.confirm: const ok = await confirmAction({ ... })
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

  return (
    <ConfirmContext.Provider value={confirmAction}>
      {children}
      <ConfirmDialog
        dialog={dialog}
        onConfirm={() => finish(true)}
        onCancel={() => finish(false)}
      />
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  return useContext(ConfirmContext);
}
