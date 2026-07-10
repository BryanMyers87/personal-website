import { prisma } from "@/lib/prisma";
import { createContact } from "@/actions/contacts";
import ContactForm from "@/components/ContactForm";
import { Card, PageHeader } from "@/components/ui";

export default async function NewContactPage({
  searchParams,
}: {
  searchParams: Promise<{ companyId?: string }>;
}) {
  const { companyId } = await searchParams;
  const companies = await prisma.company.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });

  return (
    <div>
      <PageHeader title="New Contact" description="Add someone to your CRM." />
      <Card className="max-w-2xl p-6">
        <ContactForm
          action={createContact}
          companies={companies}
          submitLabel="Create Contact"
          contact={companyId ? { companyId } : undefined}
        />
      </Card>
    </div>
  );
}
