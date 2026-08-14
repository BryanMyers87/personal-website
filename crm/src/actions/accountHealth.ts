"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { AccountHealth } from "@/generated/prisma/enums";
import type { HealthTierValue } from "@/lib/accountHealth";

export async function setAccountHealth(companyId: string, tier: HealthTierValue | ""): Promise<void> {
  await prisma.company.update({
    where: { id: companyId },
    data: { healthTier: tier === "" ? null : (tier as AccountHealth) },
  });

  revalidatePath("/account-management");
  revalidatePath(`/companies/${companyId}`);
}
