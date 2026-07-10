import { createCompany } from "@/actions/companies";
import CompanyForm from "@/components/CompanyForm";
import { Card, PageHeader } from "@/components/ui";

export default function NewCompanyPage() {
  return (
    <div>
      <PageHeader title="New Company" description="Create a company profile." />
      <Card className="max-w-2xl p-6">
        <CompanyForm action={createCompany} submitLabel="Create Company" />
      </Card>
    </div>
  );
}
