"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { leadSchema } from "@/lib/validation";
import { LeadStage, LeadStatus } from "@/generated/prisma/enums";
import { STAGE_ORDER } from "@/lib/stages";

export type ActionState = { error?: string; fieldErrors?: Record<string, string> } | undefined;

function parse(formData: FormData) {
  return leadSchema.safeParse({
    title: formData.get("title") ?? "",
    companyId: formData.get("companyId") ?? "",
    contactId: formData.get("contactId") ?? "",
    stage: formData.get("stage") || undefined,
    source: formData.get("source") ?? "",
    estimatedValue: formData.get("estimatedValue") ?? "",
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

export async function createLead(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const result = parse(formData);
  if (!result.success) {
    return { error: "Please fix the errors below.", fieldErrors: fieldErrorsFrom(result) };
  }

  const data = result.data;
  const stage = (data.stage as LeadStage | undefined) ?? LeadStage.NEW;

  const lead = await prisma.lead.create({
    data: {
      title: data.title,
      companyId: data.companyId,
      contactId: data.contactId ?? null,
      stage,
      source: data.source,
      estimatedValue: data.estimatedValue === "" || data.estimatedValue === undefined ? null : Number(data.estimatedValue),
      appointmentDate: toDateOrNull(data.appointmentDate),
      notes: data.notes,
      stageHistory: {
        create: { fromStage: null, toStage: stage },
      },
    },
  });

  revalidatePath("/pipeline");
  revalidatePath("/analytics");
  redirect(`/leads/${lead.id}`);
}

export async function updateLead(id: string, _prevState: ActionState, formData: FormData): Promise<ActionState> {
  const result = parse(formData);
  if (!result.success) {
    return { error: "Please fix the errors below.", fieldErrors: fieldErrorsFrom(result) };
  }

  const data = result.data;
  await prisma.lead.update({
    where: { id },
    data: {
      title: data.title,
      companyId: data.companyId,
      contactId: data.contactId ?? null,
      source: data.source,
      estimatedValue: data.estimatedValue === "" || data.estimatedValue === undefined ? null : Number(data.estimatedValue),
      appointmentDate: toDateOrNull(data.appointmentDate),
      notes: data.notes,
    },
  });

  revalidatePath("/pipeline");
  revalidatePath(`/leads/${id}`);
  revalidatePath("/analytics");
  redirect(`/leads/${id}`);
}

export async function moveLeadStage(leadId: string, toStage: LeadStage): Promise<void> {
  if (!STAGE_ORDER.includes(toStage)) return;

  const lead = await prisma.lead.findUnique({ where: { id: leadId }, select: { stage: true, status: true } });
  if (!lead || lead.stage === toStage) return;

  await prisma.$transaction([
    prisma.lead.update({
      where: { id: leadId },
      data: {
        stage: toStage,
        status: toStage === LeadStage.APPROVED ? LeadStatus.WON : lead.status,
      },
    }),
    prisma.stageHistoryEntry.create({
      data: { leadId, fromStage: lead.stage, toStage },
    }),
  ]);

  revalidatePath("/pipeline");
  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/analytics");
}

export async function markLeadLost(leadId: string, reason: string): Promise<void> {
  await prisma.lead.update({
    where: { id: leadId },
    data: { status: LeadStatus.LOST, lostReason: reason || null },
  });
  revalidatePath("/pipeline");
  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/analytics");
}

export async function reopenLead(leadId: string): Promise<void> {
  await prisma.lead.update({
    where: { id: leadId },
    data: { status: LeadStatus.OPEN, lostReason: null },
  });
  revalidatePath("/pipeline");
  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/analytics");
}

export async function deleteLead(id: string): Promise<void> {
  await prisma.lead.delete({ where: { id } });
  revalidatePath("/pipeline");
  revalidatePath("/analytics");
  redirect("/pipeline");
}
