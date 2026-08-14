"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { companySchema } from "@/lib/validation";
import { DealStage, DealStatus } from "@/generated/prisma/enums";
import { STAGE_ORDER } from "@/lib/stages";
import { ensureNextReminder } from "@/lib/nextReminder";

export type ActionState = { error?: string; fieldErrors?: Record<string, string> } | undefined;

function parse(formData: FormData) {
  return companySchema.safeParse({
    name: formData.get("name") ?? "",
    industry: formData.get("industry") ?? "",
    website: formData.get("website") ?? "",
    phone: formData.get("phone") ?? "",
    email: formData.get("email") ?? "",
    address: formData.get("address") ?? "",
    city: formData.get("city") ?? "",
    state: formData.get("state") ?? "",
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

export async function createCompany(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const result = parse(formData);
  if (!result.success) {
    return { error: "Please fix the errors below.", fieldErrors: fieldErrorsFrom(result) };
  }

  const data = result.data;
  const company = await prisma.company.create({
    data: {
      name: data.name,
      industry: data.industry,
      website: data.website,
      phone: data.phone,
      email: data.email,
      address: data.address,
      city: data.city,
      state: data.state,
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

  await ensureNextReminder(company.id, company.name);

  revalidatePath("/companies");
  revalidatePath("/pipeline");
  revalidatePath("/analytics");
  revalidatePath("/reminders");
  redirect(`/companies/${company.id}`);
}

export async function updateCompany(
  id: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const result = parse(formData);
  if (!result.success) {
    return { error: "Please fix the errors below.", fieldErrors: fieldErrorsFrom(result) };
  }

  const data = result.data;
  await prisma.company.update({
    where: { id },
    data: {
      name: data.name,
      industry: data.industry,
      website: data.website,
      phone: data.phone,
      email: data.email,
      address: data.address,
      city: data.city,
      state: data.state,
      source: data.source,
      jobsPerMonth: toNumberOrNull(data.jobsPerMonth),
      pricePerHl: toNumberOrNull(data.pricePerHl),
      appointmentDate: toDateOrNull(data.appointmentDate),
      notes: data.notes,
    },
  });

  revalidatePath("/companies");
  revalidatePath(`/companies/${id}`);
  revalidatePath("/pipeline");
  revalidatePath("/analytics");
  redirect(`/companies/${id}`);
}

export async function deleteCompany(id: string): Promise<void> {
  await prisma.company.delete({ where: { id } });
  revalidatePath("/companies");
  revalidatePath("/pipeline");
  revalidatePath("/analytics");
  redirect("/companies");
}

export async function moveDealStage(companyId: string, toStage: DealStage): Promise<void> {
  if (!STAGE_ORDER.includes(toStage)) return;

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { stage: true, name: true },
  });
  if (!company || company.stage === toStage) return;

  await prisma.$transaction([
    prisma.company.update({
      where: { id: companyId },
      data: { stage: toStage },
    }),
    prisma.stageHistoryEntry.create({
      data: { companyId, fromStage: company.stage, toStage },
    }),
  ]);

  await ensureNextReminder(companyId, company.name);

  revalidatePath("/pipeline");
  revalidatePath(`/companies/${companyId}`);
  revalidatePath("/companies");
  revalidatePath("/analytics");
  revalidatePath("/reminders");
}

export async function markDealWon(companyId: string): Promise<void> {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { stage: true, name: true },
  });
  if (!company) return;

  const alreadyInRelationshipManagement = company.stage === DealStage.RELATIONSHIP_MANAGEMENT;

  await prisma.$transaction([
    prisma.company.update({
      where: { id: companyId },
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
            data: { companyId, fromStage: company.stage, toStage: DealStage.RELATIONSHIP_MANAGEMENT },
          }),
        ]),
  ]);

  await ensureNextReminder(companyId, company.name);

  revalidatePath("/pipeline");
  revalidatePath(`/companies/${companyId}`);
  revalidatePath("/companies");
  revalidatePath("/analytics");
  revalidatePath("/reminders");
}

export async function markDealLost(companyId: string, reason: string): Promise<void> {
  await prisma.company.update({
    where: { id: companyId },
    data: { status: DealStatus.LOST, lostReason: reason || null, closedAt: new Date() },
  });
  revalidatePath("/pipeline");
  revalidatePath(`/companies/${companyId}`);
  revalidatePath("/companies");
  revalidatePath("/analytics");
}

export async function reopenDeal(companyId: string): Promise<void> {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { stage: true, name: true },
  });
  if (!company) return;

  // A deal reopened from relationship management drops back into the
  // active pipeline at the last working stage rather than staying "closed".
  const backToStage = company.stage === DealStage.RELATIONSHIP_MANAGEMENT ? DealStage.NEGOTIATION : company.stage;

  await prisma.$transaction([
    prisma.company.update({
      where: { id: companyId },
      data: { status: DealStatus.OPEN, lostReason: null, closedAt: null, stage: backToStage },
    }),
    ...(backToStage === company.stage
      ? []
      : [
          prisma.stageHistoryEntry.create({
            data: { companyId, fromStage: company.stage, toStage: backToStage },
          }),
        ]),
  ]);

  await ensureNextReminder(companyId, company.name);

  revalidatePath("/pipeline");
  revalidatePath(`/companies/${companyId}`);
  revalidatePath("/companies");
  revalidatePath("/analytics");
  revalidatePath("/reminders");
}
