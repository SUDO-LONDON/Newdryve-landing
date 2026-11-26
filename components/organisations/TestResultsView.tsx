"use client";

import { useMemo, useState } from "react";
import type { TestResult, TestResultsResponse, TestResultSummary } from "@/lib/organisations/types";
import { day } from "@/lib/organisations/format";

/** "Mon 23 Nov 2026" from a YYYY-MM-DD date. */
function testDay(date: string): string {
  return `${day(date)} ${date.slice(0, 4)}`;
}

/** The same summary as the API's, for one instructor's results. */
export function summarise(results: TestResult[]): TestResultSummary {
  const tests = results.length;
  if (!tests) return { tests: 0, passes: 0, pass_rate: null, average_minors: null, average_majors: null };
  const passes = results.filter((r) => r.passed).length;
  const round1 = (n: number) => Math.round(n * 10) / 10;
  return {
    tests,
    passes,
    pass_rate: Math.round((passes / tests) * 100),
    average_minors: round1(results.reduce((n, r) => n + r.minors, 0) / tests),
    average_majors: round1(results.reduce((n, r) => n + r.majors, 0) / tests),
  };
}

/** Pass rate, passes and tests per instructor, best pass rate first. */
export function byInstructor(results: TestResult[]) {
  const groups = new Map<string, { instructor_id: string; name: string; results: TestResult[] }>();
  for (const r of results) {
    const group = groups.get(r.instructor_id) ?? { instructor_id: r.instructor_id, name: r.instructor_name, results: [] };
    group.results.push(r);
    groups.set(r.instructor_id, group);
  }
  return [...groups.values()]
    .map((g) => ({ instructor_id: g.instructor_id, name: g.name, ...summarise(g.results) }))
    .sort((a, b) => (b.pass_rate ?? -1) - (a.pass_rate ?? -1) || b.tests - a.tests || a.name.localeCompare(b.name, "en-GB"));
}

/** CSV with every cell quoted and spreadsheet formulas in names neutralised. */
export function testResultsCsv(results: TestResult[]): string {
  const header = ["Test date", "Learner", "Instructor", "Result", "Majors", "Minors", "Examiner"];
  const rows = results.map((r) => [r.test_date, r.learner_name, r.instructor_name, r.passed ? "Pass" : "Fail", String(r.majors), String(r.minors), r.examiner_name]);
  const cell = (v: string) => `"${(/^[=+\-@]/.test(v) ? `'${v}` : v).replace(/"/g, '""')}"`;
  return [header, ...rows].map((r) => r.map(cell).join(",")).join("\r\n");
}

