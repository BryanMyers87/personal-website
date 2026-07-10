"use client";

import { useActionState } from "react";
import type { ActionState } from "@/actions/contacts";
import { Button } from "@/components/ui";

type CompanyOption = { id: string; name: string };

type ContactFormValues = {
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string | null;
  phone?: string | null;
  title?: string | null;
  companyId?: string | null;
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
            name="companyId"
            defaultValue={contact?.companyId ?? ""}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          >
            <option value="">No company</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

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
  error,
  required,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
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
        required={required}
        className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
      />
      {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
