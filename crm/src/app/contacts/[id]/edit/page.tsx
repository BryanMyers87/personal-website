import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateContact } from "@/actions/contacts";
import ContactForm from "@/components/ContactForm";
import { Card, PageHeader } from "@/components/ui";

export default async function EditContactPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [contact, companies] = await Promise.all([
    prisma.contact.findUnique({ where: { id } }),
    prisma.company.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  if (!contact) notFound();

  return (
    <div>
      <PageHeader title={`Edit ${contact.firstName} ${contact.lastName}`} />
      <Card className="max-w-2xl p-6">
        <ContactForm
          action={updateContact.bind(null, contact.id)}
          contact={contact}
          companies={companies}
          submitLabel="Save Changes"
        />
      </Card>
    </div>
  );
}
