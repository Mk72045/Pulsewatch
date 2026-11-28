const AccountDetails = ({ user }) => {
  const rows = [{ label: "Email", value: user.email }];

  // Only shown when the backend sends it, so we never show a wrong value.
  if (typeof user.hasPassword === "boolean") {
    rows.push({
      label: "Password",
      value: user.hasPassword ? "Set" : "Not set",
    });
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white">
      <h2 className="border-b border-slate-200 px-5 py-4 text-base font-semibold text-slate-900">
        Account details
      </h2>

      <dl className="divide-y divide-slate-100">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex flex-col gap-1 px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
          >
            <dt className="text-sm text-slate-500">{row.label}</dt>
            <dd className="min-w-0 wrap-break-words text-sm font-medium text-slate-900">
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
};

export default AccountDetails;