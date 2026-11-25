import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import EditMonitor from "./pages/EditMonitor.jsx";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import LoginWithCode from "./pages/LoginWithCode.jsx";
import NewMonitor from "./pages/NewMonitor.jsx";
import MonitorDetail from "./pages/MonitorDetail.jsx";
import NotFound from "./pages/NotFound.jsx";
import PublicStatus from "./pages/PublicStatus.jsx";
import Register from "./pages/Register.jsx";
import Settings from "./pages/Settings.jsx";
import Incidents from "./pages/Incidents.jsx";
import VerifyEmail from "./pages/VerifyEmail.jsx";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/login/code" element={<LoginWithCode />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/monitors/new" element={<NewMonitor />} />
          <Route path="/monitors/:id" element={<MonitorDetail />} />
          <Route path="/monitors/:id/edit" element={<EditMonitor />} />
          <Route path="/incidents" element={<Incidents />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
        {/* Public: no login, so it sits outside ProtectedRoute. */}
        <Route path="/status/:token" element={<PublicStatus />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
