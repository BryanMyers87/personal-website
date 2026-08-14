import { notFound } from "next/navigation";
import { format, formatDistanceStrict, formatDistanceToNow } from "date-fns";
import { clsx } from "clsx";
import { Building2, Calendar, Globe, Mail, MapPin, Pencil, Phone } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { deleteCompany } from "@/actions/companies";
import { Badge, ButtonLink, Card, PageHeader } from "@/components/ui";
import DeleteButton from "@/components/DeleteButton";
import DealStageControl from "@/components/DealStageControl";
import CompanyJournal from "@/components/CompanyJournal";
import ReminderList from "@/components/ReminderList";
import TouchPointChecklist from "@/components/TouchPointChecklist";
import OnboardingFileList from "@/components/OnboardingFileList";
import HealthTierSelect from "@/components/HealthTierSelect";
import ContactList from "@/components/ContactList";
import { STAGE_LABELS } from "@/lib/stages";
import { volumeTierInfo } from "@/lib/volumeTier";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

export default async function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const company = await prisma.company.findUnique({
    where: { id },
    include: {
      contacts: { orderBy: [{ isDecisionMaker: "desc" }, { firstName: "asc" }] },
      stageHistory: { orderBy: { changedAt: "asc" } },
      journalEntries: { orderBy: { createdAt: "desc" } },
      reminders: { orderBy: { dueAt: "asc" } },
      onboardingFiles: { orderBy: { position: "asc" } },
    },
  });

  if (!company) notFound();

  const history = company.stageHistory;
  const firstEntry = history[0];
  const cycleEnd = company.status === "OPEN" ? new Date() : company.closedAt ?? new Date();
  const location = [company.city, company.state].filter(Boolean).join(", ");
  const showOnboardingFiles = company.stage === "NEGOTIATION" || company.stage === "RELATIONSHIP_MANAGEMENT";

  return (
    <div>
      <PageHeader
        title={company.name}
        description={company.industry ?? undefined}
        action={
          <div className="flex gap-2">
            <ButtonLink href={`/companies/${company.id}/edit`} variant="secondary">
              <Pencil size={14} /> Edit
            </ButtonLink>
            <DeleteButton
              action={deleteCompany.bind(null, company.id)}
              confirmText={`Delete ${company.name}? This removes every contact, reminder, and note attached to it. This cannot be undone.`}
            />
          </div>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <DealStageControl companyId={company.id} stage={company.stage} status={company.status} lostReason={company.lostReason} />
        {company.stage === "RELATIONSHIP_MANAGEMENT" && (
          <HealthTierSelect companyId={company.id} tier={company.healthTier} />
        )}
      </div>

      {company.stage !== "RELATIONSHIP_MANAGEMENT" && (
        <div className="mb-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Touch Point Cadence
          </h2>
          <TouchPointChecklist
            companyId={company.id}
            companyName={company.name}
            phone={company.phone}
            email={company.email}
            firstTouchScheduledAt={company.firstTouchScheduledAt}
            dates={{
              touchCallTextAt: company.touchCallTextAt,
              touchEmailAt: company.touchEmailAt,
              touchLinkedinAt: company.touchLinkedinAt,
              touchDropInAt: company.touchDropInAt,
              touchCallAt: company.touchCallAt,
              touchTextAt: company.touchTextAt,
              touchBreakupAt: company.touchBreakupAt,
            }}
          />
        </div>
      )}

      {showOnboardingFiles && (
        <div className="mb-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            First Files
          </h2>
          <OnboardingFileList companyId={company.id} files={company.onboardingFiles} />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-1">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Details
          </h2>
          <dl className="space-y-3 text-sm">
            {company.industry && (
              <div className="flex items-center gap-2">
                <Building2 size={15} className="text-zinc-400" />
                <span className="font-medium">{company.industry}</span>
              </div>
            )}
            {company.website && (
              <div className="flex items-center gap-2">
                <Globe size={15} className="text-zinc-400" />
                <a href={company.website} target="_blank" rel="noreferrer" className="hover:underline">
                  {company.website}
                </a>
              </div>
            )}
            {company.email && (
              <div className="flex items-center gap-2">
                <Mail size={15} className="text-zinc-400" />
                <a href={`mailto:${company.email}`} className="hover:underline">
                  {company.email}
                </a>
              </div>
            )}
            {company.phone && (
              <div className="flex items-center gap-2">
                <Phone size={15} className="text-zinc-400" />
                <a href={`tel:${company.phone}`} className="hover:underline">
                  {company.phone}
                </a>
              </div>
            )}
            {(company.address || location) && (
              <div className="flex items-center gap-2">
                <MapPin size={15} className="text-zinc-400" />
                <span>{[company.address, location].filter(Boolean).join(", ")}</span>
              </div>
            )}
            {company.appointmentDate && (
              <div className="flex items-center gap-2">
                <Calendar size={15} className="text-zinc-400" />
                <span>{format(company.appointmentDate, "PPp")}</span>
              </div>
            )}
            {!company.industry &&
              !company.website &&
              !company.email &&
              !company.phone &&
              !company.address &&
              !location &&
              !company.appointmentDate && <p className="text-zinc-400">No additional details yet.</p>}
          </dl>

          <div className="mt-5 grid grid-cols-2 gap-4">
            {company.jobsPerMonth != null && (
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Jobs per month</p>
                <p className="text-lg font-semibold">{company.jobsPerMonth}</p>
                {company.stage === "RELATIONSHIP_MANAGEMENT" &&
                  (() => {
                    const info = volumeTierInfo(company.jobsPerMonth);
                    return info ? (
                      <Badge className={clsx("mt-1", info.badge)}>{info.label}</Badge>
                    ) : null;
                  })()}
              </div>
            )}
            {company.pricePerHl != null && (
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Price per HL/HG</p>
                <p className="text-lg font-semibold">{formatCurrency(company.pricePerHl)}</p>
              </div>
            )}
            {company.source && (
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Source</p>
                <p className="text-sm font-medium">{company.source}</p>
              </div>
            )}
          </div>

          {company.notes && (
            <>
              <h2 className="mb-2 mt-6 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Notes
              </h2>
              <p className="whitespace-pre-wrap text-sm text-zinc-600 dark:text-zinc-400">{company.notes}</p>
            </>
          )}

          <p className="mt-6 text-xs text-zinc-400">
            Added {formatDistanceToNow(company.createdAt, { addSuffix: true })}
          </p>
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
                        {isLast && company.status === "OPEN" ? " (so far)" : ""}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </Card>
        </div>
      </div>

      <div className="mt-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Contacts
        </h2>
        <ContactList companyId={company.id} contacts={company.contacts} />
      </div>

      <div className="mt-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Reminders
        </h2>
        <ReminderList companyId={company.id} reminders={company.reminders} />
      </div>

      <div className="mt-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Journal
        </h2>
        <CompanyJournal companyId={company.id} entries={company.journalEntries} />
      </div>
    </div>
  );
}
