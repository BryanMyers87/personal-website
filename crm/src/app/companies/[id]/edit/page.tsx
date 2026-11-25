import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateCompany } from "@/actions/companies";
import CompanyForm from "@/components/CompanyForm";
import MergeCompanyForm from "@/components/MergeCompanyForm";
import { Card, PageHeader } from "@/components/ui";

export default async function EditCompanyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [company, otherCompanies] = await Promise.all([
    prisma.company.findUnique({ where: { id } }),
    prisma.company.findMany({ where: { id: { not: id } }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  if (!company) notFound();

  return (
    <div>
      <PageHeader title={`Edit ${company.name}`} />
      <Card className="max-w-2xl p-6">
        <CompanyForm action={updateCompany.bind(null, company.id)} company={company} submitLabel="Save Changes" />
      </Card>

      <Card className="mt-6 max-w-2xl p-6">
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Duplicate Cleanup
        </h2>
        <p className="mb-4 text-xs text-zinc-400">
          If this is a duplicate of another company, merge it in — contacts, reminders, notes, and lead reports move
          over, and this record is deleted.
        </p>
        <MergeCompanyForm companyId={company.id} companyName={company.name} otherCompanies={otherCompanies} />
      </Card>
    </div>
  );
}
