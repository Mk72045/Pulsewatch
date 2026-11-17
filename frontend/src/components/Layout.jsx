import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { handleApi } from "../utils/handleApi.js";

// Shared frame for every page. Outlet is where the matched page is drawn.
export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    const result = await handleApi(logout, {
      success: "Logged out successfully",
    });

    if (result.ok) {
      navigate("/login");
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link to="/" className="font-semibold">
            Pulsewatch
          </Link>
          <nav className="flex items-center gap-4 text-sm text-slate-600">
            {user ? (
              <>
                <Link to="/dashboard">Dashboard</Link>
                <button type="button" onClick={handleLogout}>
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link to="/login">Log in</Link>
                <Link to="/register">Register</Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
