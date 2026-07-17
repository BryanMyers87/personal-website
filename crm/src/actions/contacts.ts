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

export async function createContact(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const result = parse(formData);
  if (!result.success) {
    return { error: "Please fix the errors below.", fieldErrors: fieldErrorsFrom(result) };
  }

  const data = result.data;
  const contact = await prisma.contact.create({
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      title: data.title,
      companyId: data.companyId,
      source: data.source,
      estimatedValue: data.estimatedValue === "" || data.estimatedValue === undefined ? null : Number(data.estimatedValue),
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
  await prisma.contact.update({
    where: { id },
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      title: data.title,
      companyId: data.companyId,
      source: data.source,
      estimatedValue: data.estimatedValue === "" || data.estimatedValue === undefined ? null : Number(data.estimatedValue),
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
  await prisma.contact.update({
    where: { id: contactId },
    data: { status: DealStatus.WON, lostReason: null, closedAt: new Date() },
  });
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
  await prisma.contact.update({
    where: { id: contactId },
    data: { status: DealStatus.OPEN, lostReason: null, closedAt: null },
  });
  revalidatePath("/pipeline");
  revalidatePath(`/contacts/${contactId}`);
  revalidatePath("/contacts");
  revalidatePath("/analytics");
}
