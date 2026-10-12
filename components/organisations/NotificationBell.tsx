"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { NotificationsResponse, OrganisationNotification } from "@/lib/organisations/types";
import { shortDate, time } from "@/lib/organisations/format";
import { apiError, readJson } from "@/lib/organisations/http";

const PAGE_SIZE = 20;
const POLL_MS = 60_000;

/**
 * The header bell: instructors joining and leaving the school.
 *
 * Polls once a minute, and only while the tab is visible — a portal left open
 * in a background tab all day should not keep asking. Coming back to the tab
 * refreshes straight away. Read state is per admin login, so marking one read
 * here does not clear it for a colleague.
 */
export default function NotificationBell() {
  const [items, setItems] = useState<OrganisationNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [nextOffset, setNextOffset] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // A login the bell cannot serve (a super admin without a school chosen, or
  // a session that ended) hides it rather than showing a broken badge.
  const [hidden, setHidden] = useState(false);
  // Set once the admin has paged past the first page: a poll then keeps
  // those older items instead of collapsing the list back to one page.
  const extendedRef = useRef(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const headingId = useId();

  /** The first page and the unread count; keeps any older pages already loaded. */
  const refresh = useCallback(async () => {
    try {
      const response = await fetch(`/organisations/api/notifications?limit=${PAGE_SIZE}`, { cache: "no-store" });
      const body = await readJson(response);
      if (!response.ok) {
        if (response.status === 401 || response.status === 403 || response.status === 422) setHidden(true);
        else setError(apiError(body, response.status, "Could not load notifications.").message);
        return;
      }
      const page = body as NotificationsResponse;
      setHidden(false);
      setError(null);
      setUnread(page.unread_count);
      if (extendedRef.current) {
        // Older pages the admin already loaded stay put underneath.
        setItems((current) => {
          const fresh = new Set(page.items.map((n) => n.id));
          return [...page.items, ...current.filter((n) => !fresh.has(n.id))];
        });
      } else {
        setItems(page.items);
        setNextOffset(page.next_offset);
      }
    } catch {
      setError("Could not load notifications.");
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    const stop = () => {
      if (timer) clearInterval(timer);
      timer = null;
    };
    const start = () => {
      stop();
      void refresh();
      timer = setInterval(() => void refresh(), POLL_MS);
    };
    const onVisibility = () => (document.visibilityState === "visible" ? start() : stop());
    if (document.visibilityState === "visible") start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [refresh]);

  // Click outside or Escape closes, and Escape hands focus back to the bell.
  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target) || buttonRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.focus();
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function loadMore() {
    if (nextOffset == null) return;
    setLoadingMore(true);
    try {
      const response = await fetch(`/organisations/api/notifications?limit=${PAGE_SIZE}&offset=${nextOffset}`, { cache: "no-store" });
      const body = await readJson(response);
      if (!response.ok) {
        setError(apiError(body, response.status, "Could not load more notifications.").message);
        return;
      }
      const page = body as NotificationsResponse;
      extendedRef.current = true;
      setUnread(page.unread_count);
      setItems((current) => [...current, ...page.items.filter((n) => !current.some((c) => c.id === n.id))]);
      setNextOffset(page.next_offset);
    } catch {
      setError("Could not load more notifications.");
    } finally {
      setLoadingMore(false);
    }
  }

  async function markRead(notification: OrganisationNotification) {
    if (notification.read_at) return;
    const readAt = new Date().toISOString();
    // Optimistic: the API call is idempotent, and a failure puts it back.
    setItems((current) => current.map((n) => (n.id === notification.id ? { ...n, read_at: readAt } : n)));
    setUnread((n) => Math.max(0, n - 1));
    try {
      const response = await fetch(`/organisations/api/notifications/${notification.id}/read`, { method: "POST" });
      if (!response.ok) throw new Error(apiError(await readJson(response), response.status, "Could not mark that read.").message);
    } catch (cause) {
      setItems((current) => current.map((n) => (n.id === notification.id ? { ...n, read_at: null } : n)));
      setUnread((n) => n + 1);
      setError(cause instanceof Error ? cause.message : "Could not mark that read.");
    }
  }

  async function markAllRead() {
    setMarkingAll(true);
    setError(null);
    try {
      const response = await fetch("/organisations/api/notifications/read-all", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{}",
      });
      const body = await readJson(response);
      if (!response.ok) throw new Error(apiError(body, response.status, "Could not mark them read.").message);
      const readAt = new Date().toISOString();
      setItems((current) => current.map((n) => (n.read_at ? n : { ...n, read_at: readAt })));
      setUnread(0);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not mark them read.");
    } finally {
      setMarkingAll(false);
    }
  }

  if (hidden) return null;

  const badge = unread > 99 ? "99+" : String(unread);
  const label = unread > 0 ? `Notifications, ${unread} unread` : "Notifications";

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-label={label}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className="focus-ring relative inline-flex size-11 items-center justify-center rounded-lg border border-border bg-white text-ink hover:bg-blush-surface"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {unread > 0 ? (
          <span
            aria-hidden="true"
            className="absolute -right-1.5 -top-1.5 inline-flex min-w-5 items-center justify-center rounded-full bg-deep-rose px-1 text-[11px] font-bold leading-5 text-white"
          >
            {badge}
          </span>
        ) : null}
      </button>
      {/* Announces new arrivals from the poll without moving focus. */}
      <span className="sr-only" role="status" aria-live="polite">
        {loaded && unread > 0 ? `${unread} unread notification${unread === 1 ? "" : "s"}` : ""}
      </span>

      {open ? (
        <div
          ref={panelRef}
          id={panelId}
          role="dialog"
          aria-labelledby={headingId}
          className="absolute right-0 z-30 mt-2 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-border bg-white shadow-lg"
        >
          <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
            <h2 id={headingId} className="text-sm font-bold text-ink">
              Notifications
            </h2>
            <button
              type="button"
              onClick={() => void markAllRead()}
              disabled={unread === 0 || markingAll}
              className="focus-ring min-h-11 rounded-lg px-2 text-sm font-semibold text-racing-green disabled:text-ink-muted"
            >
              {markingAll ? "Marking…" : "Mark all as read"}
            </button>
          </div>

          {error ? (
            <p role="alert" className="mx-4 mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-800">
              {error}
            </p>
          ) : null}

          <div className="max-h-[min(28rem,70vh)] overflow-y-auto">
            {!loaded ? (
              <p className="px-4 py-8 text-center text-sm text-ink-secondary">Loading…</p>
            ) : items.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm font-semibold text-ink">No notifications yet</p>
                <p className="mt-1 text-sm text-ink-secondary">
                  You&rsquo;ll see instructors joining and leaving your organisation here.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {items.map((notification) => {
                  const isUnread = !notification.read_at;
                  return (
                    <li key={notification.id}>
                      <button
                        type="button"
                        onClick={() => void markRead(notification)}
                        className={`focus-ring flex w-full gap-3 px-4 py-3 text-left ${isUnread ? "bg-emerald-50/60 hover:bg-emerald-50" : "hover:bg-canvas"}`}
                      >
                        <span
                          aria-hidden="true"
                          className={`mt-1.5 size-2 shrink-0 rounded-full ${isUnread ? "bg-racing-green" : "bg-transparent"}`}
                        />
                        <span className="min-w-0">
                          {isUnread ? <span className="sr-only">Unread: </span> : null}
                          <span className={`block text-sm text-ink ${isUnread ? "font-bold" : "font-medium"}`}>{notification.title}</span>
                          <span className="mt-0.5 block text-xs text-ink-secondary">{notification.body}</span>
                          <span className="mt-1 block text-[11px] text-ink-muted">
                            {shortDate(notification.created_at)} · {time(notification.created_at)}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            {nextOffset != null ? (
              <div className="border-t border-border p-3 text-center">
                <button
                  type="button"
                  onClick={() => void loadMore()}
                  disabled={loadingMore}
                  className="focus-ring inline-flex min-h-11 items-center rounded-full border border-border px-4 text-sm font-semibold text-ink disabled:opacity-60"
                >
                  {loadingMore ? "Loading…" : "Show older"}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