function ResultBadge({ passed }: { passed: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold ${passed ? "bg-emerald-100 text-emerald-900" : "bg-rose-100 text-rose-900"}`}
    >
      {passed ? "Pass" : "Fail"}
    </span>
  );
}

function faults(n: number, one: string) {
  return `${n} ${one}${n === 1 ? "" : "s"}`;
}

export default function TestResultsView({ data }: { data: TestResultsResponse }) {
  const [instructor, setInstructor] = useState<string>("all");
  const instructors = useMemo(() => byInstructor(data.results), [data.results]);
  const shown = instructor === "all" ? data.results : data.results.filter((r) => r.instructor_id === instructor);
  const summary = instructor === "all" ? data.summary : summarise(shown);
  const multiSchool = data.organisations.length > 1;
  const schoolName = (id: string | null) => data.organisations.find((o) => o.id === id)?.name ?? "";

  function downloadCsv() {
    const url = URL.createObjectURL(new Blob([testResultsCsv(shown)], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "test-results.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!data.results.length) {
    return (
      <div className="rounded-2xl border border-border bg-white p-8 text-center text-sm text-ink-secondary">
        <p className="font-semibold text-ink">No test results yet.</p>
        <p className="mt-1">
          When a learner takes their test, their instructor taps &ldquo;Record a test result&rdquo; in the Newdryve WhatsApp
          assistant. It appears here straight away.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <label className="flex flex-col gap-1 text-xs font-semibold text-ink-secondary">
          Instructor
          <select
            value={instructor}
            onChange={(e) => setInstructor(e.target.value)}
            className="focus-ring min-h-11 rounded-lg border border-border bg-white px-3 text-sm font-semibold text-ink"
          >
            <option value="all">All instructors</option>
            {instructors.map((i) => (
              <option key={i.instructor_id} value={i.instructor_id}>
                {i.name}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={downloadCsv}
          className="focus-ring inline-flex min-h-11 items-center rounded-lg border border-border bg-white px-4 text-sm font-semibold text-ink hover:bg-blush-surface"
        >
          Download CSV
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Tests" value={String(summary.tests)} />
        <Stat label="Pass rate" value={summary.pass_rate === null ? "–" : `${summary.pass_rate}%`} detail={`${summary.passes} passed`} />
        <Stat label="Average minors" value={summary.average_minors === null ? "–" : String(summary.average_minors)} />
        <Stat label="Average majors" value={summary.average_majors === null ? "–" : String(summary.average_majors)} />
      </div>

      {instructor === "all" && instructors.length > 1 ? (
        <section aria-labelledby="by-instructor" className="mt-6">
          <h2 id="by-instructor" className="text-sm font-bold text-ink">
            By instructor
          </h2>
          <ul className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {instructors.map((i) => (
              <li key={i.instructor_id}>
                <button
                  type="button"
                  onClick={() => setInstructor(i.instructor_id)}
                  className="focus-ring flex w-full items-baseline justify-between gap-3 rounded-xl border border-border bg-white p-3 text-left hover:bg-blush-surface"
                >
                  <span className="truncate font-semibold text-ink">{i.name}</span>
                  <span className="shrink-0 text-sm text-ink-secondary">
                    <span className="font-bold text-ink">{i.pass_rate}%</span> · {i.passes} of {i.tests}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Phones: one card per test. */}
      <ul className="mt-6 space-y-3 md:hidden">
        {shown.map((r) => (
          <li key={r.id} className="rounded-2xl border border-border bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-bold text-ink">{r.learner_name}</p>
                <p className="mt-0.5 text-xs text-ink-secondary">
                  {testDay(r.test_date)} · {r.instructor_name}
                </p>
              </div>
              <ResultBadge passed={r.passed} />
            </div>
            <p className="mt-2 text-sm text-ink">
              {faults(r.majors, "major")} · {faults(r.minors, "minor")}
            </p>
            <p className="mt-0.5 text-xs text-ink-secondary">Examiner: {r.examiner_name}</p>
          </li>
        ))}
      </ul>

      {/* Wider screens: the sheet. */}
      <div className="mt-6 hidden overflow-x-auto rounded-2xl border border-border bg-white md:block">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-border bg-blush-surface/60 text-[11px] uppercase tracking-wider text-ink-secondary">
            <tr>
              <th scope="col" className="px-3 py-3">Date</th>
              <th scope="col" className="px-3 py-3">Learner</th>
              <th scope="col" className="px-3 py-3">Instructor</th>
              <th scope="col" className="px-3 py-3">Result</th>
              <th scope="col" className="px-3 py-3 text-right">Majors</th>
              <th scope="col" className="px-3 py-3 text-right">Minors</th>
              <th scope="col" className="px-3 py-3">Examiner</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {shown.map((r) => (
              <tr key={r.id}>
                <td className="whitespace-nowrap px-3 py-3 text-ink">{testDay(r.test_date)}</td>
                <th scope="row" className="px-3 py-3 font-semibold text-ink">
                  {r.learner_name}
                  {r.learner_kind === "private" ? <span className="block text-xs font-normal text-ink-secondary">Private learner</span> : null}
                </th>
                <td className="px-3 py-3 text-ink">
                  {r.instructor_name}
                  {multiSchool ? <span className="block text-xs text-ink-secondary">{schoolName(r.organisation_id)}</span> : null}
                </td>
                <td className="px-3 py-3">
                  <ResultBadge passed={r.passed} />
                </td>
                <td className={`px-3 py-3 text-right font-semibold ${r.majors ? "text-rose-800" : "text-ink"}`}>{r.majors}</td>
                <td className={`px-3 py-3 text-right font-semibold ${r.minors > 15 ? "text-rose-800" : "text-ink"}`}>{r.minors}</td>
                <td className="px-3 py-3 text-ink">{r.examiner_name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-ink-secondary">
        Results are as each instructor recorded them.
        {data.truncated ? " Showing the newest 500." : ""}
      </p>
    </div>
  );
}

function Stat({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="rounded-xl border border-border bg-white p-3">
      <p className="text-xs font-semibold text-ink-secondary">{label}</p>
      <p className="mt-0.5 font-display text-2xl text-ink">{value}</p>
      {detail ? <p className="text-xs text-ink-secondary">{detail}</p> : null}
    </div>
  );
}
