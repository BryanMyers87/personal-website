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
  revalidatePath("/hit-list");
}

// Creates (or reuses) the Company, links the entry to it, then hands off to
// the New Contact form — the entry itself never becomes a Contact, since a
// person still needs to be attached by hand.
export async function addHitListEntryToPipeline(id: string): Promise<void> {
  const entry = await prisma.hitListEntry.findUnique({ where: { id } });
  if (!entry || entry.convertedCompanyId) return;

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

  await prisma.hitListEntry.update({
    where: { id },
    data: { convertedCompanyId: company.id, convertedAt: new Date() },
  });

  revalidatePath("/hit-list");
  redirect(`/contacts/new?companyId=${company.id}`);
}
