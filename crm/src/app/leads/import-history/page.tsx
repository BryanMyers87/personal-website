import { Card, PageHeader } from "@/components/ui";
import HistoryImportForm from "@/components/HistoryImportForm";

export default function LeadHistoryImportPage() {
  return (
    <div>
      <PageHeader
        title="Import Lead History"
        description="One-time backfill from the historical lead-report CSV — each row carries its own period, so monthly and weekly rows can be mixed in the same file. Zero-lead rows are skipped automatically, and you'll be asked to match any company names that don't line up with an existing account."
      />
      <Card className="max-w-2xl p-6">
        <HistoryImportForm />
      </Card>
    </div>
  );
}
