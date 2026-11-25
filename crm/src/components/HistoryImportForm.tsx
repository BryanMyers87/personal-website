"use client";

import { useActionState } from "react";
import { uploadHistoryBatch } from "@/actions/leadUpload";
import type { UploadLeadBatchState } from "@/actions/leadUpload";
import { Button } from "@/components/ui";

export default function HistoryImportForm() {
  const [state, formAction, pending] = useActionState<UploadLeadBatchState, FormData>(uploadHistoryBatch, undefined);

  return (
    <form action={formAction} className="space-y-5">
      {state?.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {state.error}
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          History CSV (period_start, period_end, granularity, company, industry, leads, apps_booked,
          billed_to_contractor, dnq)
        </label>
        <input
          name="file"
          type="file"
          accept=".csv,text/csv"
          required
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Uploading…" : "Upload"}
        </Button>
      </div>
    </form>
  );
}
