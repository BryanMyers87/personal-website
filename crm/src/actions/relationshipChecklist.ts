"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { RelationshipChecklistKey } from "@/lib/relationshipChecklist";

export async function setRelationshipChecklistItem(
  companyId: string,
  key: RelationshipChecklistKey,
  checked: boolean,
): Promise<void> {
  const value = checked ? new Date() : null;

  const data =
    key === "sop"
      ? { sopCompletedAt: value }
      : key === "contractCreated"
        ? { contractCreatedAt: value }
        : key === "contractSigned"
          ? { contractSignedAt: value }
          : key === "dropZoneCredentials"
            ? { dropZoneCredentialsAt: value }
            : { contractorAppOnboardedAt: value };

  await prisma.company.update({ where: { id: companyId }, data });
  revalidatePath(`/companies/${companyId}`);
}
