"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { contactSchema } from "@/lib/validation";

export type ActionState = { error?: string; fieldErrors?: Record<string, string> } | undefined;

function parse(formData: FormData) {
  return contactSchema.safeParse({
    firstName: formData.get("firstName") ?? "",
    lastName: formData.get("lastName") ?? "",
    email: formData.get("email") ?? "",
    phone: formData.get("phone") ?? "",
    title: formData.get("title") ?? "",
    companyId: formData.get("companyId") ?? "",
    isDecisionMaker: formData.get("isDecisionMaker") === "on",
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

export async function createContact(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const result = parse(formData);
  if (!result.success) {
    return { error: "Please fix the errors below.", fieldErrors: fieldErrorsFrom(result) };
  }

  const contact = await prisma.contact.create({ data: result.data });
  revalidatePath("/contacts");
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

  await prisma.contact.update({ where: { id }, data: result.data });
  revalidatePath("/contacts");
  revalidatePath(`/contacts/${id}`);
  redirect(`/contacts/${id}`);
}

export async function deleteContact(id: string): Promise<void> {
  await prisma.contact.delete({ where: { id } });
  revalidatePath("/contacts");
  redirect("/contacts");
}
