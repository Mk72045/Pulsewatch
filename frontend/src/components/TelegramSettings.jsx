import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext.jsx";
import { useConfirm } from "../context/ConfirmContext.jsx";
import {
  disconnectTelegram,
  sendTelegramTest,
  startTelegramLink,
} from "../services/notificationService.js";
import { handleApi } from "../utils/handleApi.js";

const smallButton =
  "rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-100 disabled:opacity-60";
const darkButton =
  "rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60";

export default function TelegramSettings() {
  const { user, refreshUser } = useAuth();
  const confirmAction = useConfirm();
  // The Telegram link, once the user has asked for one.
  const [linkUrl, setLinkUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const connected = user.telegramConnected;

  // After the link is shown, ask every 3 seconds whether Start was pressed.
  useEffect(() => {
    if (!linkUrl || connected) {
      return;
    }

    const timer = setInterval(async () => {
      const updated = await refreshUser();

      if (updated?.telegramConnected) {
        toast.success("Telegram connected");
        setLinkUrl("");
      }
    }, 3000);

    // The link is valid for 10 minutes, so stop asking after that.
    const giveUp = setTimeout(() => setLinkUrl(""), 10 * 60 * 1000);

    return () => {
      clearInterval(timer);
      clearTimeout(giveUp);
    };
  }, [linkUrl, connected, refreshUser]);

  async function handleConnect() {
    setBusy(true);

    const result = await handleApi(startTelegramLink);

    setBusy(false);

    if (result.ok) {
      setLinkUrl(result.data.url);
    }
  }

  async function handleTest() {
    setBusy(true);
    await handleApi(sendTelegramTest, {
      success: "Test message sent to Telegram",
    });
    setBusy(false);
  }

  async function handleDisconnect() {
    const confirmed = await confirmAction({
      title: "Disconnect Telegram?",
      message:
        "You will stop getting alerts on Telegram. Email alerts stay on.",
      confirmLabel: "Disconnect",
      tone: "danger",
    });

    if (!confirmed) {
      return;
    }

    setBusy(true);

    const result = await handleApi(disconnectTelegram, {
      success: "Telegram disconnected",
    });

    setBusy(false);

    if (result.ok) {
      await refreshUser();
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-medium">Telegram</h2>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            connected
              ? "bg-emerald-100 text-emerald-800"
              : "bg-slate-200 text-slate-700"
          }`}
        >
          {connected ? "Connected" : "Not connected"}
        </span>
      </div>
      <p className="mt-1 text-sm text-slate-600">
        Get an instant alert as a Telegram message on your phone. No phone
        number is needed.
      </p>

      {connected ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleTest}
            disabled={busy}
            className={smallButton}
          >
            Send test message
          </button>
          <button
            type="button"
            onClick={handleDisconnect}
            disabled={busy}
            className={`${smallButton} border-red-300 text-red-700 hover:bg-red-50`}
          >
            Disconnect
          </button>
        </div>
      ) : null}

      {!connected && !linkUrl ? (
        <button
          type="button"
          onClick={handleConnect}
          disabled={busy}
          className={`mt-3 ${darkButton}`}
        >
          Connect Telegram
        </button>
      ) : null}

      {!connected && linkUrl ? (
        <div className="mt-3 text-sm text-slate-600">
          <p>
            Open the link, then press Start in Telegram. This page updates by
            itself.
          </p>
          <a
            href={linkUrl}
            target="_blank"
            rel="noreferrer"
            className={`mt-2 inline-block ${darkButton}`}
          >
            Open Telegram
          </a>
        </div>
      ) : null}
    </div>
  );
}
