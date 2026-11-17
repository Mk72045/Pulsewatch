import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

// Wrap pages that need a logged-in user. Outlet draws the page inside.
export default function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return <p className="text-slate-600">Loading...</p>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
