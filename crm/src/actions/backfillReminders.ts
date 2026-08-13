"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ensureNextReminder } from "@/lib/nextReminder";

// One-time (safe to re-run) sweep for contacts that predate the "every
// pipeline/won contact must have a next reminder" rule, or that otherwise
// slipped through. status: not LOST covers both "anything in the pipeline"
// (OPEN) and "won accounts" (WON) in one filter, matching Holding Tank
// (LOST) being explicitly exempt.
export async function backfillMissingReminders(): Promise<void> {
  const contacts = await prisma.contact.findMany({
    where: {
      status: { not: "LOST" },
      reminders: { none: { completedAt: null } },
    },
    select: { id: true, firstName: true, lastName: true },
  });

  for (const contact of contacts) {
    await ensureNextReminder(contact.id, `${contact.firstName} ${contact.lastName}`);
  }

  revalidatePath("/reminders");
  revalidatePath("/pipeline");
  revalidatePath("/account-management");
}
