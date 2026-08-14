"use client";

import { useActionState } from "react";
import type { ActionState } from "@/actions/companies";
import { Button } from "@/components/ui";

type CompanyFormValues = {
  id?: string;
  name?: string;
  industry?: string | null;
  website?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  source?: string | null;
  jobsPerMonth?: number | null;
  pricePerHl?: number | null;
  appointmentDate?: Date | string | null;
  notes?: string | null;
};

export default function CompanyForm({
  action,
  company,
  submitLabel,
}: {
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  company?: CompanyFormValues;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  const appointmentValue = company?.appointmentDate
    ? new Date(company.appointmentDate).toISOString().slice(0, 16)
    : "";

  return (
    <form action={formAction} className="space-y-5">
      {state?.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {state.error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Company name" name="name" defaultValue={company?.name} error={state?.fieldErrors?.name} required />
        <Field label="Industry" name="industry" defaultValue={company?.industry ?? ""} error={state?.fieldErrors?.industry} />
        <Field label="Website" name="website" defaultValue={company?.website ?? ""} error={state?.fieldErrors?.website} />
        <Field label="Phone" name="phone" defaultValue={company?.phone ?? ""} error={state?.fieldErrors?.phone} />
        <Field label="Email" name="email" type="email" defaultValue={company?.email ?? ""} error={state?.fieldErrors?.email} />
        <Field label="Address" name="address" defaultValue={company?.address ?? ""} error={state?.fieldErrors?.address} />
        <Field label="City" name="city" defaultValue={company?.city ?? ""} error={state?.fieldErrors?.city} />
        <Field label="State" name="state" defaultValue={company?.state ?? ""} error={state?.fieldErrors?.state} />

        <Field label="Deal source" name="source" defaultValue={company?.source ?? ""} placeholder="e.g. Referral, Website, Cold Outreach" />

        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Jobs per month</label>
          <input
            name="jobsPerMonth"
            type="number"
            min={0}
            step="0.1"
            defaultValue={company?.jobsPerMonth ?? ""}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Price per HL/HG ($)</label>
          <input
            name="pricePerHl"
            type="number"
            min={0}
            step="0.01"
            defaultValue={company?.pricePerHl ?? ""}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Meeting / appointment date</label>
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
          defaultValue={company?.notes ?? ""}
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

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  placeholder,
  error,
  required,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  placeholder?: string;
  error?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
      />
      {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
