"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function createJournalEntry(companyId: string, body: string): Promise<void> {
  const trimmed = body.trim();
  if (!trimmed) return;

  await prisma.journalEntry.create({ data: { companyId, body: trimmed } });
  revalidatePath(`/companies/${companyId}`);
}

// Quick-add for logging an email without full inbox sync — paste the
// subject (and optionally a snippet of the body) and it lands in the same
// activity timeline as journal notes, just tagged so it's visually
// distinct and easy to spot later.
export async function logEmail(companyId: string, subject: string, snippet: string): Promise<void> {
  const trimmedSubject = subject.trim();
  if (!trimmedSubject) return;

  const trimmedSnippet = snippet.trim();
  const body = trimmedSnippet ? `${trimmedSubject}\n\n${trimmedSnippet}` : trimmedSubject;

  await prisma.journalEntry.create({ data: { companyId, body, kind: "EMAIL" } });
  revalidatePath(`/companies/${companyId}`);
}

export async function deleteJournalEntry(id: string, companyId: string): Promise<void> {
  await prisma.journalEntry.delete({ where: { id } });
  revalidatePath(`/companies/${companyId}`);
}
