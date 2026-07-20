"use client";

import { useMemo, useState } from "react";
import { formatPence, type OpsExpense } from "@/lib/ops/types";
import SpendModal from "@/components/ops/SpendModal";

// Funding + spend section for the dashboard. Server passes the seeded funding
// total and the current expense list; all mutations round-trip to the API and
// update local state so the totals stay live without a full reload.
export default function FinancePanel({
  initialFundingPence,
  initialExpenses,
}: {
  initialFundingPence: number;
  initialExpenses: OpsExpense[];
}) {
  const [fundingPence, setFundingPence] = useState(initialFundingPence);
  const [expenses, setExpenses] = useState<OpsExpense[]>(initialExpenses);
  const [showSpend, setShowSpend] = useState(false);
  const [editingFunding, setEditingFunding] = useState(false);
  const [fundingInput, setFundingInput] = useState(String(initialFundingPence / 100));
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const spentPence = useMemo(
    () => expenses.reduce((sum, e) => sum + Number(e.amount_pence || 0), 0),
    [expenses]
  );
  const remainingPence = fundingPence - spentPence;

  async function saveFunding() {
    const pounds = Number(fundingInput);
    if (!Number.isFinite(pounds) || pounds < 0) {
      setError("Enter a valid funding amount");
      return;
    }
    setError(null);
    const res = await fetch("/ops/api/finance", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ fundingPounds: pounds }),
    });
    const d = await res.json();
    if (typeof d.fundingPence === "number") {
      setFundingPence(d.fundingPence);
      setEditingFunding(false);
    } else {
      setError(d.error ?? "Failed to update funding");
    }
  }

  async function viewReceipt(id: string) {
    setBusyId(id);
    const res = await fetch("/ops/api/expenses/sign", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const d = await res.json();
    setBusyId(null);
    if (d.url) window.open(d.url, "_blank", "noopener,noreferrer");
    else setError(d.error ?? "Could not open receipt");
  }

  async function deleteExpense(id: string) {
    if (!confirm("Delete this spend and its receipt?")) return;
    setBusyId(id);
    const res = await fetch(`/ops/api/expenses/${id}`, { method: "DELETE" });
    const d = await res.json();
    setBusyId(null);
    if (d.ok) setExpenses((prev) => prev.filter((e) => e.id !== id));
    else setError(d.error ?? "Failed to delete");
  }

  return (
    <section id="finance" className="rounded-2xl border border-border bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-lg text-ink">Funding &amp; spend</h2>
        <button
          onClick={() => setShowSpend(true)}
          className="rounded-lg gradient-bg px-3 py-1.5 text-sm text-white"
        >
          + Add spend
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-white p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-ink-muted">Total funding</p>
            {!editingFunding && (
              <button
                onClick={() => {
                  setFundingInput(String(fundingPence / 100));
                  setEditingFunding(true);
                }}
                className="text-xs text-racing-green hover:underline"
              >
                Edit
              </button>
            )}
          </div>
          {editingFunding ? (
            <div className="mt-1 flex items-center gap-2">
              <input
                type="number"
                min="0"
                step="0.01"
                value={fundingInput}
                onChange={(e) => setFundingInput(e.target.value)}
                className="w-full rounded-lg border border-border bg-white px-2 py-1 text-sm"
              />
              <button onClick={saveFunding} className="rounded-lg bg-racing-green px-2 py-1 text-xs text-white">
                Save
              </button>
              <button
                onClick={() => setEditingFunding(false)}
                className="rounded-lg border border-border px-2 py-1 text-xs text-ink"
              >
                Cancel
              </button>
            </div>
          ) : (
            <p className="mt-1 font-display text-2xl text-ink">{formatPence(fundingPence)}</p>
          )}
        </div>

        <div className="rounded-xl border border-border bg-white p-4">
          <p className="text-xs text-ink-muted">Spent</p>
          <p className="mt-1 font-display text-2xl text-deep-rose">{formatPence(spentPence)}</p>
        </div>

        <div className="rounded-xl border border-border bg-white p-4">
          <p className="text-xs text-ink-muted">Remaining</p>
          <p
            className={`mt-1 font-display text-2xl ${
              remainingPence < 0 ? "text-deep-rose" : "text-racing-green"
            }`}
          >
            {formatPence(remainingPence)}
          </p>
        </div>
      </div>

      {error && <p className="mt-3 text-sm text-deep-rose">{error}</p>}

      <div className="mt-5">
        {expenses.length === 0 ? (
          <p className="text-sm text-ink-muted">No spend recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="text-left text-xs text-ink-muted">
                  <th className="py-2 pr-3 font-medium">Date</th>
                  <th className="py-2 pr-3 font-medium">Description</th>
                  <th className="py-2 pr-3 font-medium">Category</th>
                  <th className="py-2 pr-3 text-right font-medium">Amount</th>
                  <th className="py-2 pr-3 font-medium">Receipt</th>
                  <th className="py-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {expenses.map((e) => (
                  <tr key={e.id} className="border-t border-border">
                    <td className="py-2 pr-3 text-ink-secondary whitespace-nowrap">
                      {new Date(e.spent_on).toLocaleDateString("en-GB")}
                    </td>
                    <td className="py-2 pr-3 text-ink">{e.description}</td>
                    <td className="py-2 pr-3 text-ink-secondary">{e.category ?? "—"}</td>
                    <td className="py-2 pr-3 text-right font-medium text-ink whitespace-nowrap">
                      {formatPence(e.amount_pence)}
                    </td>
                    <td className="py-2 pr-3">
                      <button
                        onClick={() => viewReceipt(e.id)}
                        disabled={busyId === e.id}
                        className="text-xs text-racing-green hover:underline disabled:opacity-60"
                      >
                        {busyId === e.id ? "…" : "View"}
                      </button>
                    </td>
                    <td className="py-2 text-right">
                      <button
                        onClick={() => deleteExpense(e.id)}
                        disabled={busyId === e.id}
                        className="text-xs text-ink-muted hover:text-deep-rose disabled:opacity-60"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showSpend && (
        <SpendModal
          onClose={() => setShowSpend(false)}
          onDone={(expense) => {
            setExpenses((prev) => [expense, ...prev]);
            setShowSpend(false);
          }}
        />
      )}
    </section>
  );
}
