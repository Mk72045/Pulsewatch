import NavIcon from "../navbar/NavIcon.jsx";

// The shared look of the login, register and code pages.
// `footer` is shown under the card, `children` inside it.
export default function AuthCard({ icon, title, subtitle, footer, children }) {
  return (
    <section className="mx-auto w-full max-w-md py-4 sm:py-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col items-center text-center">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
            <NavIcon name={icon} className="h-6 w-6" />
          </span>
          <h1 className="mt-4 text-2xl font-bold text-slate-900">{title}</h1>
          {subtitle ? (
            <p className="mt-2 text-sm text-slate-600">{subtitle}</p>
          ) : null}
        </div>

        <div className="mt-6">{children}</div>
      </div>

      {footer ? (
        <div className="mt-4 space-y-2 text-center text-sm text-slate-600">
          {footer}
        </div>
      ) : null}
    </section>
  );
}