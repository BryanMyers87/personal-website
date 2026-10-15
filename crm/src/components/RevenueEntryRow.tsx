"use client";

import { useTransition } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Trash2 } from "lucide-react";
import { deleteRevenueEntry } from "@/actions/revenue";
import { Card } from "@/components/ui";

export type RevenueEntryData = {
  id: string;
  companyId: string;
  companyName: string;
  amount: number;
  receivedAt: Date | string;
  note: string | null;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

export default function RevenueEntryRow({ entry }: { entry: RevenueEntryData }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!window.confirm(`Delete this ${formatCurrency(entry.amount)} entry for ${entry.companyName}?`)) return;
    startTransition(() => deleteRevenueEntry(entry.id));
  }

  return (
    <Card className="flex items-center justify-between gap-3 p-3">
      <div className="min-w-0">
        <p className="text-sm">
          <span className="font-semibold">{formatCurrency(entry.amount)}</span>
          <span className="text-zinc-400"> from </span>
          <Link href={`/companies/${entry.companyId}`} className="font-medium hover:underline">
            {entry.companyName}
          </Link>
        </p>
        <p className="text-xs text-zinc-400">
          {format(new Date(entry.receivedAt), "PP")}
          {entry.note ? ` · ${entry.note}` : ""}
        </p>
      </div>
      <button
        type="button"
        disabled={isPending}
        onClick={handleDelete}
        aria-label="Delete revenue entry"
        className="shrink-0 text-zinc-400 transition-colors hover:text-red-600 disabled:opacity-50 dark:hover:text-red-400"
      >
        <Trash2 size={14} />
      </button>
    </Card>
  );
}
