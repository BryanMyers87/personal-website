"use client";

import { useState, useActionState } from "react";
import type { ActionState } from "@/actions/contacts";
import { Button } from "@/components/ui";

const NEW_COMPANY = "__new__";

type CompanyOption = { id: string; name: string };

type ContactFormValues = {
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string | null;
  phone?: string | null;
  title?: string | null;
  companyId?: string | null;
  source?: string | null;
  jobsPerMonth?: number | null;
  pricePerHl?: number | null;
  appointmentDate?: Date | string | null;
  notes?: string | null;
};

export default function ContactForm({
  action,
  contact,
  companies,
  submitLabel,
}: {
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  contact?: ContactFormValues;
  companies: CompanyOption[];
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [companyChoice, setCompanyChoice] = useState(contact?.companyId ?? "");
  const isNewCompany = companyChoice === NEW_COMPANY;

  const appointmentValue = contact?.appointmentDate
    ? new Date(contact.appointmentDate).toISOString().slice(0, 16)
    : "";

  return (
    <form action={formAction} className="space-y-5">
      {state?.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {state.error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="First name" name="firstName" defaultValue={contact?.firstName} error={state?.fieldErrors?.firstName} required />
        <Field label="Last name" name="lastName" defaultValue={contact?.lastName} error={state?.fieldErrors?.lastName} required />
        <Field label="Email" name="email" type="email" defaultValue={contact?.email ?? ""} error={state?.fieldErrors?.email} />
        <Field label="Phone" name="phone" defaultValue={contact?.phone ?? ""} error={state?.fieldErrors?.phone} />
        <Field label="Job title" name="title" defaultValue={contact?.title ?? ""} error={state?.fieldErrors?.title} />

        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Company</label>
          <select
            name={isNewCompany ? undefined : "companyId"}
            value={companyChoice}
            onChange={(e) => setCompanyChoice(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          >
            <option value="">No company</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
            <option value={NEW_COMPANY}>+ Create new company…</option>
          </select>
        </div>

        <Field label="Deal source" name="source" defaultValue={contact?.source ?? ""} placeholder="e.g. Referral, Website, Cold Outreach" />

        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Jobs per month</label>
          <input
            name="jobsPerMonth"
            type="number"
            min={0}
            step="0.1"
            defaultValue={contact?.jobsPerMonth ?? ""}
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
            defaultValue={contact?.pricePerHl ?? ""}
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

      {isNewCompany && (
        <div className="space-y-4 rounded-lg border border-dashed border-zinc-300 p-4 dark:border-zinc-700">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              New company
            </p>
            <button
              type="button"
              onClick={() => setCompanyChoice("")}
              className="text-xs text-zinc-400 hover:underline"
            >
              Cancel
            </button>
          </div>
          <Field label="Company name" name="newCompanyName" required />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Industry" name="newCompanyIndustry" />
            <Field label="Website" name="newCompanyWebsite" />
            <Field label="Phone" name="newCompanyPhone" />
            <Field label="Email" name="newCompanyEmail" type="email" />
            <Field label="Address" name="newCompanyAddress" />
            <Field label="City" name="newCompanyCity" />
            <Field label="State" name="newCompanyState" />
          </div>
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Notes</label>
        <textarea
          name="notes"
          defaultValue={contact?.notes ?? ""}
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
