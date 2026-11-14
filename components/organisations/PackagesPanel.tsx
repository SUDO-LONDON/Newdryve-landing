"use client";

import { useState } from "react";
import { apiError, readJson } from "@/lib/organisations/http";
import {
  LESSON_TIMES,
  PACKAGE_CATEGORIES,
  PACKAGE_MAX_MONTHS,
  PACKAGE_NAME_MAX,
  describePackage,
  draftFromPackage,
  emptyPackageDraft,
  packageInputFromDraft,
  packagePatch,
  packagesByCategory,
  type LessonTime,
  type PackageCategory,
  type PackageDraft,
  type SchoolPackage,
  type Transmission,
} from "@/lib/organisations/packages";
import { hourly } from "@/lib/organisations/promotions";

const input = "focus-ring w-full rounded-xl border border-border bg-white px-3 py-2.5 text-base text-ink sm:text-sm";
const label = "text-xs font-bold uppercase tracking-[0.5px] text-ink-secondary";
const quiet =
  "focus-ring inline-flex min-h-11 items-center rounded-full border border-border bg-white px-4 text-sm font-semibold text-ink hover:bg-blush-surface disabled:opacity-60";

export interface PackagesPanelProps {
  organisationId: string;
  packages: SchoolPackage[];
}

/**
 * What the school sells: the list its office picks from in WhatsApp when a
 * caller has paid. Add a package, change one, or take one off sale. Nothing a
 * learner already bought changes: their hours are a copy made at the sale.
 */
