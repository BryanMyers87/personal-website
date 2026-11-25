"use client";

import { useActionState } from "react";
import { uploadLeadBatch, type UploadLeadBatchState } from "@/actions/leadUpload";
import { Button } from "@/components/ui";

export default function LeadUploadForm({
  defaultPeriodStart,
  defaultPeriodEnd,
}: {
  defaultPeriodStart: string;
  defaultPeriodEnd: string;
}) {
  const [state, formAction, pending] = useActionState<UploadLeadBatchState, FormData>(uploadLeadBatch, undefined);

  return (
    <form action={formAction} className="space-y-5">
      {state?.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {state.error}
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Energuy &quot;Company List&quot; export (CSV)
        </label>
        <input
          name="file"
          type="file"
          accept=".csv,text/csv"
          required
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Period start (Friday)</label>
          <input
            name="periodStart"
            type="date"
            defaultValue={defaultPeriodStart}
            required
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Period end (Thursday)</label>
          <input
            name="periodEnd"
            type="date"
            defaultValue={defaultPeriodEnd}
            required
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Uploading…" : "Upload"}
        </Button>
      </div>
    </form>
  );
}
