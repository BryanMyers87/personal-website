"use client";

import { useState, useTransition } from "react";
import { clsx } from "clsx";
import { Mail, Phone, Pencil, Star, Trash2, X } from "lucide-react";
import { updateContact, deleteContact, setDecisionMaker, type ContactFields } from "@/actions/contacts";
import { Button } from "@/components/ui";

export type ContactData = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  title: string | null;
  isDecisionMaker: boolean;
};

export default function ContactRow({ contact, companyId }: { contact: ContactData; companyId: string }) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [fields, setFields] = useState<ContactFields>({
    firstName: contact.firstName,
    lastName: contact.lastName,
    email: contact.email ?? "",
    phone: contact.phone ?? "",
    title: contact.title ?? "",
  });

  function handleSave() {
    startTransition(() => {
      updateContact(contact.id, companyId, fields);
    });
    setEditing(false);
  }

  function handleDelete() {
    if (!window.confirm(`Remove ${contact.firstName} ${contact.lastName}?`)) return;
    startTransition(() => deleteContact(contact.id, companyId));
  }

  function toggleDecisionMaker() {
    startTransition(() => setDecisionMaker(contact.id, companyId, !contact.isDecisionMaker));
  }

  if (editing) {
    return (
      <div className="space-y-3 rounded-lg border border-dashed border-zinc-300 p-3 dark:border-zinc-700">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <input
            value={fields.firstName}
            onChange={(e) => setFields((f) => ({ ...f, firstName: e.target.value }))}
            placeholder="First name"
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
          <input
            value={fields.lastName}
            onChange={(e) => setFields((f) => ({ ...f, lastName: e.target.value }))}
            placeholder="Last name"
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
          <input
            value={fields.title ?? ""}
            onChange={(e) => setFields((f) => ({ ...f, title: e.target.value }))}
            placeholder="Job title"
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
          <input
            value={fields.phone ?? ""}
            onChange={(e) => setFields((f) => ({ ...f, phone: e.target.value }))}
            placeholder="Phone"
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
          <input
            value={fields.email ?? ""}
            onChange={(e) => setFields((f) => ({ ...f, email: e.target.value }))}
            type="email"
            placeholder="Email"
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 sm:col-span-2"
          />
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800"
          >
            <X size={13} /> Cancel
          </button>
          <Button type="button" disabled={isPending || !fields.firstName.trim() || !fields.lastName.trim()} onClick={handleSave}>
            Save
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <p className="truncate text-sm font-medium">
            {contact.firstName} {contact.lastName}
          </p>
          {contact.isDecisionMaker && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-300">
              <Star size={10} className="fill-current" /> Key Decision Maker
            </span>
          )}
        </div>
        {contact.title && <p className="text-xs text-zinc-500 dark:text-zinc-400">{contact.title}</p>}
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
          {contact.phone && (
            <span className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
              <Phone size={11} /> {contact.phone}
            </span>
          )}
          {contact.email && (
            <span className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
              <Mail size={11} /> {contact.email}
            </span>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          disabled={isPending}
          onClick={toggleDecisionMaker}
          aria-label="Toggle Key Decision Maker"
          title="Key Decision Maker"
          className={clsx(
            "rounded-lg p-1.5 transition-colors disabled:opacity-50",
            contact.isDecisionMaker
              ? "text-amber-500 hover:text-amber-600"
              : "text-zinc-300 hover:text-amber-500 dark:text-zinc-600",
          )}
        >
          <Star size={15} className={contact.isDecisionMaker ? "fill-current" : ""} />
        </button>
        <button
          type="button"
          onClick={() => setEditing(true)}
          aria-label="Edit contact"
          className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:text-zinc-700 dark:hover:text-zinc-200"
        >
          <Pencil size={14} />
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={handleDelete}
          aria-label="Remove contact"
          className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:text-red-600 disabled:opacity-50 dark:hover:text-red-400"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
