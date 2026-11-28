import { Link } from "react-router-dom";
import NavIcon from "./navbar/NavIcon.jsx";

export default function BackLink({ to, children }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
    >
      <NavIcon name="arrow-left" className="h-4 w-4" />
      {children}
    </Link>
  );
}