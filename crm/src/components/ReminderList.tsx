"use client";

import { useState, useTransition } from "react";
import { format, isPast } from "date-fns";
import { clsx } from "clsx";
import { Trash2 } from "lucide-react";
import { createReminder, toggleReminder, deleteReminder } from "@/actions/reminders";
import { Button, Card } from "@/components/ui";

export type ReminderData = {
  id: string;
  note: string;
  dueAt: Date | string;
  completedAt: Date | string | null;
};

export default function ReminderList({ contactId, reminders }: { contactId: string; reminders: ReminderData[] }) {
  const [note, setNote] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleAdd() {
    const trimmed = note.trim();
    if (!trimmed || !dueAt) return;
    const due = dueAt;
    setNote("");
    setDueAt("");
    startTransition(() => {
      createReminder(contactId, trimmed, due);
    });
  }

  function handleDelete(id: string) {
    if (!window.confirm("Delete this reminder?")) return;
    startTransition(() => deleteReminder(id, contactId));
  }

  const sorted = [...reminders].sort((a, b) => {
    if (!!a.completedAt !== !!b.completedAt) return a.completedAt ? 1 : -1;
    return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
  });

  return (
    <div>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Reminder — e.g. Check in about renewal"
          className="w-full flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <input
          type="datetime-local"
          value={dueAt}
          onChange={(e) => setDueAt(e.target.value)}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <Button type="button" disabled={isPending || !note.trim() || !dueAt} onClick={handleAdd}>
          Add
        </Button>
      </div>

      {sorted.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">No reminders set.</p>
      ) : (
        <ul className="space-y-2">
          {sorted.map((reminder) => {
            const overdue = !reminder.completedAt && isPast(new Date(reminder.dueAt));
            return (
              <li key={reminder.id}>
                <Card className={clsx("flex items-center justify-between gap-3 p-3", reminder.completedAt && "opacity-60")}>
                  <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      checked={!!reminder.completedAt}
                      disabled={isPending}
                      onChange={(e) => startTransition(() => toggleReminder(reminder.id, contactId, e.target.checked))}
                      className="mt-1"
                    />
                    <span className="min-w-0">
                      <p className={clsx("text-sm", reminder.completedAt && "line-through")}>{reminder.note}</p>
                      <p
                        className={clsx(
                          "text-xs",
                          overdue ? "font-medium text-red-600 dark:text-red-400" : "text-zinc-400",
                        )}
                      >
                        {format(new Date(reminder.dueAt), "PPp")}
                        {overdue ? " · Overdue" : ""}
                      </p>
                    </span>
                  </label>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleDelete(reminder.id)}
                    aria-label="Delete reminder"
                    className="shrink-0 text-zinc-400 transition-colors hover:text-red-600 disabled:opacity-50 dark:hover:text-red-400"
                  >
                    <Trash2 size={14} />
                  </button>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
