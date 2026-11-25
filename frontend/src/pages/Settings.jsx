import PasswordSettings from "../components/PasswordSettings.jsx";
import StatusPageSettings from "../components/StatusPageSettings.jsx";
import TelegramSettings from "../components/TelegramSettings.jsx";
import TrashIcon from "../components/TrashIcon.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useConfirm } from "../context/ConfirmContext.jsx";
import { requestDeleteCode } from "../services/authService.js";
import { handleApi } from "../utils/handleApi.js";

export default function Settings() {
  const { user, deleteAccount, deleteAccountWithCode } = useAuth();
  const confirmAction = useConfirm();
  // Accounts made with Google may have no password. Those can still be
  // deleted, by proving the email address with a code instead.
  const hasPassword = user.hasPassword;

  // The password (or the emailed code) is the extra step: a wrong one is
  // reported inside the same dialog, and a correct one deletes the account
  // and logs the browser out.
  async function handleDeleteAccount() {
    const options = {
      title: "Delete your account?",
      message: `This permanently deletes your account, ${user.name}, along with your monitors, their history and all incidents. Your inbox and Telegram will stop receiving alerts. This cannot be undone.`,
      confirmLabel: "Delete account",
      tone: "danger",
    };

    if (hasPassword) {
      await confirmAction({
        ...options,
        input: {
          label: "Confirm your password",
          type: "password",
          autoComplete: "current-password",
        },
        action: (password) => deleteAccount(password),
      });
      return;
    }

    // No password to type. Prove the mailbox instead: the dialog asks for the
    // address's code, and its second action sends that code.
    await confirmAction({
      ...options,
      message: `${options.message} We will email a 6-digit code to ${user.email} to confirm it is you.`,
      input: {
        label: "Code from the email",
        type: "text",
        autoComplete: "one-time-code",
        inputMode: "numeric",
        maxLength: 6,
      },
      action: (code) => deleteAccountWithCode(code),
      secondary: {
        label: "Email me a code",
        run: async () => {
          const result = await handleApi(requestDeleteCode, {
            success: "A code is on its way to your email",
            showError: false,
          });

          return result.ok
            ? { ok: true }
            : { ok: false, error: result.error.message };
        },
      },
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
        <PasswordSettings />
        <StatusPageSettings />

        {/* Kept apart from the alert settings, so it is not clicked by mistake. */}
        <div className="rounded-lg border border-red-200 bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-medium text-red-700">Delete account</h2>
              <p className="mt-1 text-sm text-slate-600">
                Permanently remove your account, monitors, history and
                incidents. This cannot be undone.
              </p>
              {!hasPassword ? (
                <p className="mt-2 text-xs text-slate-600">
                  This account has no password, so we email a code to confirm it
                  is you. You can also add a password above.
                </p>
              ) : null}
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
