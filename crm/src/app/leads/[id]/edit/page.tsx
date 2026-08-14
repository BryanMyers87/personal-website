import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateLead } from "@/actions/leads";
import LeadForm from "@/components/LeadForm";
import { Card, PageHeader } from "@/components/ui";

export default async function EditLeadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [lead, companies, contacts] = await Promise.all([
    prisma.lead.findUnique({ where: { id } }),
    prisma.company.findMany({ orderBy: { name: "asc" } }),
    prisma.contact.findMany({ orderBy: { firstName: "asc" }, include: { company: true } }),
  ]);

  if (!lead) notFound();

  return (
    <div>
      <PageHeader title={`Edit ${lead.title}`} description="Stage changes are made from the lead page or pipeline board." />
      <Card className="max-w-2xl p-6">
        <LeadForm
          action={updateLead.bind(null, lead.id)}
          submitLabel="Save Changes"
          lead={lead}
          contacts={contacts.map((c) => ({
            id: c.id,
            label: `${c.firstName} ${c.lastName}${c.company ? ` (${c.company.name})` : ""}`,
          }))}
          companies={companies.map((c) => ({ id: c.id, label: c.name }))}
        />
      </Card>
    </div>
  );
}
