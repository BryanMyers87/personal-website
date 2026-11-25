import Link from "next/link";
import { Card, PageHeader } from "@/components/ui";
import ImportCommunicationsForm from "@/components/ImportCommunicationsForm";

export default function ImportCommunicationsPage() {
  return (
    <div>
      <PageHeader
        title="Import Calls & Texts"
        description={
          'Upload a "SMS Backup & Restore" export (calls or texts). Anything from a number already on a contact or ' +
          "company gets logged to its Journal automatically. Anything from an unrecognized number waits for you to " +
          "assign or ignore it. Safe to re-upload the same file later — already-handled records are never logged twice."
        }
      />
      <Card className="max-w-2xl p-6">
        <ImportCommunicationsForm />
      </Card>
      <p className="mt-4 text-xs text-zinc-400">
        <Link href="/journal/unmatched-numbers" className="text-indigo-600 hover:underline dark:text-indigo-400">
          Review unmatched numbers
        </Link>
      </p>
    </div>
  );
}
