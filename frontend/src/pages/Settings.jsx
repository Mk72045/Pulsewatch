import TelegramSettings from "../components/TelegramSettings.jsx";
import TrashIcon from "../components/TrashIcon.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useConfirm } from "../context/ConfirmContext.jsx";

export default function Settings() {
  const { user, deleteAccount } = useAuth();
  const confirmAction = useConfirm();

  // The password is the extra step: a wrong one is reported inside the same
  // dialog, and a correct one deletes the account and logs the browser out.
  async function handleDeleteAccount() {
    await confirmAction({
      title: "Delete your account?",
      message: `This permanently deletes your account, ${user.name}, along with your monitors, their history and all incidents. Your inbox and Telegram will stop receiving alerts. This cannot be undone.`,
      confirmLabel: "Delete account",
      tone: "danger",
      input: {
        label: "Confirm your password",
        type: "password",
        autoComplete: "current-password",
      },
      action: (password) => deleteAccount(password),
    });

    // On success the user is now logged out, so ProtectedRoute sends the
    // browser to /login by itself. On cancel nothing has changed.
  }

  return (
    <section>
      <h1 className="text-2xl font-semibold">Alert settings</h1>
      <p className="mt-1 text-sm text-slate-600">
        Pulsewatch tells you here when a monitor goes down or comes back up.
      </p>

      <div className="mt-6 max-w-lg space-y-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="font-medium">Email</h2>
          <p className="mt-1 text-sm text-slate-600">
            Alerts go to {user.email}. This channel is always on.
          </p>
        </div>
        <TelegramSettings />

        {/* Kept apart from the alert settings, so it is not clicked by mistake. */}
        <div className="rounded-lg border border-red-200 bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-medium text-red-700">Delete account</h2>
              <p className="mt-1 text-sm text-slate-600">
                Permanently remove your account, monitors, history and
                incidents. This cannot be undone.
              </p>
            </div>

            {/* Icon only, with the label shown on hover and on keyboard focus. */}
            <div className="group relative shrink-0">
              <button
                type="button"
                onClick={handleDeleteAccount}
                aria-label="Delete account"
                className="rounded-lg border border-red-300 p-2 text-red-700 hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2"
              >
                <TrashIcon />
              </button>
              <span
                role="tooltip"
                className="pointer-events-none absolute right-0 top-full z-10 mt-2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
              >
                Delete account
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
