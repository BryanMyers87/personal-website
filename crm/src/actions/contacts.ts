"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { contactSchema } from "@/lib/validation";
import { DealStage, DealStatus } from "@/generated/prisma/enums";
import { STAGE_ORDER } from "@/lib/stages";

export type ActionState = { error?: string; fieldErrors?: Record<string, string> } | undefined;

function parse(formData: FormData) {
  return contactSchema.safeParse({
    firstName: formData.get("firstName") ?? "",
    lastName: formData.get("lastName") ?? "",
    email: formData.get("email") ?? "",
    phone: formData.get("phone") ?? "",
    title: formData.get("title") ?? "",
    companyId: formData.get("companyId") ?? "",
    source: formData.get("source") ?? "",
    jobsPerMonth: formData.get("jobsPerMonth") ?? "",
    pricePerHl: formData.get("pricePerHl") ?? "",
    appointmentDate: formData.get("appointmentDate") ?? "",
    notes: formData.get("notes") ?? "",
  });
}

function fieldErrorsFrom(result: { error: { flatten: () => { fieldErrors: Record<string, string[] | undefined> } } }) {
  const flat = result.error.flatten().fieldErrors;
  const out: Record<string, string> = {};
  for (const key of Object.keys(flat)) {
    const msgs = flat[key];
    if (msgs && msgs[0]) out[key] = msgs[0];
  }
  return out;
}

function toDateOrNull(value: string | undefined): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function toNumberOrNull(value: string | number | undefined): number | null {
  return value === "" || value === undefined ? null : Number(value);
}

function trimmedOrNull(value: FormDataEntryValue | null): string | null {
  const str = typeof value === "string" ? value.trim() : "";
  return str.length > 0 ? str : null;
}

// There's no standalone company page anymore — a company is created inline
// from the contact form (the "+ Create new company…" option) and this
// resolves that into a companyId, falling back to whatever was picked (or
// null) when no new company was submitted.
async function resolveCompanyId(formData: FormData, fallbackCompanyId: string | null): Promise<string | null> {
  const newCompanyName = trimmedOrNull(formData.get("newCompanyName"));
  if (!newCompanyName) return fallbackCompanyId;

  const company = await prisma.company.create({
    data: {
      name: newCompanyName,
      industry: trimmedOrNull(formData.get("newCompanyIndustry")),
      website: trimmedOrNull(formData.get("newCompanyWebsite")),
      phone: trimmedOrNull(formData.get("newCompanyPhone")),
      email: trimmedOrNull(formData.get("newCompanyEmail")),
      address: trimmedOrNull(formData.get("newCompanyAddress")),
      city: trimmedOrNull(formData.get("newCompanyCity")),
      state: trimmedOrNull(formData.get("newCompanyState")),
    },
  });
  return company.id;
}

export async function createContact(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const result = parse(formData);
  if (!result.success) {
    return { error: "Please fix the errors below.", fieldErrors: fieldErrorsFrom(result) };
  }

  const data = result.data;
  const companyId = await resolveCompanyId(formData, data.companyId ?? null);
  const contact = await prisma.contact.create({
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      title: data.title,
      companyId,
      source: data.source,
      jobsPerMonth: toNumberOrNull(data.jobsPerMonth),
      pricePerHl: toNumberOrNull(data.pricePerHl),
      appointmentDate: toDateOrNull(data.appointmentDate),
      notes: data.notes,
      stageHistory: {
        create: { fromStage: null, toStage: DealStage.PROSPECT },
      },
    },
  });

  revalidatePath("/contacts");
  revalidatePath("/pipeline");
  revalidatePath("/analytics");
  redirect(`/contacts/${contact.id}`);
}

