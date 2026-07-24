"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

// Read-only: returns every already-booked first-touch slot (as ISO
// strings) so the client can compute the next free one itself. Fetching
// everything rather than a date-bounded query sidesteps any server/client
// timezone mismatch around day boundaries — the dataset here is tiny.
export async function getScheduledFirstTouchSlots(): Promise<string[]> {
  const rows = await prisma.contact.findMany({
    where: { firstTouchScheduledAt: { not: null } },
    select: { firstTouchScheduledAt: true },
  });
  return rows.map((row) => row.firstTouchScheduledAt!.toISOString());
}

export async function scheduleFirstTouchCall(contactId: string, scheduledAt: Date): Promise<void> {
  await prisma.contact.update({ where: { id: contactId }, data: { firstTouchScheduledAt: scheduledAt } });
  revalidatePath(`/contacts/${contactId}`);
}

export async function cancelFirstTouchSchedule(contactId: string): Promise<void> {
  await prisma.contact.update({ where: { id: contactId }, data: { firstTouchScheduledAt: null } });
  revalidatePath(`/contacts/${contactId}`);
}
