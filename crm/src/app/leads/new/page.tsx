import { prisma } from "@/lib/prisma";
import { createLead } from "@/actions/leads";
import LeadForm from "@/components/LeadForm";
import { Card, PageHeader } from "@/components/ui";

export default async function NewLeadPage({
  searchParams,
}: {
  searchParams: Promise<{ contactId?: string; companyId?: string }>;
}) {
  const { contactId, companyId } = await searchParams;

  const [contacts, companies] = await Promise.all([
    prisma.contact.findMany({ orderBy: { firstName: "asc" }, include: { company: true } }),
    prisma.company.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <PageHeader title="New Lead" description="Add a lead to the pipeline." />
      <Card className="max-w-2xl p-6">
        <LeadForm
          action={createLead}
          submitLabel="Create Lead"
          showStage
          lead={{ contactId, companyId }}
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
