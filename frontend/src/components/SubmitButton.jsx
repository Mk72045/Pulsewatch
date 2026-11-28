// The main button of a form. While `loading` it is disabled
// and shows a spinner with `loadingText`.
export default function SubmitButton({
  loading = false,
  loadingText,
  disabled = false,
  className = "",
  children,
}) {
  return (
    <button
      type="submit"
      disabled={loading || disabled}
      className={`flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      {loading ? (
        <>
          <span
            aria-hidden="true"
            className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
          />
          {loadingText}
        </>
      ) : (
        children
      )}
    </button>
  );
}
