import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../services/api.js";

const primaryButton =
  "rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700";
const secondaryButton =
  "rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-100";

// The landing page. It says what Pulsewatch does, shows whether the API and
// database are reachable right now, and points at the next useful action.
export default function Home() {
  const { user } = useAuth();
  const [health, setHealth] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/api/v1/health")
      .then((response) => {
        setHealth(response.data.data ?? response.data);
      })
      .catch(() => {
        setError("Could not reach the API.");
      });
  }, []);

  const apiOk = Boolean(health);
  const dbOk = health?.mongodb === "connected";

  return (
    <section>
      <h1 className="text-3xl font-semibold tracking-tight">
        Know when your site goes down
      </h1>
      <p className="mt-2 max-w-xl text-slate-600">
        Pulsewatch checks your websites and APIs on a schedule. Two failed checks
        in a row open an incident and send you an email and a Telegram message.
        When the site recovers, the incident closes by itself.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {user ? (
          <Link to="/dashboard" className={primaryButton}>
            Go to dashboard
          </Link>
        ) : (
          <>
            <Link to="/register" className={primaryButton}>
              Create an account
            </Link>
            <Link to="/login" className={secondaryButton}>
              Log in
            </Link>
          </>
        )}
      </div>

      <div className="mt-8 rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-medium">System status</h2>

        {error ? (
          <p className="mt-2 text-sm text-red-700">{error}</p>
        ) : null}

        {!health && !error ? (
          <p className="mt-2 text-sm text-slate-500">Checking...</p>
        ) : null}

        {health ? (
          <ul className="mt-2 space-y-1 text-sm">
            <li className="flex items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full ${apiOk ? "bg-emerald-500" : "bg-red-500"}`}
              />
              API {apiOk ? "responded" : "did not respond"}
            </li>
            <li className="flex items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full ${dbOk ? "bg-emerald-500" : "bg-amber-500"}`}
              />
              Database {health.mongodb}
            </li>
            <li className="text-xs text-slate-500">
              Server uptime: {Math.floor(health.uptime / 60)} minutes
            </li>
          </ul>
        ) : null}
      </div>
    </section>
  );
}