import { useEffect, useState } from "react";
import api from "../services/api.js";

export default function Home() {
  const [health, setHealth] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/api/v1/health")
      .then((response) => {
        setHealth(response.data);
      })
      .catch(() => {
        setError("Could not reach the API. Start the backend and try again.");
      });
  }, []);

  return (
    <section>
      <h1 className="text-2xl font-semibold">System health</h1>
      <p className="mt-2 text-slate-600">
        This page asks the API if the server, MongoDB, and Redis are up.
      </p>

      {error && <p className="mt-6 text-red-600">{error}</p>}

      {!health && !error ? <p className="mt-6">Loading...</p> : null}

      {health && (
        <pre className="mt-6 overflow-auto rounded-lg bg-slate-900 p-4 text-sm text-slate-100">
          {JSON.stringify(health, null, 2)}
        </pre>
      )}
    </section>
  );
}
