import { z } from "zod";

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
  source: optionalString,
  jobsPerMonth: z.union([z.literal(""), z.coerce.number().nonnegative()]).optional(),
  pricePerHl: z.union([z.literal(""), z.coerce.number().nonnegative()]).optional(),
  appointmentDate: optionalString,
  notes: optionalString,
});

export type CompanyInput = z.infer<typeof companySchema>;
export type ContactInput = z.infer<typeof contactSchema>;
