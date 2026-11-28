import { Link } from "react-router-dom";
import NavIcon from "../navbar/NavIcon.jsx";

const privateLinks = [
  { label: "Dashboard", to: "/dashboard" },
  { label: "Incidents", to: "/incidents" },
  { label: "Profile", to: "/profile" },
  { label: "Settings", to: "/settings" },
];

const publicLinks = [
  { label: "Log in", to: "/login" },
  { label: "Register", to: "/register" },
];

const focusRing =
  "rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600";

export default function Footer({ user }) {
  const links = user ? privateLinks : publicLinks;

  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-3xl px-4 py-8 md:px-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-xs">
            <Link
              to="/"
              className={`inline-flex items-center gap-2 font-semibold text-slate-900 ${focusRing}`}
            >
              <span className="grid h-7 w-7 place-items-center rounded-md bg-slate-900 text-white">
                <NavIcon name="pulse" className="h-4 w-4" />
              </span>
              Pulsewatch
            </Link>
            <p className="mt-3 text-sm text-slate-500">
              Know when your site goes down, before your users do.
            </p>
          </div>

          <nav aria-label="Footer">
            <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              {links.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className={`text-slate-600 transition-colors hover:text-slate-900 hover:underline ${focusRing}`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-8 flex flex-col gap-1 border-t border-slate-200 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} Pulsewatch</p>
          <p>Built with the MERN stack</p>
        </div>
      </div>
    </footer>
  );
}