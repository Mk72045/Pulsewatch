import { Link } from "react-router-dom";
import Brand from "../navbar/Brand.jsx";
import NavIcon from "../navbar/NavIcon.jsx";
import BackToTop from "./BackToTop.jsx";
import FooterColumn from "./FooterColumn.jsx";
import FooterCta from "./FooterCta.jsx";
import {
  features,
  privateGroups,
  publicGroups,
  socials,
} from "./footerData.js";

export default function Footer({ user }) {
  const groups = user ? privateGroups : publicGroups;
  const socialLinks = socials.filter((item) => item.url);

  return (
    <footer className="relative isolate overflow-hidden bg-linear-to-b from-white via-white to-emerald-50">
      <div className="h-1 bg-linear-to-r from-emerald-400 via-sky-400 to-violet-400" />
      <div className="pointer-events-none absolute -left-24 top-24 -z-10 h-64 w-64 rounded-full bg-emerald-300/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-10 -right-24 -z-10 h-64 w-64 rounded-full bg-sky-300/20 blur-3xl" />
      <div className="mx-auto max-w-3xl px-4 py-10 md:px-6">
        <FooterCta user={user} />

        <div className="mt-10 grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2">
            <Link
              to="/"
              className="inline-block rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-600"
            >
              <Brand />
            </Link>
            <p className="mt-3 max-w-xs text-sm text-slate-500">
              Know when your site goes down, before your users do.
            </p>

            {socialLinks.length > 0 ? (
              <ul className="mt-4 flex gap-2">
                {socialLinks.map((item) => (
                  <li key={item.label}>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={item.label}
                      className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-500 transition hover:-translate-y-0.5 hover:border-emerald-300 hover:text-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 motion-reduce:transition-none"
                    >
                      <NavIcon name={item.icon} className="h-4 w-4" />
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          {groups.map((group) => (
            <FooterColumn
              key={group.title}
              title={group.title}
              links={group.links}
            />
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
            What Pulsewatch does
          </h2>
          <ul className="mt-3 grid gap-x-4 gap-y-1 sm:grid-cols-2">
            {features.map((feature) => (
              <li
                key={feature.text}
                className="flex items-center gap-3 rounded-lg p-2 text-sm text-slate-600 transition-colors hover:bg-slate-50"
              >
                <span
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${feature.chip}`}
                >
                  <NavIcon name={feature.icon} className="h-4 w-4" />
                </span>
                {feature.text}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500">
            &copy; {new Date().getFullYear()} Pulsewatch
          </p>
          <BackToTop />
        </div>
      </div>
    </footer>
  );
}
