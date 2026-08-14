"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { companySchema } from "@/lib/validation";

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

export async function createCompany(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const result = parse(formData);
  if (!result.success) {
    return { error: "Please fix the errors below.", fieldErrors: fieldErrorsFrom(result) };
  }

  const company = await prisma.company.create({ data: result.data });
  revalidatePath("/companies");
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

  await prisma.company.update({ where: { id }, data: result.data });
  revalidatePath("/companies");
  revalidatePath(`/companies/${id}`);
  redirect(`/companies/${id}`);
}

export async function deleteCompany(id: string): Promise<void> {
  const leadCount = await prisma.lead.count({ where: { companyId: id } });
  if (leadCount > 0) {
    throw new Error(
      `Cannot delete this company: it has ${leadCount} lead(s) attached. Remove or reassign those leads first.`,
    );
  }
  await prisma.company.delete({ where: { id } });
  revalidatePath("/companies");
  redirect("/companies");
}
