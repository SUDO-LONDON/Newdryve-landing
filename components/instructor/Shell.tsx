/**
 * The frame and single card layout every instructor onboarding page sits in.
 *
 * An instructor arrives here from the redesigned apply form on the marketing
 * site, so these pages wear the same design: a paper pill header on a mint
 * band, a mint hero, then paper with forest-outlined cards. The styles live in
 * app/instructor-theme.css and only apply inside OnboardingFrame's
 * `.nd-theme` wrapper, because app/globals.css is shared with the ops and
 * organisations portals.
 *
 * These pages are noindex and reached only from a private email link, so they
 * carry no site nav. A half-onboarded instructor has nowhere useful to
 * navigate to.
 */
import type { ReactNode } from "react";
import { themeFontVariables } from "./fonts";
import "@/app/instructor-theme.css";

/** newdr<y>ve, typeset like the marketing site's wordmark. */
export function Wordmark() {
  return (
    <span className="nd-wordmark" translate="no">
      newdr<span className="nd-wordmark-y">y</span>ve
    </span>
  );
}

/**
 * The themed page: the `.nd-theme` wrapper with the redesign fonts, and the
 * header. `headerAside` sits at the right of the header pill.
 */
export function OnboardingFrame({
  children,
  headerAside,
}: {
  children: ReactNode;
  headerAside?: ReactNode;
}) {
  return (
    <div className={`nd-theme ${themeFontVariables}`}>
      <header className="nd-band pt-3 sm:pt-5">
        <div className="nd-container">
          <div className="nd-nav">
            <Wordmark />
            {headerAside}
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}

/** The step name above a page title. Rose marks something that went wrong. */
function Eyebrow({ children, tone }: { children: ReactNode; tone: "green" | "rose" }) {
  return tone === "rose" ? (
    <p>
      <span className="nd-tag nd-tag-pink">{children}</span>
    </p>
  ) : (
    <p className="nd-small-label">{children}</p>
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
  const centred = align === "center";
  return (
    <OnboardingFrame>
      <main className="flex flex-1 flex-col">
        <div className="nd-band pt-10 pb-12 sm:pt-14 sm:pb-16">
          <div className={`nd-container-narrow ${centred ? "text-center" : ""}`}>
            {eyebrow ? <Eyebrow tone={eyebrowTone}>{eyebrow}</Eyebrow> : null}
            <h1 className={`nd-h1 ${eyebrow ? "mt-3" : ""}`}>{title}</h1>
          </div>
        </div>
        <div className="nd-container-narrow py-10 sm:py-14">
          <section className={`nd-card-lg p-6 sm:p-9 ${centred ? "text-center" : ""}`}>
            {/* Page content opens with the top margin that used to follow the
                in-card title; the card's padding does that job now. */}
            <div className="[&>:first-child]:mt-0">{children}</div>
          </section>
        </div>
      </main>
    </OnboardingFrame>
  );
}

/** The one button treatment these pages use. */
export function PrimaryButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...props} className="nd-btn nd-btn-lg mt-7 w-full">
      {children}
    </button>
  );
}

export function PrimaryLink({
  children,
  href,
  disabled = false,
  variant = "primary",
}: {
  children: ReactNode;
  href: string;
  disabled?: boolean;
  variant?: "primary" | "secondary";
}) {
  return (
    <a
      href={href}
      aria-disabled={disabled || undefined}
      className={`nd-btn-lg w-full sm:w-auto ${
        variant === "primary" ? "nd-btn mt-7" : "nd-btn-secondary mt-3"
      } ${disabled ? "pointer-events-none" : ""}`}
    >
      {children}
    </a>
  );
}

/** Errors are announced, not just coloured. These pages are often read once. */
export function ErrorNote({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <p role="alert" className="nd-alert mt-5 text-left">
      {children}
    </p>
  );
}

export function Note({ children }: { children: ReactNode }) {
  return <p className="nd-help mt-5">{children}</p>;
}

export function Body({ children }: { children: ReactNode }) {
  return <p className="nd-body mt-4">{children}</p>;
}
