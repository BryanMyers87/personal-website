"use client";

import { useState, useTransition } from "react";
import { mergeCompanies } from "@/actions/companyMerge";
import { Button } from "@/components/ui";

export default function MergeCompanyForm({
  companyId,
  companyName,
  otherCompanies,
}: {
  companyId: string;
  companyName: string;
  otherCompanies: { id: string; name: string }[];
}) {
  const [selected, setSelected] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={selected}
        disabled={pending}
        onChange={(e) => setSelected(e.target.value)}
        className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
      >
        <option value="">Choose the company to keep…</option>
        {otherCompanies.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <Button
        type="button"
        variant="danger"
        disabled={pending || !selected}
        onClick={() => {
          const keepName = otherCompanies.find((c) => c.id === selected)?.name ?? "";
          if (
            !window.confirm(
              `Merge "${companyName}" into "${keepName}"? Every contact, reminder, note, and lead report moves to ${keepName}, and ${companyName} is deleted. This cannot be undone.`,
            )
          )
            return;
          startTransition(async () => {
            try {
              await mergeCompanies(companyId, selected);
            } catch (err) {
              if (err && typeof err === "object" && "digest" in err && String(err.digest).startsWith("NEXT_REDIRECT")) {
                throw err;
              }
              alert(err instanceof Error ? err.message : "Something went wrong.");
            }
          });
        }}
      >
        {pending ? "Merging…" : `Merge ${companyName} into…`}
      </Button>
    </div>
  );
}
