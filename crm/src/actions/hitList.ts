"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { OutreachStatusValue } from "@/lib/hitListStatus";

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

// Creates (or reuses) the Company, deletes the entry — it's moved into the
// pipeline now, so it has no reason to keep showing up in the Hit List —
// then hands off to the New Contact form to attach the actual person.
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
      },
    });
  }

  await prisma.hitListEntry.delete({ where: { id } });

  revalidatePath("/hit-list");
  redirect(`/contacts/new?companyId=${company.id}`);
}
