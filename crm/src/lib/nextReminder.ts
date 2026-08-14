import { prisma } from "@/lib/prisma";

// Every company in the pipeline or won (Relationship Management) is
// required to have a next reminder set. If one isn't already open, this
// drops a nag reminder into /reminders so the gap doesn't go unnoticed.
// Safe to call repeatedly — it's a no-op once any open reminder exists.
export async function ensureNextReminder(companyId: string, companyName: string): Promise<void> {
  const openCount = await prisma.reminder.count({ where: { companyId, completedAt: null } });
  if (openCount > 0) return;

  await prisma.reminder.create({
    data: {
      companyId,
      note: `Set a next-touch reminder for ${companyName}`,
      dueAt: new Date(),
    },
  });
}
