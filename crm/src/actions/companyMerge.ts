"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { normalizeCompanyName } from "@/lib/companyMatch";

// Merges `mergeId` into `keepId`: every relation moves to the kept
// company, the kept company's notes win (falling back to the merged
// company's only if it has none), and the merged company's manually-typed
// deal metrics (jobsPerMonth/pricePerHl) are discarded rather than
// overwriting the kept company's — real lead-report data supersedes those
// old estimates going forward. The merged company's name becomes an alias
// of the kept one so future lead uploads under that old name still match.
export async function mergeCompanies(mergeId: string, keepId: string): Promise<void> {
  if (mergeId === keepId) return;

  const [mergeCompany, keepCompany] = await Promise.all([
    prisma.company.findUnique({ where: { id: mergeId } }),
    prisma.company.findUnique({ where: { id: keepId } }),
  ]);
  if (!mergeCompany || !keepCompany) return;

  await prisma.$transaction([
    prisma.contact.updateMany({ where: { companyId: mergeId }, data: { companyId: keepId } }),
    prisma.reminder.updateMany({ where: { companyId: mergeId }, data: { companyId: keepId } }),
    prisma.journalEntry.updateMany({ where: { companyId: mergeId }, data: { companyId: keepId } }),
    prisma.onboardingFile.updateMany({ where: { companyId: mergeId }, data: { companyId: keepId } }),
    prisma.revenueEntry.updateMany({ where: { companyId: mergeId }, data: { companyId: keepId } }),
    prisma.leadReport.updateMany({ where: { companyId: mergeId }, data: { companyId: keepId } }),
    prisma.leadReportRow.updateMany({ where: { companyId: mergeId }, data: { companyId: keepId } }),
    prisma.companyAlias.updateMany({ where: { companyId: mergeId }, data: { companyId: keepId } }),
    ...(keepCompany.notes
      ? []
      : mergeCompany.notes
        ? [prisma.company.update({ where: { id: keepId }, data: { notes: mergeCompany.notes } })]
        : []),
  ]);

  const normalizedOldName = normalizeCompanyName(mergeCompany.name);
  if (normalizedOldName !== normalizeCompanyName(keepCompany.name)) {
    const existingAlias = await prisma.companyAlias.findUnique({ where: { alias: normalizedOldName } });
    if (!existingAlias) {
      await prisma.companyAlias.create({ data: { companyId: keepId, alias: normalizedOldName } }).catch(() => {});
    }
  }

  await prisma.company.delete({ where: { id: mergeId } });

  revalidatePath("/companies");
  revalidatePath("/account-management");
  revalidatePath(`/companies/${keepId}`);
  revalidatePath("/analytics");
  revalidatePath("/this-week");
  redirect(`/companies/${keepId}`);
}
