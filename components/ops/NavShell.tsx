"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BOARD_NAV } from "@/lib/ops/types";
import { OUTREACH, RUN_SECTIONS, TEAM_SECTIONS, TODAY, isOutreachPath, type OpsSection } from "@/lib/ops/nav";

// The sidebar: seven places, in three groups, with plain names. The nine
// outreach boards only unfold while you are in Outreach, so the list at rest
// fits on one screen and reads top to bottom as "what is where".
export default function NavShell({
  email,
  children,
}: {
  email: string | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  const isActive = (href: string) => (href === "/ops" ? pathname === "/ops" : pathname.startsWith(href));
  const inOutreach = isOutreachPath(pathname);

  const item = (section: OpsSection, active: boolean) => (
    <Link
      key={section.href}
      href={section.href}
      onClick={close}
      aria-current={active ? "page" : undefined}
      title={section.blurb}
      className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        active ? "bg-racing-green text-white" : "text-ink-secondary hover:bg-blush-surface hover:text-ink"
      }`}
    >
      {section.label}
    </Link>
  );

  const group = (heading: string, sections: OpsSection[]) => (
    <div className="flex flex-col gap-1">
      <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-widest text-ink-muted">{heading}</p>
      {sections.map((s) => item(s, isActive(s.href)))}
    </div>
  );

  const nav = (
    <nav className="flex flex-col gap-6 p-4" aria-label="Portal sections">
      {item(TODAY, isActive(TODAY.href))}

      {group("Run the business", RUN_SECTIONS)}

      <div className="flex flex-col gap-1">
        <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-widest text-ink-muted">Grow</p>
        {item(OUTREACH, inOutreach)}
        {inOutreach && (
          <div className="ml-3 mt-1 flex flex-col gap-3 border-l border-border pl-2">
            {BOARD_NAV.map((m) => (
              <div key={m.module} className="flex flex-col gap-0.5">
                <p className="px-2 text-[11px] font-semibold text-ink-muted">{m.moduleName}</p>
                {m.boards.map((b) => {
                  const href = `${m.basePath}/${b.id}`;
                  const active = pathname === href;
                  return (
                    <Link
                      key={b.id}
                      href={href}
                      onClick={close}
                      aria-current={active ? "page" : undefined}
                      className={`rounded-lg px-2 py-1 text-sm transition-colors ${
                        active ? "bg-blush-surface font-medium text-ink" : "text-ink-secondary hover:bg-blush-surface hover:text-ink"
                      }`}
                    >
                      {b.name}
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      {group("The company", TEAM_SECTIONS)}
    </nav>
  );

  const signOut = (
    <form action="/ops/auth/signout" method="post">
      <button
        type="submit"
        className="w-full rounded-lg border border-border bg-white px-3 py-1.5 text-sm text-ink hover:bg-blush-surface"
      >
        Sign out
      </button>
    </form>
  );

  return (
    <div className="min-h-screen md:grid md:grid-cols-[15rem_1fr]">
      {/* Sidebar (desktop) */}
      <aside className="hidden md:flex md:flex-col border-r border-border bg-white/60">
        <div className="px-5 py-4 border-b border-border">
          <p className="text-xs font-semibold uppercase tracking-widest text-racing-green">Newdryve</p>
          <p className="font-display text-lg text-ink">Ops</p>
        </div>
        <div className="flex-1 overflow-y-auto">{nav}</div>
        <div className="border-t border-border p-4">
          <p className="truncate text-xs text-ink-muted mb-2" title={email ?? undefined}>
            {email}
          </p>
          {signOut}
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden flex items-center justify-between border-b border-border bg-white/70 px-4 py-3">
        <p className="font-display text-ink">Newdryve Ops</p>
        {/* At phone and half-window widths the sidebar folds away; the button
            has to read as the way to every section (QA 29 Oct #40). */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-ink bg-ink px-4 py-2 text-sm font-semibold text-white"
          aria-expanded={open}
        >
          <span aria-hidden>{open ? "✕" : "☰"}</span>
          {open ? "Close menu" : "All sections"}
        </button>
      </div>
      {open && (
        <div className="md:hidden border-b border-border bg-white">
          {nav}
          <div className="p-4 border-t border-border">
            <p className="truncate text-xs text-ink-muted mb-2">{email}</p>
            {signOut}
          </div>
        </div>
      )}

      <main className="min-w-0 p-4 md:p-8">{children}</main>
    </div>
  );
}
