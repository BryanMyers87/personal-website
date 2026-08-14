"use client";

import { useState, useTransition } from "react";
import { Star } from "lucide-react";
import { createContact } from "@/actions/contacts";
import { Button } from "@/components/ui";
import ContactRow, { type ContactData } from "@/components/ContactRow";

export default function ContactList({ companyId, contacts }: { companyId: string; contacts: ContactData[] }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [title, setTitle] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [isDecisionMaker, setIsDecisionMaker] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleAdd() {
    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();
    if (!trimmedFirst || !trimmedLast) return;
    setFirstName("");
    setLastName("");
    setTitle("");
    setPhone("");
    setEmail("");
    setIsDecisionMaker(false);
    startTransition(() => {
      createContact(companyId, { firstName: trimmedFirst, lastName: trimmedLast, title, phone, email, isDecisionMaker });
    });
  }

  return (
    <div>
      <div className="mb-4 space-y-2 rounded-lg border border-dashed border-zinc-300 p-3 dark:border-zinc-700">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="First name"
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
          <input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Last name"
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Job title"
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone"
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="Email"
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 sm:col-span-2"
          />
        </div>
        <div className="flex items-center justify-between">
          <label className="flex cursor-pointer items-center gap-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-300">
            <input
              type="checkbox"
              checked={isDecisionMaker}
              onChange={(e) => setIsDecisionMaker(e.target.checked)}
            />
            <Star size={12} /> Key Decision Maker
          </label>
          <Button type="button" disabled={isPending || !firstName.trim() || !lastName.trim()} onClick={handleAdd}>
            Add Contact
          </Button>
        </div>
      </div>

      {contacts.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">No contacts attached yet.</p>
      ) : (
        <div className="space-y-2">
          {contacts.map((contact) => (
            <ContactRow key={contact.id} contact={contact} companyId={companyId} />
          ))}
        </div>
      )}
    </div>
  );
}
