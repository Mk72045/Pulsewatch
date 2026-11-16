import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <section>
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="mt-2 text-slate-600">
        That address is not part of this app.
      </p>
      <Link to="/" className="mt-6 inline-block text-sky-700 underline">
        Back to home
      </Link>
    </section>
  );
}
