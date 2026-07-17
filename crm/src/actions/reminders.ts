"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function createReminder(contactId: string, note: string, dueAt: string): Promise<void> {
  const trimmed = note.trim();
  if (!trimmed || !dueAt) return;
  const due = new Date(dueAt);
  if (Number.isNaN(due.getTime())) return;

  await prisma.reminder.create({ data: { contactId, note: trimmed, dueAt: due } });
  revalidatePath(`/contacts/${contactId}`);
}

export async function toggleReminder(id: string, contactId: string, completed: boolean): Promise<void> {
  await prisma.reminder.update({
    where: { id },
    data: { completedAt: completed ? new Date() : null },
  });
  revalidatePath(`/contacts/${contactId}`);
}

export async function deleteReminder(id: string, contactId: string): Promise<void> {
  await prisma.reminder.delete({ where: { id } });
  revalidatePath(`/contacts/${contactId}`);
}
