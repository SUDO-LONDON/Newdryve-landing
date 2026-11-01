"use client";

import { useState } from "react";
import { apiError, readJson } from "@/lib/organisations/http";
import {
  PROMOTION_DESCRIPTION_MAX,
  PROMOTION_MAX_HOURS,
  PROMOTION_TITLE_MAX,
  currentPromotion,
  describePromotion,
  draftFromPromotion,
  emptyDraft,
  promotionInputFromDraft,
  promotionPatch,
  promotionState,
  type Promotion,
  type PromotionDraft,
} from "@/lib/organisations/promotions";

const input =
  "focus-ring w-full rounded-xl border border-border bg-white px-3 py-2.5 text-base text-ink sm:text-sm";
const label = "text-xs font-bold uppercase tracking-[0.5px] text-ink-secondary";

export interface PromotionsPanelProps {
  /** Whose offers these are, for the form's accessible name. */
  name: string;
  /** Null when the offers could not be read; the panel then says so and will not write. */
  promotions: Promotion[] | null;
  error?: string | null;
  /**
   * The school's own portal names the school in every write (an admin of
   * several schools); ops never does, because the ops body is strict.
   */
  audience: "school" | "ops";
  organisationId?: string;
  endpoints: { create: string; update: (promotionId: string) => string };
  /** Draw the panel's own box. Off when it sits inside a section that has one. */
  framed?: boolean;
}

type Busy = "save" | "end" | null;

/**
 * One school's intro offer: the current one (live or scheduled) edited in
 * place and endable, or a form to start one; past offers listed below. The
 * same panel serves the school's portal and Newdryve ops, which differ only
 * in the routes they write through and whether the body names the school.
 */
