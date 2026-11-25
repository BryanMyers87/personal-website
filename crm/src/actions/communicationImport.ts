"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { CommunicationKind, CommunicationStatus } from "@/generated/prisma/enums";
import {
  detectBackupKind,
  parseCallsXml,
  parseSmsXml,
  normalizePhoneNumber,
  callSummary,
  textSummary,
  attributeSummary,
  SKIP_SMS_TYPES,
  buildPhoneMatchIndex,
  buildIgnoredNumberSet,
} from "@/lib/communicationImport";

export type ImportCommunicationsState =
  | { error: string }
  | {
      summary: {
        kind: "calls" | "sms";
        total: number;
        matched: number;
        needsReview: number;
        ignored: number;
        skippedAlreadyImported: number;
        skippedNoise: number;
      };
    }
  | undefined;

function revalidateCompanies(companyIds: Set<string>) {
  revalidatePath("/companies");
  revalidatePath("/account-management");
  revalidatePath("/journal/unmatched-numbers");
  for (const id of companyIds) {
    revalidatePath(`/companies/${id}`);
  }
}

export async function importCommunications(
  _prevState: ImportCommunicationsState,
  formData: FormData,
): Promise<ImportCommunicationsState> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose an exported XML file to upload." };
  }

  const xmlText = await file.text();
  const kind = detectBackupKind(xmlText);
  if (!kind) {
    return { error: "That doesn't look like an SMS Backup & Restore export (expected a <calls> or <smses> file)." };
  }

  const [phoneIndex, ignoredNumbers] = await Promise.all([buildPhoneMatchIndex(), buildIgnoredNumberSet()]);

  let matched = 0;
  let needsReview = 0;
  let ignored = 0;
  let skippedAlreadyImported = 0;
  let skippedNoise = 0;
  const touchedCompanyIds = new Set<string>();

  type Row = { externalId: string; rawNumber: string; summary: string; occurredAt: Date };

  async function process(records: Row[]) {
    const existingIds = new Set(
      (
        await prisma.communicationLogEntry.findMany({
          where: { externalId: { in: records.map((r) => r.externalId) } },
          select: { externalId: true },
        })
      ).map((r) => r.externalId),
    );

    for (const record of records) {
      if (existingIds.has(record.externalId)) {
        skippedAlreadyImported++;
        continue;
      }

      const normalized = normalizePhoneNumber(record.rawNumber);

      if (normalized && ignoredNumbers.has(normalized)) {
        ignored++;
        await prisma.communicationLogEntry.create({
          data: {
            externalId: record.externalId,
            kind: kind === "calls" ? CommunicationKind.CALL : CommunicationKind.TEXT,
            rawNumber: normalized,
            summary: record.summary,
            status: CommunicationStatus.IGNORED,
            occurredAt: record.occurredAt,
          },
        });
        continue;
      }

      const match = normalized ? phoneIndex.get(normalized) : undefined;

      if (!match) {
        needsReview++;
        await prisma.communicationLogEntry.create({
          data: {
            externalId: record.externalId,
            kind: kind === "calls" ? CommunicationKind.CALL : CommunicationKind.TEXT,
            rawNumber: normalized ?? record.rawNumber,
            summary: record.summary,
            status: CommunicationStatus.UNMATCHED,
            occurredAt: record.occurredAt,
          },
        });
        continue;
      }

      const body = attributeSummary(record.summary, match.contactName);
      const entry = await prisma.journalEntry.create({
        data: { companyId: match.companyId, body, kind: "NOTE", createdAt: record.occurredAt },
      });
      await prisma.communicationLogEntry.create({
        data: {
          externalId: record.externalId,
          kind: kind === "calls" ? CommunicationKind.CALL : CommunicationKind.TEXT,
          rawNumber: normalized!,
          summary: record.summary,
          status: CommunicationStatus.MATCHED,
          companyId: match.companyId,
          journalEntryId: entry.id,
          occurredAt: record.occurredAt,
        },
      });
      matched++;
      touchedCompanyIds.add(match.companyId);
    }
  }

  let total = 0;
  if (kind === "calls") {
    const calls = parseCallsXml(xmlText);
    total = calls.length;
    await process(
      calls.map((c) => ({
        externalId: c.externalId,
        rawNumber: c.number,
        summary: callSummary(c.type, c.duration),
        occurredAt: new Date(c.date),
      })),
    );
  } else {
    const texts = parseSmsXml(xmlText);
    total = texts.length;
    const actionable = texts.filter((t) => !SKIP_SMS_TYPES.has(t.type));
    skippedNoise = texts.length - actionable.length;
    await process(
      actionable.map((t) => ({
        externalId: t.externalId,
        rawNumber: t.address,
        summary: textSummary(t.type, t.body),
        occurredAt: new Date(t.date),
      })),
    );
  }

  revalidateCompanies(touchedCompanyIds);
  return { summary: { kind, total, matched, needsReview, ignored, skippedAlreadyImported, skippedNoise } };
}

