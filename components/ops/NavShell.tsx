"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BOARD_NAV } from "@/lib/ops/types";

const TOP_LINKS = [
  { href: "/ops", label: "Dashboard" },
  { href: "/ops#finance", label: "Funding & Spend" },
  { href: "/ops#kpis", label: "Weekly KPIs" },
  { href: "/ops/due", label: "Due & Overdue" },
  { href: "/ops/data-room", label: "Data Room" },
];

export default function NavShell({
  email,
  children,
}: {
  email: string | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/ops" ? pathname === "/ops" : pathname.startsWith(href);

  const nav = (
    <nav className="flex flex-col gap-6 p-4">
      <div className="flex flex-col gap-1">
        {TOP_LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            onClick={() => setOpen(false)}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              isActive(l.href)
                ? "bg-racing-green text-white"
                : "text-ink-secondary hover:bg-blush-surface hover:text-ink"
            }`}
          >
            {l.label}
          </Link>
        ))}
      </div>

      {BOARD_NAV.map((m) => (
        <div key={m.module} className="flex flex-col gap-1">
          <p className="px-3 text-[11px] font-semibold uppercase tracking-widest text-ink-muted">
            {m.moduleName}
          </p>
          {m.boards.map((b) => {
            const href = `${m.basePath}/${b.id}`;
            return (
              <Link
                key={b.id}
                href={href}
                onClick={() => setOpen(false)}
                className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                  pathname === href
                    ? "bg-blush-surface text-ink font-medium"
                    : "text-ink-secondary hover:bg-blush-surface hover:text-ink"
                }`}
              >
                {b.name}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen md:grid md:grid-cols-[16rem_1fr]">
      {/* Sidebar (desktop) */}
      <aside className="hidden md:flex md:flex-col border-r border-border bg-white/60">
        <div className="px-5 py-4 border-b border-border">
          <p className="text-xs font-semibold uppercase tracking-widest text-racing-green">
            Newdryve
          </p>
          <p className="font-display text-lg text-ink">Ops Portal</p>
        </div>
        <div className="flex-1 overflow-y-auto">{nav}</div>
        <div className="border-t border-border p-4">
          <p className="truncate text-xs text-ink-muted mb-2" title={email ?? undefined}>
            {email}
          </p>
          <form action="/ops/auth/signout" method="post">
            <button
              type="submit"
              className="w-full rounded-lg border border-border bg-white px-3 py-1.5 text-sm text-ink hover:bg-blush-surface"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden flex items-center justify-between border-b border-border bg-white/70 px-4 py-3">
        <p className="font-display text-ink">Ops Portal</p>
        <button
          onClick={() => setOpen((v) => !v)}
          className="rounded-lg border border-border px-3 py-1.5 text-sm"
          aria-expanded={open}
        >
          Menu
        </button>
      </div>
      {open && (
        <div className="md:hidden border-b border-border bg-white">
          {nav}
          <div className="p-4 border-t border-border">
            <p className="truncate text-xs text-ink-muted mb-2">{email}</p>
            <form action="/ops/auth/signout" method="post">
              <button
                type="submit"
                className="w-full rounded-lg border border-border bg-white px-3 py-1.5 text-sm text-ink"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      )}

      <main className="min-w-0 p-4 md:p-8">{children}</main>
    </div>
  );
}
