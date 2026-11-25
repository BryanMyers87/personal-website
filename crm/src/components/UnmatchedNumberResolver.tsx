"use client";

import { useState, useTransition } from "react";
import { resolveUnmatchedNumber, ignoreUnmatchedNumber } from "@/actions/communicationImport";
import { Button } from "@/components/ui";

type CompanyOption = {
  id: string;
  name: string;
  contacts: { id: string; firstName: string; lastName: string }[];
};

const NEW_CONTACT = "__new__";
const NO_CONTACT = "";

export default function UnmatchedNumberResolver({
  rawNumber,
  companies,
}: {
  rawNumber: string;
  companies: CompanyOption[];
}) {
  const [companyId, setCompanyId] = useState("");
  const [contactChoice, setContactChoice] = useState(NO_CONTACT);
  const [newContactName, setNewContactName] = useState("");
  const [isPending, startTransition] = useTransition();

  const selectedCompany = companies.find((c) => c.id === companyId);

  function handleSave() {
    if (!companyId) return;
    const contactId = contactChoice === NEW_CONTACT || contactChoice === NO_CONTACT ? null : contactChoice;
    const name = contactChoice === NEW_CONTACT ? newContactName : null;
    startTransition(() => resolveUnmatchedNumber(rawNumber, companyId, contactId, name));
  }

  function handleIgnore() {
    if (!window.confirm(`Ignore ${rawNumber}? It won't show up again, even in future uploads.`)) return;
    startTransition(() => ignoreUnmatchedNumber(rawNumber));
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={companyId}
        disabled={isPending}
        onChange={(e) => {
          setCompanyId(e.target.value);
          setContactChoice(NO_CONTACT);
        }}
        className="rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-900"
      >
        <option value="">Assign to company…</option>
        {companies.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      {selectedCompany && (
        <select
          value={contactChoice}
          disabled={isPending}
          onChange={(e) => setContactChoice(e.target.value)}
          className="rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-900"
        >
          <option value={NO_CONTACT}>No specific person</option>
          {selectedCompany.contacts.map((c) => (
            <option key={c.id} value={c.id}>
              {c.firstName} {c.lastName}
            </option>
          ))}
          <option value={NEW_CONTACT}>+ New contact…</option>
        </select>
      )}

      {contactChoice === NEW_CONTACT && (
        <input
          value={newContactName}
          disabled={isPending}
          onChange={(e) => setNewContactName(e.target.value)}
          placeholder="Contact name"
          className="rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-900"
        />
      )}

      <Button type="button" variant="secondary" disabled={isPending || !companyId} onClick={handleSave}>
        Save
      </Button>
      <Button type="button" variant="danger" disabled={isPending} onClick={handleIgnore}>
        Ignore
      </Button>
    </div>
  );
}
