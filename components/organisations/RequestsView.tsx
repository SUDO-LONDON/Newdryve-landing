"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { day, gbp, londonDateOf, shortDate, time } from "@/lib/organisations/format";
import { apiError, readJson } from "@/lib/organisations/http";
import { decisionText, type RequestRouting, type RequestSummary, type RequestsResponse } from "@/lib/organisations/requests";

/** Waiting requests first, soonest first; then what the school decided this week. */
export default function RequestsView({ data }: { data: RequestsResponse }) {
  const schools = data.organisations;
  const multi = schools.length > 1;
  return (
    <div className="space-y-8">
      {schools.map((school) => (
        <RoutingCard key={school.id} school={school} showName={multi} waiting={data.waiting.filter((r) => r.organisation?.id === school.id && !r.expired).length} />
      ))}

      <section aria-labelledby="waiting-heading">
        <h2 id="waiting-heading" className="font-display text-xl text-ink">
          Waiting for you {data.waiting.length ? <span className="text-ink-secondary">({data.waiting.length})</span> : null}
        </h2>
        {data.waiting.length ? (
          <ul className="mt-3 space-y-3">
            {data.waiting.map((request) => (
              <li key={request.id}>
                <WaitingCard request={request} showSchool={multi} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 rounded-2xl border border-border bg-white p-8 text-center text-sm text-ink-secondary">
            No requests waiting. New ones appear here and in the bell.
          </p>
        )}
      </section>

      {data.decided.length ? (
        <section aria-labelledby="decided-heading">
          <h2 id="decided-heading" className="font-display text-xl text-ink">Decided this week</h2>
          <ul className="mt-3 divide-y divide-border rounded-2xl border border-border bg-white">
            {data.decided.map((request) => (
              <li key={request.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                <span>
                  <span className="font-semibold text-ink">{request.learner.name}</span>{" "}
                  <span className="text-ink-secondary">
                    {day(londonDateOf(request.starts_at))} {time(request.starts_at)}
                  </span>
                </span>
                <span className="text-ink-secondary">
                  {decisionText(request)}
                  {request.decided_by ? ` · by ${request.decided_by}` : ""}
                  {request.decided_at ? ` · ${shortDate(request.decided_at)}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function WaitingCard({ request, showSchool }: { request: RequestSummary; showSchool: boolean }) {
  const date = londonDateOf(request.starts_at);
  const prefs = [
    request.preferences.transmission ? (request.preferences.transmission === "auto" ? "Automatic" : "Manual") : null,
    request.preferences.language,
    request.preferences.test_centre ? `Test centre: ${request.preferences.test_centre}` : null,
  ].filter(Boolean);
  return (
    <Link
      href={`/organisations/requests/${request.id}`}
      className="focus-ring block rounded-2xl border border-border bg-white p-4 hover:border-racing-green sm:p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-ink">
            {request.learner.name}
            {showSchool && request.organisation?.name ? <span className="font-normal text-ink-secondary"> · {request.organisation.name}</span> : null}
          </p>
          <p className="mt-0.5 font-display text-2xl text-ink">
            {day(date)}, {time(request.starts_at)}–{time(request.ends_at)}
          </p>
          <p className="mt-1 text-sm text-ink-secondary">
            {request.lesson?.label ?? "Lesson"}
            {request.pickup_label ? ` · pickup near ${request.pickup_label}` : ""} · {gbp(request.price_pence)}
          </p>
          {prefs.length ? <p className="mt-1 text-xs text-ink-secondary">Asked for: {prefs.join(" · ")}</p> : null}
        </div>
        <div className="text-right">
          {request.expired ? (
            <span className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-900 ring-1 ring-amber-300">Too late to book</span>
          ) : (
            <span className="inline-flex rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-deep-rose-ink">Choose an instructor</span>
          )}
          <p className="mt-2 text-xs text-ink-secondary">
            {request.learner_chose ? "Learner asked for" : "Suggested"}: <span className="font-semibold text-ink">{request.instructor.name}</span>
          </p>
          {request.passed_instructors.length ? (
            <p className="mt-1 text-xs text-ink-secondary">Already passed: {request.passed_instructors.map((p) => p.name).join(", ")}</p>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

/** Who decides the school's requests: the school (here) or each instructor. */
function RoutingCard({
  school,
  showName,
  waiting,
}: {
  school: { id: string; name: string; request_routing: RequestRouting };
  showName: boolean;
  waiting: number;
}) {
  const router = useRouter();
  const [routing, setRouting] = useState<RequestRouting>(school.request_routing);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function change(next: RequestRouting) {
    if (busy || next === routing) return;
    if (next === "instructor" && !window.confirm("Send new requests straight to the instructor the learner picked or the system matched?")) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/organisations/api/request-routing", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ routing: next, organisation_id: school.id }),
      });
      const body = await readJson(response);
      if (!response.ok) {
        const info = apiError(body, response.status, "Could not change this.");
        setError(info.code === "requests_waiting" ? "Book, send or decline the requests waiting below first." : info.message);
        return;
      }
      setRouting(next);
      router.refresh();
    } catch {
      setError("Could not reach the server. Check your connection.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-white p-4 sm:p-5" aria-label={`Who decides requests${showName ? ` for ${school.name}` : ""}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-ink">
            New lesson requests go to{showName ? ` (${school.name})` : ""}
          </p>
          <p className="mt-0.5 text-sm text-ink-secondary">
            {routing === "school"
              ? "You. Instructors only see a lesson once you book it or send it to them."
              : "The instructor the learner picked, or the one Newdryve matched."}
          </p>
        </div>
        <div role="radiogroup" aria-label="Who gets new requests" className="inline-flex rounded-full border border-border bg-canvas p-1">
          {(["school", "instructor"] as const).map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={routing === value}
              disabled={busy}
              onClick={() => change(value)}
              className={`focus-ring min-h-10 rounded-full px-4 text-sm font-semibold disabled:opacity-60 ${
                routing === value ? "bg-racing-green text-white" : "text-ink-secondary hover:text-ink"
              }`}
            >
              {value === "school" ? "The office" : "Instructors"}
            </button>
          ))}
        </div>
      </div>
      {routing === "instructor" && waiting > 0 ? (
        <p className="mt-2 text-xs text-ink-secondary">{waiting} still waiting below from before.</p>
      ) : null}
      {error ? (
        <p role="alert" className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {error}
        </p>
      ) : null}
    </section>
  );
}
