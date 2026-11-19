// Grey blocks that stand in for the list while it loads.
export default function ListSkeleton() {
  return (
    <div role="status" className="space-y-3">
      <span className="sr-only">Loading monitors...</span>
      {[1, 2, 3].map((number) => (
        <div
          key={number}
          className="h-24 animate-pulse rounded-lg bg-slate-200"
        />
      ))}
    </div>
  );
}
