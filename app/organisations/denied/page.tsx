export default function OrganisationsDeniedPage() {
  return (
    <main className="min-h-screen bg-canvas px-5 py-10 text-ink">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-md flex-col justify-center">
        <div className="rounded-3xl border border-border bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-racing-green">
            Newdryve organisations
          </p>
          <h1 className="mt-3 font-display text-3xl text-ink">No organisation access</h1>
          <p className="mt-2 text-sm text-ink-secondary">
            This account is signed in, but it is not linked to an organisation admin profile.
          </p>
          <form action="/organisations/auth/signout" method="post" className="mt-6">
            <button className="w-full rounded-xl bg-racing-green px-4 py-3 text-sm font-semibold text-white">
              Sign out and try another account
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
