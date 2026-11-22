import { Link } from "react-router-dom";

const Navbar = ({ user, handleLogout }) => {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <Link to="/" className="font-semibold">
          Pulsewatch
        </Link>
        <nav className="flex items-center gap-4 text-sm text-slate-600">
          {user ? (
            <>
              <Link to="/dashboard">Dashboard</Link>
              <Link to="/incidents">Incidents</Link>
              <Link to="/settings">Settings</Link>
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
  );
};

export default Navbar;
