"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { CommunicationKind } from "@/generated/prisma/enums";
import {
  detectBackupKind,
  parseCallsXml,
  parseSmsXml,
  normalizePhoneNumber,
  callTypeLabel,
  SKIP_SMS_TYPES,
  buildPhoneMatchIndex,
} from "@/lib/communicationImport";

export type ImportCommunicationsState =
  | { error: string }
  | {
      summary: {
        kind: "calls" | "sms";
        total: number;
        matched: number;
        skippedUnmatched: number;
        skippedAlreadyImported: number;
        skippedNoise: number;
      };
    }
  | undefined;

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

  const phoneIndex = await buildPhoneMatchIndex();

  let matched = 0;
  let skippedUnmatched = 0;
  let skippedAlreadyImported = 0;
  let skippedNoise = 0;
  const touchedCompanyIds = new Set<string>();

  if (kind === "calls") {
    const calls = parseCallsXml(xmlText);
    const existingIds = new Set(
      (
        await prisma.communicationLogEntry.findMany({
          where: { externalId: { in: calls.map((c) => c.externalId) } },
          select: { externalId: true },
        })
      ).map((r) => r.externalId),
    );

    for (const call of calls) {
      if (existingIds.has(call.externalId)) {
        skippedAlreadyImported++;
        continue;
      }

      const normalized = normalizePhoneNumber(call.number);
      const companyId = normalized ? phoneIndex.get(normalized) : undefined;
      const occurredAt = new Date(call.date);

      if (!companyId) {
        skippedUnmatched++;
        await prisma.communicationLogEntry.create({
          data: { externalId: call.externalId, kind: CommunicationKind.CALL, occurredAt },
        });
        continue;
      }

      const minutes = Math.round(call.duration / 60);
      const body = `${callTypeLabel(call.type)} · ${call.duration < 60 ? `${call.duration}s` : `${minutes}m`}`;
      const entry = await prisma.journalEntry.create({
        data: { companyId, body, kind: "NOTE", createdAt: occurredAt },
      });
      await prisma.communicationLogEntry.create({
        data: { externalId: call.externalId, kind: CommunicationKind.CALL, companyId, journalEntryId: entry.id, occurredAt },
      });
      matched++;
      touchedCompanyIds.add(companyId);
    }

    revalidateCompanies(touchedCompanyIds);
    return {
      summary: { kind: "calls", total: calls.length, matched, skippedUnmatched, skippedAlreadyImported, skippedNoise },
    };
  }

  const texts = parseSmsXml(xmlText);
  const existingIds = new Set(
    (
      await prisma.communicationLogEntry.findMany({
        where: { externalId: { in: texts.map((t) => t.externalId) } },
        select: { externalId: true },
      })
    ).map((r) => r.externalId),
  );

  for (const text of texts) {
    if (SKIP_SMS_TYPES.has(text.type)) {
      skippedNoise++;
      continue;
    }
    if (existingIds.has(text.externalId)) {
      skippedAlreadyImported++;
      continue;
    }

    const normalized = normalizePhoneNumber(text.address);
    const companyId = normalized ? phoneIndex.get(normalized) : undefined;
    const occurredAt = new Date(text.date);

    if (!companyId) {
      skippedUnmatched++;
      await prisma.communicationLogEntry.create({
        data: { externalId: text.externalId, kind: CommunicationKind.TEXT, occurredAt },
      });
      continue;
    }

    const direction = text.type === 2 ? "Sent" : "Received";
    const snippet = text.body.length > 300 ? `${text.body.slice(0, 300)}…` : text.body;
    const body = `${direction} text: ${snippet}`;
    const entry = await prisma.journalEntry.create({
      data: { companyId, body, kind: "NOTE", createdAt: occurredAt },
    });
    await prisma.communicationLogEntry.create({
      data: { externalId: text.externalId, kind: CommunicationKind.TEXT, companyId, journalEntryId: entry.id, occurredAt },
    });
    matched++;
    touchedCompanyIds.add(companyId);
  }

  revalidateCompanies(touchedCompanyIds);
  return {
    summary: { kind: "sms", total: texts.length, matched, skippedUnmatched, skippedAlreadyImported, skippedNoise },
  };
}

function revalidateCompanies(companyIds: Set<string>) {
  revalidatePath("/companies");
  revalidatePath("/account-management");
  for (const id of companyIds) {
    revalidatePath(`/companies/${id}`);
  }
}
