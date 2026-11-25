import { createHash } from "crypto";
import { XMLParser } from "fast-xml-parser";
import { prisma } from "@/lib/prisma";

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "" });

export type ParsedCall = { externalId: string; number: string; type: number; date: number; duration: number };
export type ParsedText = { externalId: string; address: string; type: number; date: number; body: string };

function hashId(parts: (string | number)[]): string {
  return createHash("sha256").update(parts.join("|")).digest("hex");
}

// SMS Backup & Restore exports one file for calls (<calls><call .../></calls>)
// and one for texts (<smses><sms .../></smses>) — detect which by root tag so
// a single upload input can accept either.
export function detectBackupKind(xmlText: string): "calls" | "sms" | null {
  if (/<calls[\s>]/.test(xmlText)) return "calls";
  if (/<smses[\s>]/.test(xmlText)) return "sms";
  return null;
}

export function parseCallsXml(xmlText: string): ParsedCall[] {
  const data = parser.parse(xmlText);
  const raw = data?.calls?.call;
  if (!raw) return [];
  const list = Array.isArray(raw) ? raw : [raw];
  return list.map((c): ParsedCall => {
    const number = String(c.number ?? "");
    const type = Number(c.type ?? 0);
    const date = Number(c.date ?? 0);
    const duration = Number(c.duration ?? 0);
    return { externalId: hashId(["call", number, type, date, duration]), number, type, date, duration };
  });
}

export function parseSmsXml(xmlText: string): ParsedText[] {
  const data = parser.parse(xmlText);
  const raw = data?.smses?.sms;
  if (!raw) return [];
  const list = Array.isArray(raw) ? raw : [raw];
  return list.map((s): ParsedText => {
    const address = String(s.address ?? "");
    const type = Number(s.type ?? 0);
    const date = Number(s.date ?? 0);
    const body = String(s.body ?? "");
    return { externalId: hashId(["sms", address, type, date]), address, type, date, body };
  });
}

// Strips everything but digits and keeps the last 10, so +1 country codes,
// dashes, spaces, and parens all compare equal.
export function normalizePhoneNumber(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 7) return null;
  return digits.slice(-10);
}

const CALL_TYPE_LABELS: Record<number, string> = {
  1: "Incoming call",
  2: "Outgoing call",
  3: "Missed call",
  4: "Voicemail",
  5: "Rejected call",
  6: "Blocked call",
  7: "Call (answered externally)",
};

export function callTypeLabel(type: number): string {
  return CALL_TYPE_LABELS[type] ?? "Call";
}

// SMS type 3/4/6 = draft/outbox/queued — never actually sent or received,
// so they're not real communication events worth logging.
export const SKIP_SMS_TYPES = new Set([3, 4, 6]);

export async function buildPhoneMatchIndex(): Promise<Map<string, string>> {
  const [companies, contacts] = await Promise.all([
    prisma.company.findMany({ where: { phone: { not: null } }, select: { id: true, phone: true } }),
    prisma.contact.findMany({ where: { phone: { not: null } }, select: { phone: true, companyId: true } }),
  ]);

  const index = new Map<string, string>();
  for (const company of companies) {
    const normalized = company.phone ? normalizePhoneNumber(company.phone) : null;
    if (normalized) index.set(normalized, company.id);
  }
  // Contacts are indexed after companies so a contact's direct line wins
  // over the company's main line when both happen to be set.
  for (const contact of contacts) {
    const normalized = contact.phone ? normalizePhoneNumber(contact.phone) : null;
    if (normalized) index.set(normalized, contact.companyId);
  }
  return index;
}
