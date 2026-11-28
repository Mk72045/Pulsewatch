import { Link, useLocation } from "react-router-dom";
import { isActivePath } from "../../utils/isActivePath.js";
import NavIcon from "../navbar/NavIcon.jsx";

export default function FooterCta({ user }) {
  const { pathname } = useLocation();

  // No point asking someone to register while they are on the register page.
  const hiddenOn = user
    ? ["/monitors/new"]
    : ["/login", "/register", "/verify-email"];

  if (isActivePath(pathname, hiddenOn)) {
    return null;
  }

  const cta = user
    ? {
        title: "Watching something new?",
        text: "Add a website or an API and Pulsewatch starts checking it.",
        label: "Add monitor",
        to: "/monitors/new",
        icon: "plus",
      }
    : {
        title: "Start monitoring in minutes",
        text: "Create an account, add a URL and get alerted when it goes down.",
        label: "Create account",
        to: "/register",
        icon: "register",
      };

  return (
    <section className="relative isolate overflow-hidden rounded-2xl border border-emerald-100 bg-linear-to-br from-emerald-50 via-white to-slate-50 p-6 sm:flex sm:items-center sm:justify-between sm:gap-6">
      <div className="pointer-events-none absolute -right-10 -top-10 -z-10 h-40 w-40 rounded-full bg-emerald-300/20 blur-3xl" />

      <div>
        <h2 className="text-lg font-bold text-slate-900">{cta.title}</h2>
        <p className="mt-1 text-sm text-slate-600">{cta.text}</p>
      </div>

      <Link
        to={cta.to}
        className="group mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 sm:mt-0 sm:w-auto sm:shrink-0"
      >
        <NavIcon name={cta.icon} className="h-4 w-4" />
        {cta.label}
        <NavIcon
          name="arrow-right"
          className="h-4 w-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
        />
      </Link>
    </section>
  );
}