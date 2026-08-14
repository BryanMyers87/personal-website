"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

const MAX_FILES = 5;

export async function createOnboardingFile(companyId: string, label: string, url: string): Promise<void> {
  const trimmedLabel = label.trim();
  const trimmedUrl = url.trim();
  if (!trimmedLabel || !trimmedUrl) return;

  const count = await prisma.onboardingFile.count({ where: { companyId } });
  if (count >= MAX_FILES) return;

  await prisma.onboardingFile.create({
    data: { companyId, label: trimmedLabel, url: trimmedUrl, position: count + 1 },
  });

  revalidatePath(`/companies/${companyId}`);
  revalidatePath("/file-tracker");
}

export async function toggleOnboardingFile(id: string, companyId: string, completed: boolean): Promise<void> {
  await prisma.onboardingFile.update({
    where: { id },
    data: { completedAt: completed ? new Date() : null },
  });

  revalidatePath(`/companies/${companyId}`);
  revalidatePath("/file-tracker");
}

export async function deleteOnboardingFile(id: string, companyId: string): Promise<void> {
  await prisma.onboardingFile.delete({ where: { id } });

  revalidatePath(`/companies/${companyId}`);
  revalidatePath("/file-tracker");
}
