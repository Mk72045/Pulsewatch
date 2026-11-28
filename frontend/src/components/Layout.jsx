import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useConfirm } from "../context/ConfirmContext.jsx";
import { handleApi } from "../utils/handleApi.js";
import Navbar from "./navbar";
import Footer from "./footer";

// Shared frame for every page. Outlet is where the matched page is drawn.
export default function Layout() {
  const { user, logout } = useAuth();
  const confirmAction = useConfirm();
  const navigate = useNavigate();

  // A stray click on "Log out" should not end the session, so ask first.
  // The tone is neutral: logging out changes nothing on the server.
  async function handleLogout() {
    const confirmed = await confirmAction({
      title: "Log out?",
      message: "You will need to log in again to see your monitors.",
      confirmLabel: "Log out",
    });

    if (!confirmed) {
      return;
    }

    const result = await handleApi(logout, {
      success: "Logged out successfully",
    });

    if (result.ok) {
      navigate("/login");
    }
  }

    return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <Navbar user={user} handleLogout={handleLogout} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <Outlet />
      </main>
      <Footer user={user} />
    </div>
  );
}
