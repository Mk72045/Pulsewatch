import { Link, useLocation } from "react-router-dom";
import { isActivePath } from "../../utils/isActivePath.js";
import NavIcon from "./NavIcon.jsx";

const NavItem = ({
  to,
  paths = [to],
  icon,
  iconOnDesktop = false,
  onClick,
  className = "",
  children,
}) => {
  const { pathname } = useLocation();
  const active = isActivePath(pathname, paths);

  const colors = active
    ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900";

  return (
    <Link
      to={to}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 ${colors} ${className}`}
    >
      {icon && (
        <NavIcon
          name={icon}
          className={`h-5 w-5 ${iconOnDesktop ? "" : "md:hidden"} ${active ? "text-emerald-600" : "text-slate-400"}`}
        />
      )}
      {children}
      {/* The dot is a drawer detail, so it is hidden from tablet width up. */}
      {icon && active && (
        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-500 md:hidden" />
      )}
    </Link>
  );
};

export default NavItem;
