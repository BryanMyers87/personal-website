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

  const unmatchedGroups = Array.from(
    unmatched
      .reduce((map, row) => {
        const existing = map.get(row.rawCompanyName);
        if (existing) existing.periods += 1;
        else map.set(row.rawCompanyName, { rawCompanyName: row.rawCompanyName, periods: 1 });
        return map;
      }, new Map<string, { rawCompanyName: string; periods: number }>())
      .values(),
  ).sort((a, b) => a.rawCompanyName.localeCompare(b.rawCompanyName));

  const matchedGroups = Array.from(
    matched
      .reduce((map, row) => {
        const name = row.company?.name ?? row.rawCompanyName;
        const existing = map.get(name);
        if (existing) {
          existing.periods += 1;
          existing.leads += row.leads;
          existing.appsBooked += row.appsBooked;
          existing.billedToContractor += row.billedToContractor;
          existing.dnq += row.dnq;
        } else {
          map.set(name, {
            name,
            periods: 1,
            leads: row.leads,
            appsBooked: row.appsBooked,
            billedToContractor: row.billedToContractor,
            dnq: row.dnq,
          });
        }
        return map;
      }, new Map<string, { name: string; periods: number; leads: number; appsBooked: number; billedToContractor: number; dnq: number }>())
      .values(),
  ).sort((a, b) => a.name.localeCompare(b.name));

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

      {unmatchedGroups.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Needs matching ({unmatchedGroups.length} compan{unmatchedGroups.length === 1 ? "y" : "ies"},{" "}
            {unmatched.length} period{unmatched.length === 1 ? "" : "s"})
          </h2>
          <Card className="overflow-hidden">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {unmatchedGroups.map((group) => (
                  <tr key={group.rawCompanyName}>
                    <td className="px-4 py-3 font-medium">{group.rawCompanyName}</td>
                    <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                      {group.periods} period{group.periods === 1 ? "" : "s"}
                    </td>
                    <td className="px-4 py-3">
                      <LeadRowResolver batchId={batch.id} rawCompanyName={group.rawCompanyName} companies={companies} />
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
          Matched ({matchedGroups.length} compan{matchedGroups.length === 1 ? "y" : "ies"}, {matched.length} period
          {matched.length === 1 ? "" : "s"})
        </h2>
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-4 py-3 font-medium">Periods</th>
                <th className="px-4 py-3 font-medium">Leads</th>
                <th className="px-4 py-3 font-medium">Apps booked</th>
                <th className="px-4 py-3 font-medium">Billed</th>
                <th className="px-4 py-3 font-medium">DNQ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {matchedGroups.map((group) => (
                <tr key={group.name}>
                  <td className="px-4 py-3">{group.name}</td>
                  <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">{group.periods}</td>
                  <td className="px-4 py-3">{group.leads}</td>
                  <td className="px-4 py-3">{group.appsBooked}</td>
                  <td className="px-4 py-3">{group.billedToContractor}</td>
                  <td className="px-4 py-3">{group.dnq}</td>
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