export async function updateContact(
  id: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const result = parse(formData);
  if (!result.success) {
    return { error: "Please fix the errors below.", fieldErrors: fieldErrorsFrom(result) };
  }

  const data = result.data;
  const companyId = await resolveCompanyId(formData, data.companyId ?? null);
  await prisma.contact.update({
    where: { id },
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      title: data.title,
      companyId,
      source: data.source,
      jobsPerMonth: toNumberOrNull(data.jobsPerMonth),
      pricePerHl: toNumberOrNull(data.pricePerHl),
      appointmentDate: toDateOrNull(data.appointmentDate),
      notes: data.notes,
    },
  });

  revalidatePath("/contacts");
  revalidatePath(`/contacts/${id}`);
  revalidatePath("/pipeline");
  revalidatePath("/analytics");
  redirect(`/contacts/${id}`);
}

export async function deleteContact(id: string): Promise<void> {
  await prisma.contact.delete({ where: { id } });
  revalidatePath("/contacts");
  revalidatePath("/pipeline");
  revalidatePath("/analytics");
  redirect("/contacts");
}

export async function moveDealStage(contactId: string, toStage: DealStage): Promise<void> {
  if (!STAGE_ORDER.includes(toStage)) return;

  const contact = await prisma.contact.findUnique({ where: { id: contactId }, select: { stage: true } });
  if (!contact || contact.stage === toStage) return;

  await prisma.$transaction([
    prisma.contact.update({
      where: { id: contactId },
      data: { stage: toStage },
    }),
    prisma.stageHistoryEntry.create({
      data: { contactId, fromStage: contact.stage, toStage },
    }),
  ]);

  revalidatePath("/pipeline");
  revalidatePath(`/contacts/${contactId}`);
  revalidatePath("/contacts");
  revalidatePath("/analytics");
}

export async function markDealWon(contactId: string): Promise<void> {
  const contact = await prisma.contact.findUnique({ where: { id: contactId }, select: { stage: true } });
  if (!contact) return;

  const alreadyInRelationshipManagement = contact.stage === DealStage.RELATIONSHIP_MANAGEMENT;

  await prisma.$transaction([
    prisma.contact.update({
      where: { id: contactId },
      data: {
        status: DealStatus.WON,
        lostReason: null,
        closedAt: new Date(),
        stage: DealStage.RELATIONSHIP_MANAGEMENT,
      },
    }),
    ...(alreadyInRelationshipManagement
      ? []
      : [
          prisma.stageHistoryEntry.create({
            data: { contactId, fromStage: contact.stage, toStage: DealStage.RELATIONSHIP_MANAGEMENT },
          }),
        ]),
  ]);

  revalidatePath("/pipeline");
  revalidatePath(`/contacts/${contactId}`);
  revalidatePath("/contacts");
  revalidatePath("/analytics");
}

export async function markDealLost(contactId: string, reason: string): Promise<void> {
  await prisma.contact.update({
    where: { id: contactId },
    data: { status: DealStatus.LOST, lostReason: reason || null, closedAt: new Date() },
  });
  revalidatePath("/pipeline");
  revalidatePath(`/contacts/${contactId}`);
  revalidatePath("/contacts");
  revalidatePath("/analytics");
}

export async function reopenDeal(contactId: string): Promise<void> {
  const contact = await prisma.contact.findUnique({ where: { id: contactId }, select: { stage: true } });
  if (!contact) return;

  // A deal reopened from relationship management drops back into the
  // active pipeline at the last working stage rather than staying "closed".
  const backToStage = contact.stage === DealStage.RELATIONSHIP_MANAGEMENT ? DealStage.NEGOTIATION : contact.stage;

  await prisma.$transaction([
    prisma.contact.update({
      where: { id: contactId },
      data: { status: DealStatus.OPEN, lostReason: null, closedAt: null, stage: backToStage },
    }),
    ...(backToStage === contact.stage
      ? []
      : [
          prisma.stageHistoryEntry.create({
            data: { contactId, fromStage: contact.stage, toStage: backToStage },
          }),
        ]),
  ]);

  revalidatePath("/pipeline");
  revalidatePath(`/contacts/${contactId}`);
  revalidatePath("/contacts");
  revalidatePath("/analytics");
}
