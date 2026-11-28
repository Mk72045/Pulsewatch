import { useEffect, useState } from "react";
import {
  fetchStatusSettings,
  updateStatusSettings,
} from "../services/statusService.js";
import { handleApi } from "../utils/handleApi.js";

// The public address is built from the current origin, so it points at the
// frontend the user is already using, whether that is localhost or production.
function publicUrl(token) {
  return `${window.location.origin}/status/${token}`;
}

const actionButton =
  "rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-100 disabled:opacity-60";

export default function StatusPageSettings() {
  const [settings, setSettings] = useState(null);
  const [loadState, setLoadState] = useState("loading");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function load() {
      const result = await handleApi(fetchStatusSettings, { showError: false });

      if (result.ok) {
        setSettings(result.data);
        setLoadState("ready");
      } else {
        setLoadState("error");
      }
    }

    load();
  }, []);

  async function handleToggle() {
    setBusy(true);

    const next = !settings.enabled;
    const result = await handleApi(() => updateStatusSettings(next), {
      success: next ? "Status page turned on" : "Status page turned off",
    });

    setBusy(false);

    if (result.ok) {
      setSettings(result.data);
      setCopied(false);
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(publicUrl(settings.token));
      setCopied(true);
      // Falls back to the label after a moment, so the tick is not permanent.
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be refused. The address is on screen and selectable,
      // so the user can still copy it by hand.
      setCopied(false);
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-medium">Public status page</h2>
          <p className="mt-1 text-sm text-slate-600">
            A page you can share with anyone. It shows monitor names, urls and
            status. No login needed, and nothing private is shown.
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
            settings?.enabled
              ? "bg-emerald-100 text-emerald-800"
              : "bg-slate-200 text-slate-700"
          }`}
        >
          {loadState === "ready" ? (settings.enabled ? "On" : "Off") : "—"}
        </span>
      </div>

      {loadState === "error" ? (
        <p className="mt-3 text-sm text-slate-600">
          Could not load this setting. Reload the page to try again.
        </p>
      ) : null}

      {loadState === "ready" && settings.enabled ? (
        <div className="mt-3">
          <label
            htmlFor="public-status-url"
            className="text-xs font-medium text-slate-500"
          >
            Share this address
          </label>
          <div className="mt-1 flex flex-wrap gap-2">
            <input
              id="public-status-url"
              readOnly
              value={publicUrl(settings.token)}
              onFocus={(event) => event.target.select()}
              className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700"
            />
            <button type="button" onClick={handleCopy} className={actionButton}>
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      ) : null}

      {loadState === "ready" ? (
        <button
          type="button"
          onClick={handleToggle}
          disabled={busy}
          className={`mt-3 ${actionButton}`}
        >
          {busy
            ? "Working..."
            : settings.enabled
              ? "Turn status page off"
              : "Turn status page on"}
        </button>
      ) : null}
    </div>
  );
}
