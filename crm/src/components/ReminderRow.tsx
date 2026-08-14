"use client";

import { useTransition } from "react";
import Link from "next/link";
import { format, isPast } from "date-fns";
import { clsx } from "clsx";
import { Trash2 } from "lucide-react";
import { toggleReminder, deleteReminder } from "@/actions/reminders";
import { Card } from "@/components/ui";

export type ReminderRowData = {
  id: string;
  note: string;
  dueAt: Date | string;
  companyId: string;
  companyName: string;
};

export default function ReminderRow({ reminder }: { reminder: ReminderRowData }) {
  const [isPending, startTransition] = useTransition();
  const overdue = isPast(new Date(reminder.dueAt));

  function handleDelete() {
    if (!window.confirm("Delete this reminder?")) return;
    startTransition(() => deleteReminder(reminder.id, reminder.companyId));
  }

  return (
    <Card className="flex items-center justify-between gap-3 p-3">
      <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          disabled={isPending}
          onChange={(e) => startTransition(() => toggleReminder(reminder.id, reminder.companyId, e.target.checked))}
          className="mt-1"
        />
        <span className="min-w-0">
          <p className="text-sm">{reminder.note}</p>
          <p className={clsx("text-xs", overdue ? "font-medium text-red-600 dark:text-red-400" : "text-zinc-400")}>
            {format(new Date(reminder.dueAt), "PPp")}
            {overdue ? " · Overdue" : ""}
          </p>
          <Link href={`/companies/${reminder.companyId}`} className="text-xs text-indigo-600 hover:underline dark:text-indigo-400">
            {reminder.companyName}
          </Link>
        </span>
      </label>
      <button
        type="button"
        disabled={isPending}
        onClick={handleDelete}
        aria-label="Delete reminder"
        className="shrink-0 text-zinc-400 transition-colors hover:text-red-600 disabled:opacity-50 dark:hover:text-red-400"
      >
        <Trash2 size={14} />
      </button>
    </Card>
  );
}
