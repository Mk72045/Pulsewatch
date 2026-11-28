import NavIcon from "../navbar/NavIcon.jsx";

export default function BackToTop() {
  function scrollUp() {
    // Smooth scrolling is skipped for people who asked for less motion.
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  }

  return (
    <button
      type="button"
      onClick={scrollUp}
      className="group inline-flex items-center gap-1.5 self-start rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-slate-400 hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 sm:self-auto"
    >
      Back to top
      <NavIcon
        name="arrow-up"
        className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 motion-reduce:transition-none"
      />
    </button>
  );
}