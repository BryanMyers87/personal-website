import { AlertTriangle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
import RemindersOverview from "@/components/RemindersOverview";
import { backfillMissingReminders } from "@/actions/backfillReminders";

// A day-to-day work list; never serve a stale build-time snapshot.
export const dynamic = "force-dynamic";

export default async function RemindersPage() {
  const [reminders, missingCount] = await Promise.all([
    prisma.reminder.findMany({
      where: { completedAt: null },
      include: {
        contact: { select: { firstName: true, lastName: true, company: { select: { name: true } } } },
      },
      orderBy: { dueAt: "asc" },
    }),
    prisma.contact.count({
      where: { status: { not: "LOST" }, reminders: { none: { completedAt: null } } },
    }),
  ]);

  const items = reminders.map((reminder) => ({
    id: reminder.id,
    note: reminder.note,
    dueAt: reminder.dueAt,
    contactId: reminder.contactId,
    contactName: `${reminder.contact.firstName} ${reminder.contact.lastName}`,
    companyName: reminder.contact.company?.name ?? null,
  }));

  return (
    <div>
      <PageHeader title="Reminders" description="Every open reminder across all contacts, organized by due date." />

      {missingCount > 0 && (
        <form
          action={backfillMissingReminders}
          className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200"
        >
          <span className="flex items-center gap-2">
            <AlertTriangle size={16} className="shrink-0" />
            {missingCount} contact{missingCount === 1 ? "" : "s"} in the pipeline or won have no next reminder set —
            it&apos;s mandatory for every one of them.
          </span>
          <button
            type="submit"
            className="shrink-0 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-500"
          >
            Create placeholder reminders
          </button>
        </form>
      )}

      <RemindersOverview reminders={items} />
    </div>
  );
}
