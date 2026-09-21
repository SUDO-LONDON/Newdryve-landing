/**
 * The single card layout every instructor onboarding page sits in.
 *
 * Ported from the Astro pages' shared markup so the migration is invisible to
 * an instructor mid-onboarding: same card, same tokens, same spacing. These
 * pages are noindex and reached only from a private email link, so they carry
 * no site nav — a half-onboarded instructor has nowhere useful to navigate to.
 */
import type { ReactNode } from "react";

export function Wordmark() {
  return (
    <span className="text-xl font-extrabold leading-none" translate="no">
      <span className="text-racing-green">newdr</span>
      <span className="text-deep-rose">y</span>
      <span className="text-racing-green">ve</span>
    </span>
  );
}

export function Shell({
  eyebrow,
  eyebrowTone = "green",
  title,
  children,
  align = "center",
}: {
  eyebrow?: string;
  eyebrowTone?: "green" | "rose";
  title: string;
  children?: ReactNode;
  align?: "center" | "left";
}) {
  return (
    <main className="mx-auto flex max-w-lg flex-col justify-center px-5 py-16 sm:py-24">
      <section
        className={`rounded-2xl border border-border bg-white p-7 shadow-[0_20px_50px_-30px_rgba(10,10,20,0.22)] sm:p-10 ${
          align === "center" ? "text-center" : ""
        }`}
      >
        <Wordmark />
        {eyebrow ? (
          <p
            className={`mt-6 text-[11px] font-bold uppercase tracking-[1px] ${
              eyebrowTone === "rose" ? "text-deep-rose-ink" : "text-racing-green"
            }`}
          >
            {eyebrow}
          </p>
        ) : null}
        <h1 className="font-display mt-3 text-3xl font-semibold text-ink">{title}</h1>
        {children}
      </section>
    </main>
  );
}

/** The one button treatment these pages use. */
export function PrimaryButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className="focus-ring mt-7 inline-flex h-12 w-full items-center justify-center rounded-full bg-racing-green px-6 text-sm font-bold text-white disabled:cursor-wait disabled:opacity-60"
    >
      {children}
    </button>
  );
}

export function PrimaryLink({
  children,
  href,
  disabled = false,
}: {
  children: ReactNode;
  href: string;
  disabled?: boolean;
}) {
  return (
    <a
      href={href}
      aria-disabled={disabled || undefined}
      className={`focus-ring mt-7 inline-flex h-12 items-center justify-center rounded-full bg-racing-green px-6 text-sm font-bold text-white ${
        disabled ? "pointer-events-none opacity-60" : ""
      }`}
    >
      {children}
    </a>
  );
}

/** Errors are announced, not just coloured — these pages are often read once. */
export function ErrorNote({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <p role="alert" className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800">
      {children}
    </p>
  );
}

export function Note({ children }: { children: ReactNode }) {
  return <p className="mt-5 text-xs leading-5 text-ink-muted">{children}</p>;
}

export function Body({ children }: { children: ReactNode }) {
  return <p className="mt-4 text-sm leading-6 text-ink-secondary">{children}</p>;
}
