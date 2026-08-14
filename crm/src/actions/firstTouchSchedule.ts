"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

// Read-only: returns every already-booked first-touch slot (as ISO
// strings) so the client can compute the next free one itself. Fetching
// everything rather than a date-bounded query sidesteps any server/client
// timezone mismatch around day boundaries — the dataset here is tiny.
export async function getScheduledFirstTouchSlots(): Promise<string[]> {
  const rows = await prisma.company.findMany({
    where: { firstTouchScheduledAt: { not: null } },
    select: { firstTouchScheduledAt: true },
  });
  return rows.map((row) => row.firstTouchScheduledAt!.toISOString());
}

export async function scheduleFirstTouchCall(companyId: string, scheduledAt: Date): Promise<void> {
  await prisma.company.update({ where: { id: companyId }, data: { firstTouchScheduledAt: scheduledAt } });
  revalidatePath(`/companies/${companyId}`);
}

export async function cancelFirstTouchSchedule(companyId: string): Promise<void> {
  await prisma.company.update({ where: { id: companyId }, data: { firstTouchScheduledAt: null } });
  revalidatePath(`/companies/${companyId}`);
}
