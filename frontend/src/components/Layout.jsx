import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { handleApi } from "../utils/handleApi.js";
import Navbar from "./Navbar";

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
      <Navbar user={user} handleLogout={handleLogout} />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
