import { addDays, startOfDay, endOfDay } from "date-fns";
import ReminderRow, { type ReminderRowData } from "@/components/ReminderRow";

export type OverviewReminder = ReminderRowData;

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
  const groups = groupByDueDate(reminders);

  if (groups.length === 0) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">No open reminders across any company — you&apos;re caught up.</p>
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
            {group.items.map((reminder) => (
              <li key={reminder.id}>
                <ReminderRow reminder={reminder} />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
