"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { OutreachStatusValue } from "@/lib/hitListStatus";
import { DealStage } from "@/generated/prisma/enums";
import { ensureNextReminder } from "@/lib/nextReminder";

export async function setHitListOutreachStatus(id: string, status: OutreachStatusValue): Promise<void> {
  await prisma.hitListEntry.update({
    where: { id },
    data: {
      outreachStatus: status,
      contactedAt: status === "NOT_CONTACTED" ? null : new Date(),
    },
  });
  // Not Interested entries move out of the Hit List and into the Holding
  // Tank (and back again if reverted), so both pages need refreshing.
  revalidatePath("/hit-list");
  revalidatePath("/holding-tank");
}

// Creates (or reuses) the Company — the company IS the deal now, so this
// drops it straight into the pipeline at Prospect — deletes the entry
// (it's moved into the pipeline now, so it has no reason to keep showing
// up in the Hit List), then lands on the company page to attach contacts.
export async function addHitListEntryToPipeline(id: string): Promise<void> {
  const entry = await prisma.hitListEntry.findUnique({ where: { id } });
  if (!entry) return;

  let company = await prisma.company.findFirst({
    where: { name: { equals: entry.companyName, mode: "insensitive" } },
  });

  if (!company) {
    company = await prisma.company.create({
      data: {
        name: entry.companyName,
        website: entry.website,
        phone: entry.phone,
        email: entry.email,
        city: entry.city,
        stageHistory: {
          create: { fromStage: null, toStage: DealStage.PROSPECT },
        },
      },
    });
    await ensureNextReminder(company.id, company.name);
  }

  await prisma.hitListEntry.delete({ where: { id } });

  revalidatePath("/hit-list");
  revalidatePath("/companies");
  revalidatePath("/pipeline");
  redirect(`/companies/${company.id}`);
}
