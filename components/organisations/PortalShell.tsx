"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/organisations", label: "Overview" },
  { href: "/organisations/live", label: "Live" },
  { href: "/organisations/timesheets", label: "Timesheets" },
  { href: "/organisations/learners", label: "Learners" },
  { href: "/organisations/invoices", label: "Invoices" },
  { href: "/organisations/settings", label: "Settings" },
];

/** Header and section tabs for every signed-in portal page. Hidden when printing. */
export default function PortalShell({ email, children }: { email: string | null; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = (href: string) => (href === "/organisations" ? pathname === href : pathname.startsWith(href));

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <header className="border-b border-border bg-white print:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-5">
          <Link href="/organisations" className="focus-ring flex min-h-11 items-center gap-3 rounded-lg">
            <span className="text-lg font-extrabold leading-none" translate="no">
              <span className="text-racing-green">newdr</span>
              <span className="text-deep-rose">y</span>
              <span className="text-racing-green">ve</span>
            </span>
            <span className="hidden text-sm font-semibold text-ink-secondary sm:inline">Organisation portal</span>
          </Link>
          <div className="flex items-center gap-3">
            <p className="hidden max-w-[16rem] truncate text-xs text-ink-secondary md:block" title={email ?? undefined}>
              {email}
            </p>
            <form action="/organisations/auth/signout" method="post">
              <button className="focus-ring min-h-11 rounded-lg border border-border bg-white px-3 text-sm font-semibold text-ink hover:bg-blush-surface">
                Sign out
              </button>
            </form>
          </div>
        </div>
        <nav aria-label="Portal sections" className="mx-auto max-w-6xl overflow-x-auto px-2 sm:px-3">
          <ul className="flex min-w-max gap-1">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active(item.href) ? "page" : undefined}
                  className={`focus-ring flex min-h-11 items-center border-b-2 px-3 text-sm font-semibold ${
                    active(item.href)
                      ? "border-racing-green text-racing-green"
                      : "border-transparent text-ink-secondary hover:text-ink"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-5 sm:py-8 print:max-w-none print:p-0">{children}</div>
    </div>
  );
}

/** Section heading used at the top of each portal page. */
export function PageHeading({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="mb-6 print:hidden">
      {eyebrow ? (
        <p className="text-[11px] font-bold uppercase tracking-[1px] text-racing-green">{eyebrow}</p>
      ) : null}
      <h1 className="mt-1 font-display text-3xl text-ink">{title}</h1>
      {children ? <div className="mt-2 max-w-3xl text-sm leading-6 text-ink-secondary">{children}</div> : null}
    </div>
  );
}
