"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ensureNextReminder } from "@/lib/nextReminder";

// One-time (safe to re-run) sweep for companies that predate the "every
// pipeline/won company must have a next reminder" rule, or that otherwise
// slipped through. status: not LOST covers both "anything in the pipeline"
// (OPEN) and "won accounts" (WON) in one filter, matching Holding Tank
// (LOST) being explicitly exempt.
export async function backfillMissingReminders(): Promise<void> {
  const companies = await prisma.company.findMany({
    where: {
      status: { not: "LOST" },
      reminders: { none: { completedAt: null } },
    },
    select: { id: true, name: true },
  });

  for (const company of companies) {
    await ensureNextReminder(company.id, company.name);
  }

  revalidatePath("/reminders");
  revalidatePath("/pipeline");
  revalidatePath("/account-management");
}
