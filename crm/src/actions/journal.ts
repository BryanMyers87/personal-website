"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function createJournalEntry(contactId: string, body: string): Promise<void> {
  const trimmed = body.trim();
  if (!trimmed) return;

  await prisma.journalEntry.create({ data: { contactId, body: trimmed } });
  revalidatePath(`/contacts/${contactId}`);
}

export async function deleteJournalEntry(id: string, contactId: string): Promise<void> {
  await prisma.journalEntry.delete({ where: { id } });
  revalidatePath(`/contacts/${contactId}`);
}