export type UnmatchedNumberGroup = {
  rawNumber: string;
  count: number;
  calls: number;
  texts: number;
  firstSeenAt: Date;
  lastSeenAt: Date;
  latestSummary: string;
};

export async function getUnmatchedNumberGroups(): Promise<UnmatchedNumberGroup[]> {
  const rows = await prisma.communicationLogEntry.findMany({
    where: { status: CommunicationStatus.UNMATCHED },
    orderBy: { occurredAt: "desc" },
    select: { rawNumber: true, kind: true, occurredAt: true, summary: true },
  });

  const groups = new Map<string, UnmatchedNumberGroup>();
  for (const row of rows) {
    const existing = groups.get(row.rawNumber);
    if (existing) {
      existing.count++;
      if (row.kind === "CALL") existing.calls++;
      else existing.texts++;
      if (row.occurredAt < existing.firstSeenAt) existing.firstSeenAt = row.occurredAt;
      if (row.occurredAt > existing.lastSeenAt) {
        existing.lastSeenAt = row.occurredAt;
        existing.latestSummary = row.summary;
      }
    } else {
      groups.set(row.rawNumber, {
        rawNumber: row.rawNumber,
        count: 1,
        calls: row.kind === "CALL" ? 1 : 0,
        texts: row.kind === "TEXT" ? 1 : 0,
        firstSeenAt: row.occurredAt,
        lastSeenAt: row.occurredAt,
        latestSummary: row.summary,
      });
    }
  }

  return Array.from(groups.values()).sort((a, b) => b.lastSeenAt.getTime() - a.lastSeenAt.getTime());
}

function splitName(fullName: string): { firstName: string; lastName: string } {
  const trimmed = fullName.trim();
  const spaceIdx = trimmed.indexOf(" ");
  if (spaceIdx === -1) return { firstName: trimmed, lastName: "" };
  return { firstName: trimmed.slice(0, spaceIdx), lastName: trimmed.slice(spaceIdx + 1) };
}

export async function resolveUnmatchedNumber(
  rawNumber: string,
  companyId: string,
  contactId: string | null,
  newContactName: string | null,
): Promise<void> {
  let resolvedContactId = contactId;
  let contactName: string | null = null;

  if (!resolvedContactId && newContactName?.trim()) {
    const { firstName, lastName } = splitName(newContactName);
    const contact = await prisma.contact.create({
      data: { companyId, firstName, lastName: lastName || "—", phone: rawNumber },
    });
    resolvedContactId = contact.id;
    contactName = `${contact.firstName} ${contact.lastName}`.trim();
  } else if (resolvedContactId) {
    const contact = await prisma.contact.findUnique({ where: { id: resolvedContactId } });
    if (contact) contactName = `${contact.firstName} ${contact.lastName}`.trim();
  }

  await prisma.phoneAlias.upsert({
    where: { phone: rawNumber },
    update: { companyId, contactId: resolvedContactId },
    create: { phone: rawNumber, companyId, contactId: resolvedContactId },
  });

  const pendingRows = await prisma.communicationLogEntry.findMany({
    where: { rawNumber, status: CommunicationStatus.UNMATCHED },
  });

  for (const row of pendingRows) {
    const body = attributeSummary(row.summary, contactName);
    const entry = await prisma.journalEntry.create({
      data: { companyId, body, kind: "NOTE", createdAt: row.occurredAt },
    });
    await prisma.communicationLogEntry.update({
      where: { id: row.id },
      data: { status: CommunicationStatus.MATCHED, companyId, journalEntryId: entry.id },
    });
  }

  revalidatePath("/journal/unmatched-numbers");
  revalidatePath("/companies");
  revalidatePath("/account-management");
  revalidatePath(`/companies/${companyId}`);
}

export async function ignoreUnmatchedNumber(rawNumber: string): Promise<void> {
  await prisma.ignoredPhoneNumber.upsert({
    where: { phone: rawNumber },
    update: {},
    create: { phone: rawNumber },
  });

  await prisma.communicationLogEntry.updateMany({
    where: { rawNumber, status: CommunicationStatus.UNMATCHED },
    data: { status: CommunicationStatus.IGNORED },
  });

  revalidatePath("/journal/unmatched-numbers");
}
