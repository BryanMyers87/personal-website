"use client";

import { useTransition } from "react";
import Link from "next/link";
import { format, isPast, addDays, startOfDay, endOfDay } from "date-fns";
import { clsx } from "clsx";
import { Trash2 } from "lucide-react";
import { toggleReminder, deleteReminder } from "@/actions/reminders";
import { Card } from "@/components/ui";

export type OverviewReminder = {
  id: string;
  note: string;
  dueAt: Date | string;
  contactId: string;
  contactName: string;
  companyName: string | null;
};

function groupByDueDate(reminders: OverviewReminder[]) {
  const now = new Date();
  const todayEnd = endOfDay(now);
  const weekEnd = endOfDay(addDays(now, 7));

  const overdue: OverviewReminder[] = [];
  const today: OverviewReminder[] = [];
  const next7Days: OverviewReminder[] = [];
  const later: OverviewReminder[] = [];

  for (const reminder of reminders) {
    const due = new Date(reminder.dueAt);
    if (due < startOfDay(now)) overdue.push(reminder);
    else if (due <= todayEnd) today.push(reminder);
    else if (due <= weekEnd) next7Days.push(reminder);
    else later.push(reminder);
  }

  return [
    { label: "Overdue", items: overdue },
    { label: "Today", items: today },
    { label: "Next 7 Days", items: next7Days },
    { label: "Later", items: later },
  ].filter((group) => group.items.length > 0);
}

export default function RemindersOverview({ reminders }: { reminders: OverviewReminder[] }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete(id: string, contactId: string) {
    if (!window.confirm("Delete this reminder?")) return;
    startTransition(() => deleteReminder(id, contactId));
  }

  const groups = groupByDueDate(reminders);

  if (groups.length === 0) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">No open reminders across any contact — you&apos;re caught up.</p>
    );
  }

  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <div key={group.label}>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            {group.label} <span className="ml-1 font-normal text-zinc-400">({group.items.length})</span>
          </h2>
          <ul className="space-y-2">
            {group.items.map((reminder) => {
              const overdue = isPast(new Date(reminder.dueAt));
              return (
                <li key={reminder.id}>
                  <Card className="flex items-center justify-between gap-3 p-3">
                    <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-3">
                      <input
                        type="checkbox"
                        disabled={isPending}
                        onChange={(e) => startTransition(() => toggleReminder(reminder.id, reminder.contactId, e.target.checked))}
                        className="mt-1"
                      />
                      <span className="min-w-0">
                        <p className="text-sm">{reminder.note}</p>
                        <p className={clsx("text-xs", overdue ? "font-medium text-red-600 dark:text-red-400" : "text-zinc-400")}>
                          {format(new Date(reminder.dueAt), "PPp")}
                          {overdue ? " · Overdue" : ""}
                        </p>
                        <Link
                          href={`/contacts/${reminder.contactId}`}
                          className="text-xs text-indigo-600 hover:underline dark:text-indigo-400"
                        >
                          {reminder.contactName}
                          {reminder.companyName ? ` · ${reminder.companyName}` : ""}
                        </Link>
                      </span>
                    </label>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleDelete(reminder.id, reminder.contactId)}
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
        </div>
      ))}
    </div>
  );
}
