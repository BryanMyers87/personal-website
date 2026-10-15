"use client";

import { useState, useTransition } from "react";
import { createRevenueEntry } from "@/actions/revenue";
import { Button } from "@/components/ui";
import RevenueEntryRow, { type RevenueEntryData } from "@/components/RevenueEntryRow";

export type WonAccountOption = { id: string; name: string };

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function RevenueLedger({
  accounts,
  entries,
}: {
  accounts: WonAccountOption[];
  entries: RevenueEntryData[];
}) {
  const [companyId, setCompanyId] = useState("");
  const [amount, setAmount] = useState("");
  const [receivedAt, setReceivedAt] = useState(todayIso);
  const [note, setNote] = useState("");
  const [isPending, startTransition] = useTransition();

  const amountNum = Number(amount);
  const canSubmit = !!companyId && amount.trim() !== "" && Number.isFinite(amountNum) && amountNum > 0 && !!receivedAt;

  function handleAdd() {
    if (!canSubmit) return;
    const noteToSend = note;
    setAmount("");
    setNote("");
    startTransition(() => {
      createRevenueEntry(companyId, amountNum, receivedAt, noteToSend);
    });
  }

  return (
    <div>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <select
          value={companyId}
          onChange={(e) => setCompanyId(e.target.value)}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 sm:min-w-[200px] sm:flex-1"
        >
          <option value="">Select account…</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          type="number"
          min={0}
          step="0.01"
          placeholder="Amount ($)"
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 sm:w-32"
        />
        <input
          value={receivedAt}
          onChange={(e) => setReceivedAt(e.target.value)}
          type="date"
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Note (optional)"
          className="w-full flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 sm:min-w-[140px]"
        />
        <Button type="button" disabled={isPending || !canSubmit} onClick={handleAdd}>
          Log Revenue
        </Button>
      </div>

      {accounts.length === 0 && (
        <p className="mb-3 text-xs text-zinc-400">No won accounts yet — revenue can only be logged against a won account.</p>
      )}

      {entries.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">No revenue logged yet.</p>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => (
            <RevenueEntryRow key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}
