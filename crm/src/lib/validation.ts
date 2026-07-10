import { z } from "zod";
import { LeadStage } from "@/generated/prisma/enums";

const optionalString = z
  .string()
  .trim()
  .transform((v) => (v.length === 0 ? undefined : v))
  .optional();

const optionalId = z
  .string()
  .trim()
  .transform((v) => (v.length === 0 ? null : v))
  .nullable()
  .optional();

export const companySchema = z.object({
  name: z.string().trim().min(1, "Company name is required"),
  industry: optionalString,
  website: optionalString,
  phone: optionalString,
  email: z.union([z.literal(""), z.string().trim().email()]).optional(),
  address: optionalString,
  city: optionalString,
  state: optionalString,
  notes: optionalString,
});

export const contactSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  email: z.union([z.literal(""), z.string().trim().email()]).optional(),
  phone: optionalString,
  title: optionalString,
  companyId: optionalId,
  notes: optionalString,
});

export const leadStageValues = Object.values(LeadStage) as [string, ...string[]];

export const leadSchema = z.object({
  title: z.string().trim().min(1, "Deal title is required"),
  contactId: z.string().trim().min(1, "A contact is required"),
  companyId: optionalId,
  stage: z.enum(leadStageValues).optional(),
  source: optionalString,
  estimatedValue: z
    .union([z.literal(""), z.coerce.number().nonnegative()])
    .optional(),
  appointmentDate: optionalString,
  notes: optionalString,
});

export type CompanyInput = z.infer<typeof companySchema>;
export type ContactInput = z.infer<typeof contactSchema>;
export type LeadInput = z.infer<typeof leadSchema>;
