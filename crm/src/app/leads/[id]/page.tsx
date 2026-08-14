import Link from "next/link";
import { notFound } from "next/navigation";
import { format, formatDistanceStrict, formatDistanceToNow } from "date-fns";
import { Building2, Calendar, Pencil, User } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { deleteLead } from "@/actions/leads";
import { Badge, ButtonLink, Card, PageHeader } from "@/components/ui";
import DeleteButton from "@/components/DeleteButton";
import LeadStageControl from "@/components/LeadStageControl";
import { STAGE_LABELS } from "@/lib/stages";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const lead = await prisma.lead.findUnique({
    where: { id },
    include: {
      contact: true,
      company: true,
      stageHistory: { orderBy: { changedAt: "asc" } },
    },
  });

  if (!lead) notFound();

  const history = lead.stageHistory;
  const firstEntry = history[0];
  const cycleEnd = lead.status === "OPEN" ? new Date() : history[history.length - 1]?.changedAt ?? new Date();

  return (
    <div>
      <PageHeader
        title={lead.title}
        description={`Created ${formatDistanceToNow(lead.createdAt, { addSuffix: true })}`}
        action={
          <div className="flex gap-2">
            <ButtonLink href={`/leads/${lead.id}/edit`} variant="secondary">
              <Pencil size={14} /> Edit
            </ButtonLink>
            <DeleteButton action={deleteLead.bind(null, lead.id)} confirmText={`Delete lead "${lead.title}"? This cannot be undone.`} />
          </div>
        }
      />

      <div className="mb-6">
        <LeadStageControl leadId={lead.id} stage={lead.stage} status={lead.status} lostReason={lead.lostReason} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-1">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Details
          </h2>
          <dl className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <Building2 size={15} className="text-zinc-400" />
              <Link href={`/companies/${lead.company.id}`} className="hover:underline">
                {lead.company.name}
              </Link>
            </div>
            {lead.contact && (
              <div className="flex items-center gap-2">
                <User size={15} className="text-zinc-400" />
                <Link href={`/contacts/${lead.contact.id}`} className="hover:underline">
                  {lead.contact.firstName} {lead.contact.lastName}
                </Link>
                {lead.contact.isDecisionMaker && (
                  <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                    Key decision maker
                  </Badge>
                )}
              </div>
            )}
            {lead.appointmentDate && (
              <div className="flex items-center gap-2">
                <Calendar size={15} className="text-zinc-400" />
                <span>{format(lead.appointmentDate, "PPp")}</span>
              </div>
            )}
          </dl>

          <div className="mt-5 grid grid-cols-2 gap-4">
            {lead.estimatedValue != null && (
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Estimated value</p>
                <p className="text-lg font-semibold">{formatCurrency(lead.estimatedValue)}</p>
              </div>
            )}
            {lead.source && (
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Source</p>
                <p className="text-sm font-medium">{lead.source}</p>
              </div>
            )}
          </div>

          {lead.notes && (
            <>
              <h2 className="mb-2 mt-6 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Notes
              </h2>
              <p className="whitespace-pre-wrap text-sm text-zinc-600 dark:text-zinc-400">{lead.notes}</p>
            </>
          )}
        </Card>

        <div className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Stage History
            </h2>
            {firstEntry && (
              <Badge className="bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                Total cycle time: {formatDistanceStrict(firstEntry.changedAt, cycleEnd)}
              </Badge>
            )}
          </div>

          <Card className="p-4">
            <ol className="space-y-4">
              {history.map((entry, idx) => {
                const next = history[idx + 1];
                const segmentEnd = next?.changedAt ?? cycleEnd;
                const isLast = idx === history.length - 1;
                return (
                  <li key={entry.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-indigo-500" />
                      {!isLast && <span className="w-px flex-1 bg-zinc-200 dark:bg-zinc-800" />}
                    </div>
                    <div className="pb-4">
                      <p className="text-sm font-medium">
                        {entry.fromStage ? `${STAGE_LABELS[entry.fromStage]} → ` : "Created at "}
                        {STAGE_LABELS[entry.toStage]}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">{format(entry.changedAt, "PPp")}</p>
                      <p className="mt-1 text-xs text-zinc-400">
                        Time in this stage: {formatDistanceStrict(entry.changedAt, segmentEnd)}
                        {isLast && lead.status === "OPEN" ? " (so far)" : ""}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </Card>
        </div>
      </div>
    </div>
  );
}
