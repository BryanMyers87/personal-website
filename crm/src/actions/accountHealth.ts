"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { AccountHealth } from "@/generated/prisma/enums";
import type { HealthTierValue } from "@/lib/accountHealth";

export async function setAccountHealth(contactId: string, tier: HealthTierValue | ""): Promise<void> {
  await prisma.contact.update({
    where: { id: contactId },
    data: { healthTier: tier === "" ? null : (tier as AccountHealth) },
  });

  revalidatePath("/account-management");
  revalidatePath(`/contacts/${contactId}`);
}
