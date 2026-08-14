"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { clsx } from "clsx";
import { Mail, StickyNote, Trash2 } from "lucide-react";
import { createJournalEntry, deleteJournalEntry, logEmail } from "@/actions/journal";
import { Button, Card } from "@/components/ui";

export type JournalEntryData = {
  id: string;
  body: string;
  kind: "NOTE" | "EMAIL";
  createdAt: Date | string;
};

export default function CompanyJournal({
  companyId,
  entries,
}: {
  companyId: string;
  entries: JournalEntryData[];
}) {
  const [mode, setMode] = useState<"note" | "email">("note");
  const [value, setValue] = useState("");
  const [subject, setSubject] = useState("");
  const [snippet, setSnippet] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleAddNote() {
    const body = value.trim();
    if (!body) return;
    setValue("");
    startTransition(() => {
      createJournalEntry(companyId, body);
    });
  }

  function handleLogEmail() {
    if (!subject.trim()) return;
    const s = subject;
    const b = snippet;
    setSubject("");
    setSnippet("");
    startTransition(() => {
      logEmail(companyId, s, b);
    });
  }

  function handleDelete(id: string) {
    if (!window.confirm("Delete this entry? This cannot be undone.")) return;
    startTransition(() => {
      deleteJournalEntry(id, companyId);
    });
  }

  return (
    <div>
      <div className="mb-3 flex gap-1.5">
        <button
          type="button"
          onClick={() => setMode("note")}
          className={clsx(
            "rounded-lg px-2.5 py-1 text-xs font-medium",
            mode === "note"
              ? "bg-indigo-600 text-white"
              : "border border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800",
          )}
        >
          Note
        </button>
        <button
          type="button"
          onClick={() => setMode("email")}
          className={clsx(
            "rounded-lg px-2.5 py-1 text-xs font-medium",
            mode === "email"
              ? "bg-indigo-600 text-white"
              : "border border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800",
          )}
        >
          Log Email
        </button>
      </div>

      {mode === "note" ? (
        <div className="mb-4 flex items-start gap-2">
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handleAddNote();
              }
            }}
            placeholder="Log a call, email, or meeting…"
            rows={2}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
          <Button type="button" disabled={isPending || !value.trim()} onClick={handleAddNote}>
            Add
          </Button>
        </div>
      ) : (
        <div className="mb-4 space-y-2 rounded-lg border border-dashed border-zinc-300 p-3 dark:border-zinc-700">
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject line"
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
          <textarea
            value={snippet}
            onChange={(e) => setSnippet(e.target.value)}
            placeholder="Paste a snippet of the email (optional)"
            rows={3}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
          <div className="flex justify-end">
            <Button type="button" disabled={isPending || !subject.trim()} onClick={handleLogEmail}>
              <Mail size={14} />
              Log Email
            </Button>
          </div>
        </div>
      )}

      {entries.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">No journal notes yet.</p>
      ) : (
        <ul className="space-y-3">
          {entries.map((entry) => (
            <li key={entry.id}>
              <Card className="flex items-start justify-between gap-3 p-3">
                <div className="flex min-w-0 items-start gap-2">
                  {entry.kind === "EMAIL" ? (
                    <Mail size={14} className="mt-0.5 shrink-0 text-indigo-500" />
                  ) : (
                    <StickyNote size={14} className="mt-0.5 shrink-0 text-zinc-400" />
                  )}
                  <div className="min-w-0">
                    <p className="whitespace-pre-wrap text-sm">{entry.body}</p>
                    <p className="mt-1 text-xs text-zinc-400">{format(new Date(entry.createdAt), "PPp")}</p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleDelete(entry.id)}
                  aria-label="Delete entry"
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
