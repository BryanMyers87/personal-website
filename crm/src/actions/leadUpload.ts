"use server";

import { createHash } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DealStage, DealStatus, LeadImportSource, LeadRowStatus } from "@/generated/prisma/enums";
import { parseFridayReportCsv, parseHistoryCsv } from "@/lib/leadCsv";
import { buildCompanyMatchIndex, matchCompanyId, normalizeCompanyName } from "@/lib/companyMatch";

export type UploadLeadBatchState = { error?: string } | undefined;

function toDate(value: FormDataEntryValue | null): Date | null {
  if (typeof value !== "string" || !value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function uploadLeadBatch(
  _prevState: UploadLeadBatchState,
  formData: FormData,
): Promise<UploadLeadBatchState> {
  const file = formData.get("file");
  const periodStart = toDate(formData.get("periodStart"));
  const periodEnd = toDate(formData.get("periodEnd"));

  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a CSV file to upload." };
  }
  if (!periodStart || !periodEnd) {
    return { error: "Both period dates are required." };
  }

  const csvText = await file.text();
  const fileHash = createHash("sha256").update(csvText).digest("hex");
  const rows = parseFridayReportCsv(csvText);
  if (rows.length === 0) {
    return { error: "No rows found in that file." };
  }

  const [companies, aliases] = await Promise.all([
    prisma.company.findMany({ select: { id: true, name: true } }),
    prisma.companyAlias.findMany({ select: { alias: true, companyId: true } }),
  ]);
  const matchIndex = buildCompanyMatchIndex(companies, aliases);

  const rowsData = rows.map((row) => {
    if (row.leads === 0) {
      return {
        rawCompanyName: row.company,
        industry: row.industry,
        leads: row.leads,
        appsBooked: row.appsBooked,
        billedToContractor: row.billedToContractor,
        dnq: row.dnq,
        status: LeadRowStatus.SKIPPED_ZERO,
      };
    }
    const companyId = matchCompanyId(row.company, matchIndex);
    return {
      rawCompanyName: row.company,
      industry: row.industry,
      leads: row.leads,
      appsBooked: row.appsBooked,
      billedToContractor: row.billedToContractor,
      dnq: row.dnq,
      status: companyId ? LeadRowStatus.MATCHED : LeadRowStatus.UNMATCHED,
      companyId,
    };
  });

  const batch = await prisma.leadReportBatch.create({
    data: {
      source: LeadImportSource.WEEKLY_UPLOAD,
      fileHash,
      fileName: file.name,
      periodStart,
      periodEnd,
      granularity: "WEEK",
      rows: { create: rowsData },
    },
  });

  redirect(`/leads/upload/${batch.id}`);
}

export async function uploadHistoryBatch(
  _prevState: UploadLeadBatchState,
  formData: FormData,
): Promise<UploadLeadBatchState> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a CSV file to upload." };
  }

  const csvText = await file.text();
  const fileHash = createHash("sha256").update(csvText).digest("hex");
  const rows = parseHistoryCsv(csvText);
  if (rows.length === 0) {
    return { error: "No rows found in that file." };
  }

  const [companies, aliases] = await Promise.all([
    prisma.company.findMany({ select: { id: true, name: true } }),
    prisma.companyAlias.findMany({ select: { alias: true, companyId: true } }),
  ]);
  const matchIndex = buildCompanyMatchIndex(companies, aliases);

  const periodStart = rows.reduce((min, r) => (r.periodStart < min ? r.periodStart : min), rows[0].periodStart);
  const periodEnd = rows.reduce((max, r) => (r.periodEnd > max ? r.periodEnd : max), rows[0].periodEnd);

  const rowsData = rows.map((row) => {
    if (row.leads === 0) {
      return {
        rawCompanyName: row.company,
        industry: row.industry,
        leads: row.leads,
        appsBooked: row.appsBooked,
        billedToContractor: row.billedToContractor,
        dnq: row.dnq,
        periodStart: row.periodStart,
        periodEnd: row.periodEnd,
        granularity: row.granularity,
        status: LeadRowStatus.SKIPPED_ZERO,
      };
    }
    const companyId = matchCompanyId(row.company, matchIndex);
    return {
      rawCompanyName: row.company,
      industry: row.industry,
      leads: row.leads,
      appsBooked: row.appsBooked,
      billedToContractor: row.billedToContractor,
      dnq: row.dnq,
      periodStart: row.periodStart,
      periodEnd: row.periodEnd,
      granularity: row.granularity,
      status: companyId ? LeadRowStatus.MATCHED : LeadRowStatus.UNMATCHED,
      companyId,
    };
  });

  const batch = await prisma.leadReportBatch.create({
    data: {
      source: LeadImportSource.ONE_TIME_IMPORT,
      fileHash,
      fileName: file.name,
      periodStart,
      periodEnd,
      granularity: rows[0].granularity,
      rows: { create: rowsData },
    },
  });

  redirect(`/leads/upload/${batch.id}`);
}

