export default function OpsLoading() {
  return (
    <div className="space-y-6" aria-label="Loading">
      <div>
        <div className="h-8 w-48 animate-pulse rounded bg-border/70" />
        <div className="mt-2 h-4 w-72 max-w-full animate-pulse rounded bg-border/50" />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="rounded-xl border border-border bg-white p-4">
            <div className="h-3 w-24 animate-pulse rounded bg-border/50" />
            <div className="mt-3 h-7 w-12 animate-pulse rounded bg-border/70" />
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-white p-4">
        <div className="h-5 w-40 animate-pulse rounded bg-border/70" />
        <div className="mt-4 space-y-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="h-10 animate-pulse rounded bg-border/40" />
          ))}
        </div>
      </div>
    </div>
  );
}
