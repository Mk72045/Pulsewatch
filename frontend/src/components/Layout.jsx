import { Link, Outlet } from "react-router-dom";

// Shared frame for every page. Outlet is where the matched page is drawn.
export default function Layout() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link to="/" className="font-semibold">
            CloudOps Monitor
          </Link>
          <Link to="/" className="text-sm text-slate-600">
            Home
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