export async function matchLeadRow(rowId: string, companyId: string): Promise<void> {
  const row = await prisma.leadReportRow.update({
    where: { id: rowId },
    data: { companyId, status: LeadRowStatus.MATCHED },
    select: { batchId: true, rawCompanyName: true },
  });

  const normalizedAlias = normalizeCompanyName(row.rawCompanyName);
  const existingAlias = await prisma.companyAlias.findUnique({ where: { alias: normalizedAlias } });
  if (!existingAlias) {
    await prisma.companyAlias.create({ data: { companyId, alias: normalizedAlias } }).catch(() => {});
  }

  revalidatePath(`/leads/upload/${row.batchId}`);
}

export async function createCompanyForLeadRow(rowId: string): Promise<void> {
  const row = await prisma.leadReportRow.findUnique({ where: { id: rowId } });
  if (!row) return;

  const company = await prisma.company.create({
    data: {
      name: row.rawCompanyName,
      industry: row.industry,
      stage: DealStage.RELATIONSHIP_MANAGEMENT,
      status: DealStatus.WON,
      closedAt: new Date(),
      stageHistory: { create: { fromStage: null, toStage: DealStage.RELATIONSHIP_MANAGEMENT } },
    },
  });

  await prisma.leadReportRow.update({
    where: { id: rowId },
    data: { companyId: company.id, status: LeadRowStatus.MATCHED },
  });

  revalidatePath(`/leads/upload/${row.batchId}`);
  revalidatePath("/companies");
  revalidatePath("/account-management");
}

export async function commitLeadBatch(batchId: string): Promise<void> {
  const batch = await prisma.leadReportBatch.findUnique({
    where: { id: batchId },
    include: { rows: true },
  });
  if (!batch) return;

  const unresolved = batch.rows.filter((r) => r.status === LeadRowStatus.UNMATCHED);
  if (unresolved.length > 0) return;

  const matchedRows = batch.rows.filter((r) => r.status === LeadRowStatus.MATCHED && r.companyId);

  for (const row of matchedRows) {
    const rowPeriodStart = row.periodStart ?? batch.periodStart;
    const rowPeriodEnd = row.periodEnd ?? batch.periodEnd;
    const rowGranularity = row.granularity ?? batch.granularity;
    await prisma.leadReport.upsert({
      where: {
        companyId_periodStart_periodEnd: {
          companyId: row.companyId!,
          periodStart: rowPeriodStart,
          periodEnd: rowPeriodEnd,
        },
      },
      update: {
        leads: row.leads,
        appsBooked: row.appsBooked,
        billedToContractor: row.billedToContractor,
        dnq: row.dnq,
        industry: row.industry,
        batchId: batch.id,
      },
      create: {
        companyId: row.companyId!,
        periodStart: rowPeriodStart,
        periodEnd: rowPeriodEnd,
        granularity: rowGranularity,
        leads: row.leads,
        appsBooked: row.appsBooked,
        billedToContractor: row.billedToContractor,
        dnq: row.dnq,
        industry: row.industry,
        batchId: batch.id,
      },
    });
  }

  await prisma.leadReportBatch.update({ where: { id: batch.id }, data: { committedAt: new Date() } });

  revalidatePath(`/leads/upload/${batch.id}`);
  revalidatePath("/account-management");
  revalidatePath("/this-week");
  for (const row of matchedRows) {
    revalidatePath(`/companies/${row.companyId}`);
  }

  redirect("/account-management");
}
