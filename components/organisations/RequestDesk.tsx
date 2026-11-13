"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import SchoolDayBoard from "@/components/organisations/SchoolDayBoard";
import { day, gbp, londonDateOf, time } from "@/lib/organisations/format";
import { apiError, readJson } from "@/lib/organisations/http";
import {
  milesText,
  warningText,
  type DeskCandidate,
  type DeskDecision,
  type RequestDetailResponse,
} from "@/lib/organisations/requests";

const ERROR_TEXT: Record<string, string> = {
  slot_no_longer_free: "That instructor is no longer free then. Choose someone else.",
  booking_request_expired: "It's now too close to the lesson to book it.",
  request_not_waiting: "This request has already been dealt with.",
  lesson_type_not_offered: "That instructor doesn't teach this lesson at this length.",
  instructor_not_in_organisation: "That instructor can't take lessons for your school right now.",
};

/**
 * One request: who the system would give it to, every member ranked, the
 * whole school's day with the requested time marked, and the decision.
 */
export default function RequestDesk({ data }: { data: RequestDetailResponse }) {
  const router = useRouter();
  const { request, candidates } = data;
  const firstChoice = candidates.find((c) => c.recommended) ?? candidates.find((c) => c.current && c.available) ?? null;
  const [selectedId, setSelectedId] = useState<string | null>(firstChoice?.instructor_id ?? null);
  const [busy, setBusy] = useState<DeskDecision | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const selected = candidates.find((c) => c.instructor_id === selectedId) ?? null;
  const available = candidates.filter((c) => c.available);
  const unavailable = candidates.filter((c) => !c.available);
  const date = londonDateOf(request.starts_at);
  const locked = Boolean(done) || request.expired;

  async function decide(decision: DeskDecision) {
    if (busy || locked) return;
    if (decision !== "decline" && !selected) return;
    if (decision === "decline" && !window.confirm(`Decline ${request.learner.name}'s request? They'll be told nobody can take it.`)) return;
    setBusy(decision);
    setError(null);
    try {
      const response = await fetch(`/organisations/api/requests/${request.id}/decide`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(
          decision === "decline"
            ? { decision, ...(request.organisation ? { organisation_id: request.organisation.id } : {}) }
            : { decision, instructor_id: selected!.instructor_id, ...(request.organisation ? { organisation_id: request.organisation.id } : {}) }
        ),
      });
      const body = await readJson(response);
      if (!response.ok) {
        const info = apiError(body, response.status, "Could not save that.");
        setError((info.code && ERROR_TEXT[info.code]) || info.message);
        if (info.code === "slot_no_longer_free" || info.code === "request_not_waiting") router.refresh();
        return;
      }
      setDone(
        decision === "book"
          ? `Booked with ${selected!.name}. ${request.learner.name} and ${selected!.name} have been told.`
          : decision === "send"
            ? `Sent to ${selected!.name} to accept. If they decline or don't answer within 90 minutes, it comes back here.`
            : `Declined. ${request.learner.name} has been told.`
      );
      router.refresh();
    } catch {
      setError("Could not reach the server. Check your connection.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <Link href="/organisations/requests" className="focus-ring inline-flex min-h-11 items-center rounded-lg text-sm font-semibold text-racing-green underline">
        ← All requests
      </Link>

      <section className="rounded-2xl border border-border bg-white p-4 sm:p-5">
        <p className="text-sm font-bold text-ink">{request.learner.name}</p>
        <p className="mt-0.5 font-display text-3xl text-ink">
          {day(date)}, {time(request.starts_at)}–{time(request.ends_at)}
        </p>
        <p className="mt-1 text-sm text-ink-secondary">
          {request.lesson?.label ?? "Lesson"}
          {request.pickup_label ? ` · pickup near ${request.pickup_label}` : ""} · {gbp(request.price_pence)}
        </p>
        <p className="mt-2 text-xs text-ink-secondary">
          {request.learner_chose
            ? `The learner asked for ${request.instructor.name}.`
            : `Newdryve matched ${request.instructor.name}; the slot is held with them until you decide.`}{" "}
          The learner&apos;s price stays the same whoever takes it.
          {request.expired ? null : ` Decide before ${time(request.expires_at)} on ${day(londonDateOf(request.expires_at))}.`}
        </p>
        {request.passed_instructors.length ? (
          <p className="mt-1 text-xs text-ink-secondary">Already passed on it: {request.passed_instructors.map((p) => p.name).join(", ")}.</p>
        ) : null}
      </section>

      {request.expired ? (
        <p role="status" className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          It&apos;s now too close to the lesson to book it. The learner has been told the request lapsed.
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <section aria-labelledby="who-heading" className="space-y-3">
          <h2 id="who-heading" className="font-display text-xl text-ink">Who can take it</h2>
          {available.length ? (
            <ul className="space-y-2">
              {available.map((c) => (
                <li key={c.instructor_id}>
                  <CandidateRow candidate={c} selected={selectedId === c.instructor_id} disabled={locked} onSelect={() => setSelectedId(c.instructor_id)} bookedPrice={request.price_pence} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-2xl border border-border bg-white p-5 text-sm text-ink-secondary">
              Nobody at your school is free then. You can decline it, and the learner can ask for another time.
            </p>
          )}
          {unavailable.length ? (
            <div>
              <button type="button" onClick={() => setShowAll((v) => !v)} className="focus-ring min-h-11 rounded-lg text-sm font-semibold text-racing-green underline" aria-expanded={showAll}>
                {showAll ? "Hide" : "Show"} {unavailable.length} who can&apos;t
              </button>
              {showAll ? (
                <ul className="mt-2 space-y-1 text-sm text-ink-secondary">
                  {unavailable.map((c) => (
                    <li key={c.instructor_id} className="rounded-xl bg-canvas px-3 py-2">
                      <span className="font-semibold text-ink">{c.name}</span> ·{" "}
                      {c.unavailable_reason === "no_lesson_type" ? "doesn't teach this lesson" : "busy then"}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}

          {done ? (
            <div role="status" className="space-y-3 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              <p>{done}</p>
              <Link href="/organisations/requests" className="focus-ring inline-flex min-h-11 items-center rounded-full bg-racing-green px-5 text-sm font-bold text-white">
                Next request
              </Link>
            </div>
          ) : (
            <div className="space-y-2 rounded-2xl border border-border bg-white p-4">
              <button
                type="button"
                onClick={() => decide("book")}
                disabled={!selected || Boolean(busy) || locked}
                className="focus-ring inline-flex min-h-11 w-full items-center justify-center rounded-full bg-racing-green px-5 text-sm font-bold text-white disabled:opacity-60"
              >
                {busy === "book" ? "Booking…" : selected ? `Book with ${selected.name}` : "Choose an instructor"}
              </button>
              <button
                type="button"
                onClick={() => decide("send")}
                disabled={!selected || Boolean(busy) || locked}
                className="focus-ring inline-flex min-h-11 w-full items-center justify-center rounded-full border border-racing-green bg-white px-5 text-sm font-bold text-racing-green disabled:opacity-60"
              >
                {busy === "send" ? "Sending…" : selected ? `Ask ${selected.name} to accept` : "Ask them to accept"}
              </button>
              <p className="text-xs text-ink-secondary">
                Booking confirms it now and tells both of them. Asking sends it to them to accept; if they don&apos;t, it comes back here.
              </p>
              <button
                type="button"
                onClick={() => decide("decline")}
                disabled={Boolean(busy) || Boolean(done)}
                className="focus-ring min-h-11 w-full rounded-lg text-sm font-semibold text-rose-800 underline disabled:opacity-60"
              >
                {busy === "decline" ? "Declining…" : "Nobody can take it: decline"}
              </button>
              {error ? (
                <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-800">
                  {error}
                </p>
              ) : null}
            </div>
          )}
        </section>

        <section aria-labelledby="day-heading" className="min-w-0 space-y-3">
          <h2 id="day-heading" className="font-display text-xl text-ink">Everyone&apos;s day, {day(date)}</h2>
          <p className="text-sm text-ink-secondary">The requested time is the pink band. Tap a free instructor to choose them.</p>
          <SchoolDayBoard
            day={data.day}
            highlight={{ starts_at: request.starts_at, ends_at: request.ends_at }}
            candidates={candidates}
            selectedId={selectedId}
            onSelect={locked ? undefined : setSelectedId}
          />
        </section>
      </div>
    </div>
  );
}

function CandidateRow({
  candidate,
  selected,
  disabled,
  onSelect,
  bookedPrice,
}: {
  candidate: DeskCandidate;
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
  bookedPrice: number;
}) {
  const miles = milesText(candidate.miles);
  const from = candidate.distance_from;
  const where =
    miles && from
      ? from.kind === "previous_lesson"
        ? `${miles} from their ${from.at ? `${time(from.at)} ` : ""}drop-off${from.label ? ` (${from.label})` : ""}`
        : `${miles} from ${from.label ?? "their test centre"}`
      : candidate.previous_lesson
        ? `Previous lesson ends ${time(candidate.previous_lesson.ends_at)}`
        : "No lessons before this one";
  const tags = [
    candidate.recommended ? "Recommended" : null,
    candidate.learner_chose ? "Learner's choice" : null,
    candidate.current && !candidate.learner_chose ? "Holding it now" : null,
  ].filter(Boolean) as string[];
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      aria-pressed={selected}
      className={`focus-ring w-full rounded-2xl border bg-white p-3 text-left disabled:cursor-default ${
        selected ? "border-racing-green ring-2 ring-racing-green" : "border-border hover:border-racing-green"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-bold text-ink">{candidate.name}</span>
        <span className="flex flex-wrap justify-end gap-1">
          {tags.map((tag) => (
            <span key={tag} className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${tag === "Recommended" ? "bg-racing-green text-white" : "bg-canvas text-ink-secondary"}`}>
              {tag}
            </span>
          ))}
        </span>
      </div>
      <p className="mt-1 text-xs text-ink-secondary">{where}</p>
      <p className="mt-0.5 text-xs text-ink-secondary">
        {candidate.lessons_that_day === 0 ? "No other lessons that day" : `${candidate.lessons_that_day} other ${candidate.lessons_that_day === 1 ? "lesson" : "lessons"} that day`}
        {candidate.next_lesson ? ` · next at ${time(candidate.next_lesson.starts_at)}${milesText(candidate.next_lesson.miles_from_pickup) ? `, ${milesText(candidate.next_lesson.miles_from_pickup)} on` : ""}` : ""}
      </p>
      {candidate.warnings.length ? (
        <p className="mt-1 text-xs font-semibold text-amber-900">{candidate.warnings.map(warningText).join(" · ")}</p>
      ) : null}
      {candidate.price_pence != null && candidate.price_pence !== bookedPrice ? (
        <p className="mt-1 text-[11px] text-ink-secondary">
          Their usual price is {gbp(candidate.price_pence)}; this lesson stays at {gbp(bookedPrice)}.
        </p>
      ) : null}
    </button>
  );
}
