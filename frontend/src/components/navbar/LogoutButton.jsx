import NavIcon from "./NavIcon.jsx";

// "className" lets the caller change size and position (bar vs drawer).
const LogoutButton = ({ onClick, className = "" }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-red-50 hover:text-red-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 ${className}`}
  >
    <NavIcon name="logout" className="h-5 w-5 text-slate-400 md:hidden" />
    Log out
  </button>
);

export default LogoutButton;
