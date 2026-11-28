import { googleEnabled } from "../../utils/google.js";
import GoogleButton from "../GoogleButton.jsx";

// The Google button and an "or" line under it.
// Renders nothing when Google sign-in is not set up.
export default function GoogleSection({ onCredential, disabled }) {
  if (!googleEnabled) {
    return null;
  }

  return (
    <div className="space-y-4">
      <GoogleButton onCredential={onCredential} disabled={disabled} />
      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-slate-200" />
        <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
          or
        </span>
        <span className="h-px flex-1 bg-slate-200" />
      </div>
    </div>
  );
}