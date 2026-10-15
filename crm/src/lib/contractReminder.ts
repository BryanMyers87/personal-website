import { subDays, format } from "date-fns";
import { prisma } from "@/lib/prisma";

// Identifies the auto-generated contract-renewal reminder among a
// company's other reminders, so it can be kept in sync (updated, created,
// or removed) whenever the contract date changes, without disturbing any
// reminders set manually.
const CONTRACT_REMINDER_PREFIX = "Contract renewal:";

export async function syncContractReminder(companyId: string, contractDate: Date | null): Promise<void> {
  const existing = await prisma.reminder.findFirst({
    where: { companyId, completedAt: null, note: { startsWith: CONTRACT_REMINDER_PREFIX } },
  });

  if (!contractDate) {
    if (existing) await prisma.reminder.delete({ where: { id: existing.id } });
    return;
  }

  const dueAt = subDays(contractDate, 30);
  const note = `${CONTRACT_REMINDER_PREFIX} review before it expires on ${format(contractDate, "PP")}`;

  if (existing) {
    await prisma.reminder.update({ where: { id: existing.id }, data: { dueAt, note } });
  } else {
    await prisma.reminder.create({ data: { companyId, note, dueAt } });
  }
}
