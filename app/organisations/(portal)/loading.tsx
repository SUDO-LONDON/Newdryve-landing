/**
 * Shown the moment a portal tab is opened, while its page waits on the API.
 * Without it a click did nothing visible for the two to five seconds the
 * server took, and the tabs read as broken rather than slow.
 */
export default function PortalLoading() {
  return (
    <div className="space-y-6" aria-label="Loading" aria-busy="true">
      <div>
        <div className="h-3 w-20 animate-pulse rounded bg-border/50" />
        <div className="mt-2 h-8 w-48 animate-pulse rounded bg-border/70" />
        <div className="mt-3 h-4 w-80 max-w-full animate-pulse rounded bg-border/50" />
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