export default function PackagesPanel({ organisationId, packages }: PackagesPanelProps) {
  const [items, setItems] = useState<SchoolPackage[]>(packages);
  /** The package being edited, "new" for a new one, or null with the form shut. */
  const [editing, setEditing] = useState<string | "new" | null>(packages.length ? null : "new");
  const [draft, setDraft] = useState<PackageDraft>(emptyPackageDraft);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function send(url: string, method: "POST" | "PATCH", body: Record<string, unknown>, fallback: string): Promise<SchoolPackage> {
    const res = await fetch(url, {
      method,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ organisation_id: organisationId, ...body }),
    });
    const json = await readJson(res);
    if (!res.ok) throw new Error(apiError(json, res.status, fallback).message);
    const saved = (json as { package?: SchoolPackage } | null)?.package;
    if (!saved) throw new Error(fallback);
    return saved;
  }

  function keep(saved: SchoolPackage) {
    setItems((list) => (list.some((p) => p.id === saved.id) ? list.map((p) => (p.id === saved.id ? saved : p)) : [...list, saved]));
  }

  function open(target: SchoolPackage | "new") {
    setMessage(null);
    setEditing(target === "new" ? "new" : target.id);
    setDraft(target === "new" ? emptyPackageDraft() : draftFromPackage(target));
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);
    const checked = packageInputFromDraft(draft);
    if (!checked.ok) {
      setMessage({ ok: false, text: checked.error });
      return;
    }
    const current = editing && editing !== "new" ? items.find((p) => p.id === editing) : null;
    setBusy("save");
    try {
      if (current) {
        const patch = packagePatch(current, checked.input);
        if (!Object.keys(patch).length) {
          setMessage({ ok: false, text: "Nothing has changed." });
          return;
        }
        keep(await send(`/organisations/api/packages/${current.id}`, "PATCH", patch, "Could not save the package."));
        setMessage({ ok: true, text: "Saved. Learners who already bought it keep the hours they bought." });
      } else {
        keep(await send("/organisations/api/packages", "POST", { ...checked.input }, "Could not add the package."));
        setMessage({ ok: true, text: "Added. Your office can pick it in WhatsApp the next time a caller has paid for it." });
      }
      setEditing(null);
    } catch (cause) {
      setMessage({ ok: false, text: cause instanceof Error ? cause.message : "Could not save the package." });
    } finally {
      setBusy(null);
    }
  }

  async function setOnSale(pkg: SchoolPackage, onSale: boolean) {
    setMessage(null);
    setBusy(pkg.id);
    try {
      keep(await send(`/organisations/api/packages/${pkg.id}`, "PATCH", { is_active: onSale }, "Could not change the package."));
      setMessage({
        ok: true,
        text: onSale
          ? `${pkg.name} is back on sale.`
          : `${pkg.name} is off sale. Learners who already bought it keep their hours.`,
      });
    } catch (cause) {
      setMessage({ ok: false, text: cause instanceof Error ? cause.message : "Could not change the package." });
    } finally {
      setBusy(null);
    }
  }

  const toggleTime = (time: LessonTime) =>
    setDraft((d) => ({ ...d, lesson_times: d.lesson_times.includes(time) ? d.lesson_times.filter((t) => t !== time) : [...d.lesson_times, time] }));
  const groups = packagesByCategory(items);
  const editingExisting = editing && editing !== "new" ? items.find((p) => p.id === editing) : null;

  return (
    <section aria-labelledby="packages-heading" className="rounded-2xl border border-border bg-white p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="packages-heading" className="font-display text-xl text-ink">
            What you sell
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-ink-secondary">
            When a caller has already paid you, your office picks the package in WhatsApp. Their lessons then come out of
            those hours and they are not asked for a card. You take the payment yourself; Newdryve never charges for a
            package.
          </p>
        </div>
        {editing === null ? (
          <button type="button" onClick={() => open("new")} className={quiet}>
            Add a package
          </button>
        ) : null}
      </div>

      {message ? (
        <p
          role={message.ok ? "status" : "alert"}
          className={`mt-4 rounded-xl px-4 py-3 text-sm ${message.ok ? "bg-emerald-50 font-semibold text-emerald-900" : "bg-rose-50 text-rose-800"}`}
        >
          {message.text}
        </p>
      ) : null}

      {editing !== null ? (
        <form
          onSubmit={save}
          aria-label={editingExisting ? `Change ${editingExisting.name}` : "Add a package"}
          className="mt-4 grid gap-4 rounded-xl border border-border bg-canvas p-4 sm:grid-cols-2"
        >
          <label className="flex flex-col gap-1.5">
            <span className={label}>Kind</span>
            <select
              className={input}
              value={draft.category}
              onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value as PackageCategory }))}
            >
              {PACKAGE_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={label}>Name</span>
            <input
              className={input}
              value={draft.name}
              maxLength={PACKAGE_NAME_MAX}
              placeholder="10 hours intro daytime"
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={label}>Hours</span>
            <input
              className={input}
              inputMode="decimal"
              value={draft.hours}
              placeholder="10"
              onChange={(e) => setDraft((d) => ({ ...d, hours: e.target.value }))}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={label}>Car</span>
            <select
              className={input}
              value={draft.transmission}
              onChange={(e) => setDraft((d) => ({ ...d, transmission: e.target.value as "" | Transmission }))}
            >
              <option value="">Either</option>
              <option value="manual">Manual</option>
              <option value="auto">Automatic</option>
            </select>
          </label>
          <fieldset className="sm:col-span-2">
            <legend className={label}>When the lessons can be</legend>
            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2">
              {LESSON_TIMES.map((t) => (
                <label key={t.value} className="flex min-h-11 items-center gap-2 text-sm text-ink">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-racing-green"
                    checked={draft.lesson_times.includes(t.value)}
                    onChange={() => toggleTime(t.value)}
                  />
                  {t.label}
                </label>
              ))}
            </div>
            <p className="mt-1 text-xs text-ink-muted">Tick none for any time. A daytime package only pays for weekday lessons before 5pm.</p>
          </fieldset>
          <label className="flex flex-col gap-1.5">
            <span className={label}>Price (£, optional)</span>
            <input
              className={input}
              inputMode="decimal"
              value={draft.price}
              placeholder="430"
              onChange={(e) => setDraft((d) => ({ ...d, price: e.target.value }))}
            />
            <span className="text-xs text-ink-muted">For your own records. Learners never see it and Newdryve never charges it.</span>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={label}>Hours last (months)</span>
            <input
              className={input}
              type="number"
              inputMode="numeric"
              min={1}
              max={PACKAGE_MAX_MONTHS}
              step={1}
              value={draft.valid_months}
              onChange={(e) => setDraft((d) => ({ ...d, valid_months: e.target.value }))}
            />
          </label>
          <div className="flex flex-wrap gap-3 sm:col-span-2">
            <button
              type="submit"
              disabled={busy !== null}
              className="focus-ring inline-flex min-h-12 items-center justify-center rounded-full bg-racing-green px-6 text-sm font-bold text-white disabled:opacity-60"
            >
              {busy === "save" ? "Saving…" : editingExisting ? "Save changes" : "Add package"}
            </button>
            {items.length ? (
              <button type="button" onClick={() => setEditing(null)} disabled={busy !== null} className={quiet}>
                Cancel
              </button>
            ) : null}
          </div>
        </form>
      ) : null}

      {groups.length ? (
        <div className="mt-5 space-y-5">
          {groups.map((group) => (
            <div key={group.category}>
              <h3 className="text-[11px] font-bold uppercase tracking-[1px] text-ink-muted">{group.label}</h3>
              <ul className="mt-2 divide-y divide-border rounded-xl border border-border">
                {group.packages.map((pkg) => (
                  <li key={pkg.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink">
                        {pkg.name}
                        {pkg.is_active ? null : (
                          <span className="ml-2 rounded-full bg-canvas px-2 py-0.5 text-[11px] font-semibold text-ink-muted">Off sale</span>
                        )}
                      </p>
                      <p className="mt-0.5 text-xs text-ink-muted">
                        {describePackage(pkg)}
                        {pkg.price_pence === null ? "" : ` · ${hourly(pkg.price_pence)}`}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => open(pkg)} disabled={busy !== null} className={quiet} aria-label={`Change ${pkg.name}`}>
                        Change
                      </button>
                      <button
                        type="button"
                        onClick={() => setOnSale(pkg, !pkg.is_active)}
                        disabled={busy !== null}
                        className={quiet}
                        aria-label={pkg.is_active ? `Take ${pkg.name} off sale` : `Put ${pkg.name} back on sale`}
                      >
                        {busy === pkg.id ? "Saving…" : pkg.is_active ? "Take off sale" : "Put back on sale"}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-ink-secondary">
          No packages yet. Until you add one, your office is not asked what a caller has paid for, and every lesson is paid by card
          after it is taught.
        </p>
      )}
    </section>
  );
}
