import { notFound } from "next/navigation";
import { format, formatDistanceToNow } from "date-fns";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Badge, Card, PageHeader } from "@/components/ui";
import LeadRowResolver from "@/components/LeadRowResolver";
import CommitBatchButton from "@/components/CommitBatchButton";

export default async function LeadBatchReviewPage({ params }: { params: Promise<{ batchId: string }> }) {
  const { batchId } = await params;

  const batch = await prisma.leadReportBatch.findUnique({
    where: { id: batchId },
    include: { rows: { include: { company: { select: { name: true } } }, orderBy: { rawCompanyName: "asc" } } },
  });
  if (!batch) notFound();

  const [companies, priorBatch] = await Promise.all([
    prisma.company.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.leadReportBatch.findFirst({
      where: { fileHash: batch.fileHash, id: { not: batch.id } },
      orderBy: { uploadedAt: "desc" },
    }),
  ]);

  const unmatched = batch.rows.filter((r) => r.status === "UNMATCHED");
  const matched = batch.rows.filter((r) => r.status === "MATCHED");
  const skipped = batch.rows.filter((r) => r.status === "SKIPPED_ZERO");

  return (
    <div>
      <PageHeader
        title="Review Upload"
        description={`${format(batch.periodStart, "PP")} – ${format(batch.periodEnd, "PP")} · ${batch.fileName}`}
      />

      {priorBatch && (
        <Card className="mb-4 flex items-center gap-3 border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950">
          <AlertTriangle size={18} className="shrink-0 text-amber-600 dark:text-amber-400" />
          <p className="text-sm text-amber-800 dark:text-amber-300">
            This file is identical to one uploaded {formatDistanceToNow(priorBatch.uploadedAt, { addSuffix: true })}
            {priorBatch.committedAt ? " (already committed)" : " (not yet committed)"}. Double-check before
            committing this one too.
          </p>
        </Card>
      )}

      {batch.committedAt && (
        <Card className="mb-4 flex items-center gap-3 border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950">
          <CheckCircle2 size={18} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
          <p className="text-sm text-emerald-800 dark:text-emerald-300">
            Committed {formatDistanceToNow(batch.committedAt, { addSuffix: true })}.
          </p>
        </Card>
      )}

      <div className="mb-6 flex flex-wrap gap-2 text-sm">
        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
          {matched.length} matched
        </Badge>
        <Badge className="bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">{unmatched.length} unmatched</Badge>
        <Badge className="bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
          {skipped.length} skipped (zero leads)
        </Badge>
      </div>

      {unmatched.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Needs matching ({unmatched.length})
          </h2>
          <Card className="overflow-hidden">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {unmatched.map((row) => (
                  <tr key={row.id}>
                    <td className="px-4 py-3 font-medium">{row.rawCompanyName}</td>
                    <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">{row.leads} leads</td>
                    <td className="px-4 py-3">
                      <LeadRowResolver rowId={row.id} rawCompanyName={row.rawCompanyName} companies={companies} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      <div className="mb-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Matched ({matched.length})
        </h2>
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-4 py-3 font-medium">Leads</th>
                <th className="px-4 py-3 font-medium">Apps booked</th>
                <th className="px-4 py-3 font-medium">Billed</th>
                <th className="px-4 py-3 font-medium">DNQ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {matched.map((row) => (
                <tr key={row.id}>
                  <td className="px-4 py-3">{row.company?.name ?? row.rawCompanyName}</td>
                  <td className="px-4 py-3">{row.leads}</td>
                  <td className="px-4 py-3">{row.appsBooked}</td>
                  <td className="px-4 py-3">{row.billedToContractor}</td>
                  <td className="px-4 py-3">{row.dnq}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      <div className="flex justify-end">
        <CommitBatchButton batchId={batch.id} disabled={unmatched.length > 0 || !!batch.committedAt} />
      </div>
    </div>
  );
}
