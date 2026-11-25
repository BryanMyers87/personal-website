import Link from "next/link";
import { format } from "date-fns";
import { Card, PageHeader } from "@/components/ui";
import LeadUploadForm from "@/components/LeadUploadForm";
import { lastFridayThursdayRange } from "@/lib/leadPeriod";

export default function LeadUploadPage() {
  const { periodStart, periodEnd } = lastFridayThursdayRange();

  return (
    <div>
      <PageHeader
        title="Upload Weekly Leads"
        description="Upload the Energuy Company List export for the week. Zero-lead rows are skipped automatically, and you'll be asked to match any company names that don't line up with an existing account."
      />
      <Card className="max-w-2xl p-6">
        <LeadUploadForm
          defaultPeriodStart={format(periodStart, "yyyy-MM-dd")}
          defaultPeriodEnd={format(periodEnd, "yyyy-MM-dd")}
        />
      </Card>
      <p className="mt-4 text-xs text-zinc-400">
        Backfilling older history instead?{" "}
        <Link href="/leads/import-history" className="text-indigo-600 hover:underline dark:text-indigo-400">
          Import Lead History
        </Link>
        .
      </p>
    </div>
  );
}
