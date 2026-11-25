"use client";

import { useState, useTransition } from "react";
import { matchLeadRow, createCompanyForLeadRow } from "@/actions/leadUpload";
import { Button } from "@/components/ui";

export default function LeadRowResolver({
  rowId,
  rawCompanyName,
  companies,
}: {
  rowId: string;
  rawCompanyName: string;
  companies: { id: string; name: string }[];
}) {
  const [selected, setSelected] = useState("");
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={selected}
        disabled={isPending}
        onChange={(e) => setSelected(e.target.value)}
        className="rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-900"
      >
        <option value="">Match to existing company…</option>
        {companies.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <Button
        type="button"
        variant="secondary"
        disabled={isPending || !selected}
        onClick={() => startTransition(() => matchLeadRow(rowId, selected))}
      >
        Match
      </Button>
      <Button
        type="button"
        variant="secondary"
        disabled={isPending}
        onClick={() => {
          if (!window.confirm(`Create a new company named "${rawCompanyName}"?`)) return;
          startTransition(() => createCompanyForLeadRow(rowId));
        }}
      >
        Create new company
      </Button>
    </div>
  );
}
