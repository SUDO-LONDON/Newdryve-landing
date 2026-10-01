'use client';

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Logo } from './SiteNav';

const APP_URL = 'https://app.newdryve.com/';

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-racing-green focus-visible:ring-offset-2 focus-visible:ring-offset-white';

type AppHandoffModalProps = {
  open: boolean;
  onClose: () => void;
};

/**
 * Desktop-only handoff for the "Join the app" CTA. Newdryve is a phone app, so
 * instead of dropping desktop visitors onto the narrow mobile view we invite
 * them to scan a QR and open it on their phone — with an honest escape hatch to
 * open it here anyway.
 */
export function AppHandoffModal({ open, onClose }: AppHandoffModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Esc to close, lock background scroll, move focus in, restore it on close.
  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      // Minimal focus trap: keep Tab within the dialog.
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled])',
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', onKeyDown);
    closeRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = overflow;
      previouslyFocused?.focus?.();
    };
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-5"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm motion-safe:animate-[fadeIn_150ms_ease-out]" aria-hidden="true" />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="app-handoff-title"
        aria-describedby="app-handoff-desc"
        className="relative w-full max-w-sm rounded-3xl bg-white p-7 text-center shadow-[0_24px_60px_-20px_rgba(0,0,0,0.35)] border border-[#E8E8F2]"
      >
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close"
          className={`absolute right-4 top-4 inline-flex size-9 items-center justify-center rounded-full text-ink-secondary hover:bg-[#F3F3F8] hover:text-ink motion-safe:transition-colors ${focusRing}`}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          </svg>
        </button>

        <Logo size={20} />

        <h2
          id="app-handoff-title"
          className="font-display mt-4 text-[26px] font-semibold leading-tight tracking-[-0.5px]"
        >
          Built for your phone
        </h2>
        <p id="app-handoff-desc" className="mt-2 text-sm text-ink-secondary leading-relaxed">
          Scan to open Newdryve on your phone, or head to{' '}
          <span className="font-semibold text-ink">app.newdryve.com</span> on mobile.
        </p>

        <div className="mx-auto mt-6 w-fit rounded-2xl bg-white p-4 border border-[#E8E8F2] shadow-[0_8px_24px_-16px_rgba(0,0,0,0.25)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/qr-app.svg" alt="QR code linking to app.newdryve.com" width={180} height={180} className="block size-[180px]" />
        </div>

        <a
          href={APP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={`mt-6 inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-ink-secondary hover:text-ink motion-safe:transition-colors rounded-md px-3 py-2 ${focusRing}`}
        >
          Open it on this device anyway
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path
              d="M3 9L9 3M9 3H4.5M9 3V7.5"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </a>

        <div className="mt-6 border-t border-[#E8E8F2] pt-5">
          <a
            href="https://play.google.com/store/apps/details?id=com.newdryve.app&hl=en_GB"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Get Newdryve on Google Play"
            className={`inline-flex rounded-lg motion-safe:transition-transform motion-safe:hover:-translate-y-0.5 ${focusRing}`}
          >
            {/* Official Google Play badge; the transparent border is Google's
                mandated clear space, so it is used unmodified. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/google-play-badge.png" alt="Get it on Google Play" width={168} height={65} className="h-[65px] w-auto" />
          </a>
          <p className="mt-1 text-xs text-ink-muted">iOS app coming very soon.</p>
        </div>
      </div>
    </div>,
    document.body,
  );
}
