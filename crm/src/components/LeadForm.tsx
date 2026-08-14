"use client";

import { useActionState } from "react";
import type { ActionState } from "@/actions/leads";
import { Button } from "@/components/ui";
import { STAGE_LABELS, STAGE_ORDER } from "@/lib/stages";

type Option = { id: string; label: string };

type LeadFormValues = {
  title?: string;
  companyId?: string | null;
  contactId?: string | null;
  stage?: string;
  source?: string | null;
  estimatedValue?: number | null;
  appointmentDate?: Date | string | null;
  notes?: string | null;
};

export default function LeadForm({
  action,
  lead,
  contacts,
  companies,
  submitLabel,
  showStage = false,
}: {
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  lead?: LeadFormValues;
  contacts: Option[];
  companies: Option[];
  submitLabel: string;
  showStage?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  const appointmentValue = lead?.appointmentDate
    ? new Date(lead.appointmentDate).toISOString().slice(0, 16)
    : "";

  return (
    <form action={formAction} className="space-y-5">
      {state?.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {state.error}
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Deal title <span className="text-red-500">*</span>
        </label>
        <input
          name="title"
          defaultValue={lead?.title}
          required
          placeholder="e.g. Warehouse Roof Audit — Acme Corp"
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        {state?.fieldErrors?.title && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{state.fieldErrors.title}</p>}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Company <span className="text-red-500">*</span>
          </label>
          <select
            name="companyId"
            defaultValue={lead?.companyId ?? ""}
            required
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          >
            <option value="" disabled>
              Select a company
            </option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
          {state?.fieldErrors?.companyId && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">{state.fieldErrors.companyId}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Contact</label>
          <select
            name="contactId"
            defaultValue={lead?.contactId ?? ""}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          >
            <option value="">No contact</option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
          {state?.fieldErrors?.contactId && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">{state.fieldErrors.contactId}</p>
          )}
        </div>

        {showStage && (
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Starting stage</label>
            <select
              name="stage"
              defaultValue={lead?.stage ?? "NEW"}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            >
              {STAGE_ORDER.map((stage) => (
                <option key={stage} value={stage}>
                  {STAGE_LABELS[stage]}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Source</label>
          <input
            name="source"
            defaultValue={lead?.source ?? ""}
            placeholder="e.g. Referral, Website, Cold Outreach"
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Estimated value ($)</label>
          <input
            name="estimatedValue"
            type="number"
            min={0}
            step="0.01"
            defaultValue={lead?.estimatedValue ?? ""}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Appointment date</label>
          <input
            name="appointmentDate"
            type="datetime-local"
            defaultValue={appointmentValue}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Notes</label>
        <textarea
          name="notes"
          defaultValue={lead?.notes ?? ""}
          rows={4}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>

      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
