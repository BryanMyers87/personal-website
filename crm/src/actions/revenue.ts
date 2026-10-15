"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function createRevenueEntry(
  companyId: string,
  amount: number,
  receivedAt: string,
  note?: string,
): Promise<void> {
  if (!companyId || !Number.isFinite(amount) || amount <= 0 || !receivedAt) return;
  const date = new Date(receivedAt);
  if (Number.isNaN(date.getTime())) return;

  await prisma.revenueEntry.create({
    data: { companyId, amount, receivedAt: date, note: note?.trim() || null },
  });

  revalidatePath("/analytics");
}

export async function deleteRevenueEntry(id: string): Promise<void> {
  await prisma.revenueEntry.delete({ where: { id } });
  revalidatePath("/analytics");
}
