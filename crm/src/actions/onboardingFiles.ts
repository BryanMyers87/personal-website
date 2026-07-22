"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

const MAX_FILES = 5;

export async function createOnboardingFile(contactId: string, label: string, url: string): Promise<void> {
  const trimmedLabel = label.trim();
  const trimmedUrl = url.trim();
  if (!trimmedLabel || !trimmedUrl) return;

  const count = await prisma.onboardingFile.count({ where: { contactId } });
  if (count >= MAX_FILES) return;

  await prisma.onboardingFile.create({
    data: { contactId, label: trimmedLabel, url: trimmedUrl, position: count + 1 },
  });

  revalidatePath(`/contacts/${contactId}`);
  revalidatePath("/file-tracker");
}

export async function toggleOnboardingFile(id: string, contactId: string, completed: boolean): Promise<void> {
  await prisma.onboardingFile.update({
    where: { id },
    data: { completedAt: completed ? new Date() : null },
  });

  revalidatePath(`/contacts/${contactId}`);
  revalidatePath("/file-tracker");
}

export async function deleteOnboardingFile(id: string, contactId: string): Promise<void> {
  await prisma.onboardingFile.delete({ where: { id } });

  revalidatePath(`/contacts/${contactId}`);
  revalidatePath("/file-tracker");
}
