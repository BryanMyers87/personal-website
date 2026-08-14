"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function createReminder(companyId: string, note: string, dueAt: string): Promise<void> {
  const trimmed = note.trim();
  if (!trimmed || !dueAt) return;
  const due = new Date(dueAt);
  if (Number.isNaN(due.getTime())) return;

  await prisma.reminder.create({ data: { companyId, note: trimmed, dueAt: due } });
  revalidatePath(`/companies/${companyId}`);
  revalidatePath("/reminders");
}

export async function toggleReminder(id: string, companyId: string, completed: boolean): Promise<void> {
  await prisma.reminder.update({
    where: { id },
    data: { completedAt: completed ? new Date() : null },
  });
  revalidatePath(`/companies/${companyId}`);
  revalidatePath("/reminders");
}

export async function deleteReminder(id: string, companyId: string): Promise<void> {
  await prisma.reminder.delete({ where: { id } });
  revalidatePath(`/companies/${companyId}`);
  revalidatePath("/reminders");
}
