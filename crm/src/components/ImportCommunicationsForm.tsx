"use client";

import { useActionState } from "react";
import { importCommunications, type ImportCommunicationsState } from "@/actions/communicationImport";
import { Button } from "@/components/ui";

export default function ImportCommunicationsForm() {
  const [state, formAction, pending] = useActionState<ImportCommunicationsState, FormData>(
    importCommunications,
    undefined,
  );

  return (
    <form action={formAction} className="space-y-5">
      {state && "error" in state && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {state.error}
        </div>
      )}

      {state && "summary" in state && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
          <p className="font-medium">
            {state.summary.kind === "calls" ? "Call log" : "Texts"} processed — {state.summary.total} record
            {state.summary.total === 1 ? "" : "s"} in the file.
          </p>
          <ul className="mt-1 list-disc pl-4">
            <li>{state.summary.matched} logged to a matching company</li>
            <li>{state.summary.skippedUnmatched} skipped — no matching contact or company phone number</li>
            <li>{state.summary.skippedAlreadyImported} already imported from a previous upload</li>
            {state.summary.skippedNoise > 0 && <li>{state.summary.skippedNoise} skipped (drafts/unsent)</li>}
          </ul>
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          SMS Backup &amp; Restore export (a <code>calls-*.xml</code> or <code>sms-*.xml</code> file)
        </label>
        <input
          name="file"
          type="file"
          accept=".xml,text/xml"
          required
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Importing…" : "Upload"}
        </Button>
      </div>
    </form>
  );
}
