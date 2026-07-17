"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { Trash2 } from "lucide-react";
import { createJournalEntry, deleteJournalEntry } from "@/actions/journal";
import { Button, Card } from "@/components/ui";

export type JournalEntryData = { id: string; body: string; createdAt: Date | string };

export default function ContactJournal({
  contactId,
  entries,
}: {
  contactId: string;
  entries: JournalEntryData[];
}) {
  const [value, setValue] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleAdd() {
    const body = value.trim();
    if (!body) return;
    setValue("");
    startTransition(() => {
      createJournalEntry(contactId, body);
    });
  }

  function handleDelete(id: string) {
    if (!window.confirm("Delete this note? This cannot be undone.")) return;
    startTransition(() => {
      deleteJournalEntry(id, contactId);
    });
  }

  return (
    <div>
      <div className="mb-4 flex items-start gap-2">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              handleAdd();
            }
          }}
          placeholder="Log a call, email, or meeting…"
          rows={2}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <Button type="button" disabled={isPending || !value.trim()} onClick={handleAdd}>
          Add
        </Button>
      </div>

      {entries.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">No journal notes yet.</p>
      ) : (
        <ul className="space-y-3">
          {entries.map((entry) => (
            <li key={entry.id}>
              <Card className="flex items-start justify-between gap-3 p-3">
                <div className="min-w-0">
                  <p className="whitespace-pre-wrap text-sm">{entry.body}</p>
                  <p className="mt-1 text-xs text-zinc-400">{format(new Date(entry.createdAt), "PPp")}</p>
                </div>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleDelete(entry.id)}
                  aria-label="Delete note"
                  className="shrink-0 text-zinc-400 transition-colors hover:text-red-600 disabled:opacity-50 dark:hover:text-red-400"
                >
                  <Trash2 size={14} />
                </button>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