export default function PromotionsPanel({
  name,
  promotions,
  error,
  audience,
  organisationId,
  endpoints,
  framed = true,
}: PromotionsPanelProps) {
  const [items, setItems] = useState<Promotion[] | null>(promotions);
  const current = items ? currentPromotion(items) : null;
  const [draft, setDraft] = useState<PromotionDraft>(() => (current ? draftFromPromotion(current) : emptyDraft()));
  const [busy, setBusy] = useState<Busy>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(
    items ? null : { ok: false, text: error || "Could not load the offers. Reload to try again." }
  );

  const scoped = (body: Record<string, unknown>) =>
    audience === "school" && organisationId ? { organisation_id: organisationId, ...body } : body;

  async function send(url: string, method: "POST" | "PATCH", body: Record<string, unknown>, fallback: string): Promise<Promotion> {
    const res = await fetch(url, {
      method,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(scoped(body)),
    });
    const json = await readJson(res);
    if (!res.ok) throw new Error(apiError(json, res.status, fallback).message);
    const promotion = (json as { promotion?: Promotion } | null)?.promotion;
    if (!promotion) throw new Error(fallback);
    return promotion;
  }

  function keep(promotion: Promotion) {
    setItems((list) => [promotion, ...(list ?? []).filter((p) => p.id !== promotion.id)]);
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);
    const checked = promotionInputFromDraft(draft);
    if (!checked.ok) {
      setMessage({ ok: false, text: checked.error });
      return;
    }
    setBusy("save");
    try {
      if (current) {
        const patch = promotionPatch(current, checked.input);
        if (!Object.keys(patch).length) {
          setMessage({ ok: false, text: "Nothing has changed." });
          return;
        }
        const saved = await send(endpoints.update(current.id), "PATCH", patch, "Could not save the offer.");
        keep(saved);
        setDraft(draftFromPromotion(saved));
        setMessage({
          ok: true,
          text: "Saved. Lessons booked through the school from now on use this offer; lessons already booked keep their price.",
        });
      } else {
        const saved = await send(endpoints.create, "POST", { ...checked.input }, "Could not start the offer.");
        keep(saved);
        setDraft(draftFromPromotion(saved));
        setMessage({
          ok: true,
          text: saved.live
            ? "The offer is live. Learners booking through the school now get this rate."
            : "Saved. The offer starts on its start date.",
        });
      }
    } catch (cause) {
      setMessage({ ok: false, text: cause instanceof Error ? cause.message : "Could not save the offer." });
    } finally {
      setBusy(null);
    }
  }

  async function end() {
    if (!current) return;
    const sure = window.confirm(
      `End "${current.title}"? New bookings stop getting the rate at once. Lessons already booked keep their price.`
    );
    if (!sure) return;
    setMessage(null);
    setBusy("end");
    try {
      const ended = await send(endpoints.update(current.id), "PATCH", { active: false }, "Could not end the offer.");
      keep(ended);
      setDraft(emptyDraft());
      setMessage({ ok: true, text: "Offer ended. Lessons already booked keep the price they were booked at." });
    } catch (cause) {
      setMessage({ ok: false, text: cause instanceof Error ? cause.message : "Could not end the offer." });
    } finally {
      setBusy(null);
    }
  }

  const past = (items ?? []).filter((p) => !p.active);
  const preview = promotionInputFromDraft(draft);
  const state = current ? promotionState(current) : null;
  const setBy = current
    ? current.updated_by_email
      ? ` · set by ${current.updated_by_email}`
      : current.updated_by === "newdryve"
        ? " · set by Newdryve"
        : ""
    : "";

  return (
    <div className={framed ? "rounded-2xl border border-border bg-white p-4 sm:p-6" : ""}>
      {current && state ? (
        <div className="mb-4 rounded-xl border border-border bg-canvas px-4 py-3">
          <p className="text-[11px] uppercase tracking-wider text-ink-muted">Current offer</p>
          <p className="mt-0.5 text-sm font-semibold text-ink">
            {current.title} · {describePromotion(current)}
          </p>
          <p className="mt-0.5 text-xs text-ink-muted">
            <span
              className={
                state.tone === "live"
                  ? "font-semibold text-racing-green"
                  : state.tone === "scheduled"
                    ? "font-semibold text-amber-800"
                    : ""
              }
            >
              {state.label}
            </span>
            {setBy}
          </p>
        </div>
      ) : items ? (
        <p className="mb-4 text-sm text-ink-secondary">
          No intro offer at the moment. Learners pay each instructor&rsquo;s normal price.
        </p>
      ) : null}

      <form onSubmit={save} aria-label={`Intro offer for ${name}`} className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <span className={label}>Title</span>
          <input
            className={input}
            value={draft.title}
            maxLength={PROMOTION_TITLE_MAX}
            onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={label}>Hours covered</span>
          <input
            className={input}
            type="number"
            inputMode="numeric"
            min={1}
            max={PROMOTION_MAX_HOURS}
            step={1}
            value={draft.hours}
            onChange={(e) => setDraft((d) => ({ ...d, hours: e.target.value }))}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={label}>Price per hour (£)</span>
          <input
            className={input}
            inputMode="decimal"
            value={draft.price_per_hour}
            onChange={(e) => setDraft((d) => ({ ...d, price_per_hour: e.target.value }))}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={label}>Starts on (optional)</span>
          <input
            className={input}
            type="date"
            value={draft.starts_on}
            onChange={(e) => setDraft((d) => ({ ...d, starts_on: e.target.value }))}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={label}>Last day (optional)</span>
          <input
            className={input}
            type="date"
            value={draft.ends_on}
            onChange={(e) => setDraft((d) => ({ ...d, ends_on: e.target.value }))}
          />
        </label>
        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <span className={label}>Description (optional)</span>
          <textarea
            className={input}
            rows={2}
            maxLength={PROMOTION_DESCRIPTION_MAX}
            value={draft.description}
            onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
          />
        </label>
        {preview.ok ? (
          <p className="text-sm text-ink-secondary sm:col-span-2">
            {describePromotion(preview.input)} for each learner&rsquo;s first lessons booked through the school. Hours
            already booked with the school count towards it; mock tests are never included.
          </p>
        ) : null}
        {message ? (
          <p
            role={message.ok ? "status" : "alert"}
            className={`rounded-xl px-4 py-3 text-sm sm:col-span-2 ${message.ok ? "bg-emerald-50 font-semibold text-emerald-900" : "bg-rose-50 text-rose-800"}`}
          >
            {message.text}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-3 sm:col-span-2">
          <button
            type="submit"
            // Never write over offers that could not be read.
            disabled={busy !== null || !items}
            className="focus-ring inline-flex min-h-12 items-center justify-center rounded-full bg-racing-green px-6 text-sm font-bold text-white disabled:opacity-60"
          >
            {busy === "save" ? "Saving…" : current ? "Save changes" : "Start intro offer"}
          </button>
          {current ? (
            <button
              type="button"
              onClick={end}
              disabled={busy !== null}
              className="focus-ring inline-flex min-h-12 items-center justify-center rounded-full border border-border bg-white px-6 text-sm font-bold text-ink disabled:opacity-60"
            >
              {busy === "end" ? "Ending…" : "End offer"}
            </button>
          ) : null}
        </div>
      </form>

      {past.length ? (
        <div className="mt-5 border-t border-border pt-4">
          <p className={label}>Past offers</p>
          <ul className="mt-2 space-y-1.5 text-sm text-ink-secondary">
            {past.map((p) => (
              <li key={p.id}>
                {p.title} · {describePromotion(p)} · {promotionState(p).label}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
