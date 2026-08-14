import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateCompany } from "@/actions/companies";
import CompanyForm from "@/components/CompanyForm";
import { Card, PageHeader } from "@/components/ui";

export default async function EditCompanyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const company = await prisma.company.findUnique({ where: { id } });

  if (!company) notFound();

  return (
    <div>
      <PageHeader title={`Edit ${company.name}`} />
      <Card className="max-w-2xl p-6">
        <CompanyForm action={updateCompany.bind(null, company.id)} company={company} submitLabel="Save Changes" />
      </Card>
    </div>
  );
}
