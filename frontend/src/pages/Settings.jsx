import TelegramSettings from "../components/TelegramSettings.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function Settings() {
  const { user } = useAuth();

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
      </div>
    </section>
  );
}
