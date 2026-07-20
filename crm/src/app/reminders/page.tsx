import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
import RemindersOverview from "@/components/RemindersOverview";

// A day-to-day work list; never serve a stale build-time snapshot.
export const dynamic = "force-dynamic";

export default async function RemindersPage() {
  const reminders = await prisma.reminder.findMany({
    where: { completedAt: null },
    include: {
      contact: { select: { firstName: true, lastName: true, company: { select: { name: true } } } },
    },
    orderBy: { dueAt: "asc" },
  });

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
      <RemindersOverview reminders={items} />
    </div>
  );
}
