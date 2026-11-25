import { Card, PageHeader } from "@/components/ui";
import ImportCommunicationsForm from "@/components/ImportCommunicationsForm";

export default function ImportCommunicationsPage() {
  return (
    <div>
      <PageHeader
        title="Import Calls & Texts"
        description={
          'Upload a "SMS Backup & Restore" export (calls or texts). Anything from a number already on a contact or ' +
          "company gets logged to its Journal automatically; everything else is silently skipped. Safe to re-upload " +
          "the same file later — already-imported records are never logged twice."
        }
      />
      <Card className="max-w-2xl p-6">
        <ImportCommunicationsForm />
      </Card>
    </div>
  );
}
