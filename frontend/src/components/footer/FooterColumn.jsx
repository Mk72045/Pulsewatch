import { Link } from "react-router-dom";
import NavIcon from "../navbar/NavIcon.jsx";

export default function FooterColumn({ title, links }) {
  return (
    <nav aria-label={title}>
      <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
        {title}
      </h2>
      <ul className="mt-3 space-y-2 text-sm">
        {links.map((link) => (
          <li key={link.to}>
            <Link
              to={link.to}
              className="group inline-flex items-center gap-1 rounded text-slate-600 transition-colors hover:text-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
            >
              {link.label}
              <NavIcon
                name="arrow-right"
                className="h-3.5 w-3.5 -translate-x-1 opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100 motion-reduce:transition-none"
              />
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}