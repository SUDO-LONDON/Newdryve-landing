export default function DeniedPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 hero-bg">
      <div className="w-full max-w-md rounded-2xl border border-border bg-white/80 backdrop-blur p-8 text-center shadow-sm">
        <h1 className="font-display text-2xl text-ink">Access denied</h1>
        <p className="text-sm text-ink-secondary mt-3">
          Your account is authenticated but not on the Newdryve founder allowlist, so it cannot
          access the Ops Portal. If you believe this is a mistake, contact a founder.
        </p>
        <form action="/ops/auth/signout" method="post" className="mt-6">
          <button
            type="submit"
            className="rounded-lg border border-border bg-white px-4 py-2 text-sm text-ink hover:bg-blush-surface"
          >
            Sign out
          </button>
        </form>
      </div>
    </main>
  );
}
