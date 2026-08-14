"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

// Contacts are just people at a company now — no deal fields, no dedicated
// page. Managed entirely inline from the company page (see ContactList).
export type ContactFields = {
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  title?: string | null;
  notes?: string | null;
  isDecisionMaker?: boolean;
};

function clean(fields: ContactFields) {
  return {
    firstName: fields.firstName.trim(),
    lastName: fields.lastName.trim(),
    email: fields.email?.trim() || null,
    phone: fields.phone?.trim() || null,
    title: fields.title?.trim() || null,
    notes: fields.notes?.trim() || null,
    isDecisionMaker: !!fields.isDecisionMaker,
  };
}

function revalidateCompany(companyId: string) {
  revalidatePath(`/companies/${companyId}`);
  revalidatePath("/companies");
  revalidatePath("/pipeline");
}

export async function createContact(companyId: string, fields: ContactFields): Promise<void> {
  const data = clean(fields);
  if (!data.firstName || !data.lastName) return;

  await prisma.contact.create({ data: { ...data, companyId } });
  revalidateCompany(companyId);
}

export async function updateContact(id: string, companyId: string, fields: ContactFields): Promise<void> {
  const data = clean(fields);
  if (!data.firstName || !data.lastName) return;

  await prisma.contact.update({ where: { id }, data });
  revalidateCompany(companyId);
}

export async function deleteContact(id: string, companyId: string): Promise<void> {
  await prisma.contact.delete({ where: { id } });
  revalidateCompany(companyId);
}

export async function setDecisionMaker(id: string, companyId: string, isDecisionMaker: boolean): Promise<void> {
  await prisma.contact.update({ where: { id }, data: { isDecisionMaker } });
  revalidateCompany(companyId);
}
