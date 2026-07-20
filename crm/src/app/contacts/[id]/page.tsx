import { notFound } from "next/navigation";
import { format, formatDistanceStrict, formatDistanceToNow } from "date-fns";
import { Building2, Calendar, Globe, Mail, MapPin, Pencil, Phone } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { deleteContact } from "@/actions/contacts";
import { Badge, ButtonLink, Card, PageHeader } from "@/components/ui";
import DeleteButton from "@/components/DeleteButton";
import DealStageControl from "@/components/DealStageControl";
import ContactJournal from "@/components/ContactJournal";
import ReminderList from "@/components/ReminderList";
import TouchPointChecklist from "@/components/TouchPointChecklist";
import { STAGE_LABELS } from "@/lib/stages";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

export default async function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const contact = await prisma.contact.findUnique({
    where: { id },
    include: {
      company: true,
      stageHistory: { orderBy: { changedAt: "asc" } },
      journalEntries: { orderBy: { createdAt: "desc" } },
      reminders: { orderBy: { dueAt: "asc" } },
    },
  });

  if (!contact) notFound();

  const history = contact.stageHistory;
  const firstEntry = history[0];
  const cycleEnd = contact.status === "OPEN" ? new Date() : contact.closedAt ?? new Date();
  const company = contact.company;
  const companyLocation = company ? [company.city, company.state].filter(Boolean).join(", ") : "";

  return (
    <div>
      <PageHeader
        title={`${contact.firstName} ${contact.lastName}`}
        description={contact.title ?? undefined}
        action={
          <div className="flex gap-2">
            <ButtonLink href={`/contacts/${contact.id}/edit`} variant="secondary">
              <Pencil size={14} /> Edit
            </ButtonLink>
            <DeleteButton
              action={deleteContact.bind(null, contact.id)}
              confirmText={`Delete ${contact.firstName} ${contact.lastName}? This cannot be undone.`}
            />
          </div>
        }
      />

      <div className="mb-6">
        <DealStageControl contactId={contact.id} stage={contact.stage} status={contact.status} lostReason={contact.lostReason} />
      </div>

      <div className="mb-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Touch Point Cadence
        </h2>
        <TouchPointChecklist
          contactId={contact.id}
          dates={{
            touchCallTextAt: contact.touchCallTextAt,
            touchEmailAt: contact.touchEmailAt,
            touchLinkedinAt: contact.touchLinkedinAt,
            touchDropInAt: contact.touchDropInAt,
            touchCallAt: contact.touchCallAt,
            touchTextAt: contact.touchTextAt,
            touchBreakupAt: contact.touchBreakupAt,
          }}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-1">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Details
          </h2>
          <dl className="space-y-3 text-sm">
            {company && (
              <div className="flex items-center gap-2">
                <Building2 size={15} className="text-zinc-400" />
                <span className="font-medium">{company.name}</span>
              </div>
            )}
            {contact.email && (
              <div className="flex items-center gap-2">
                <Mail size={15} className="text-zinc-400" />
                <a href={`mailto:${contact.email}`} className="hover:underline">
                  {contact.email}
                </a>
              </div>
            )}
            {contact.phone && (
              <div className="flex items-center gap-2">
                <Phone size={15} className="text-zinc-400" />
                <a href={`tel:${contact.phone}`} className="hover:underline">
                  {contact.phone}
                </a>
              </div>
            )}
            {contact.appointmentDate && (
              <div className="flex items-center gap-2">
                <Calendar size={15} className="text-zinc-400" />
                <span>{format(contact.appointmentDate, "PPp")}</span>
              </div>
            )}
            {!contact.company && !contact.email && !contact.phone && !contact.appointmentDate && (
              <p className="text-zinc-400">No additional details yet.</p>
            )}
          </dl>

          <div className="mt-5 grid grid-cols-2 gap-4">
            {contact.jobsPerMonth != null && (
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Jobs per month</p>
                <p className="text-lg font-semibold">{contact.jobsPerMonth}</p>
              </div>
            )}
            {contact.pricePerHl != null && (
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Price per HL/HG</p>
                <p className="text-lg font-semibold">{formatCurrency(contact.pricePerHl)}</p>
              </div>
            )}
            {contact.source && (
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Source</p>
                <p className="text-sm font-medium">{contact.source}</p>
              </div>
            )}
          </div>

          {contact.notes && (
            <>
              <h2 className="mb-2 mt-6 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Notes
              </h2>
              <p className="whitespace-pre-wrap text-sm text-zinc-600 dark:text-zinc-400">{contact.notes}</p>
            </>
          )}

          {company && (company.industry || company.website || company.phone || company.email || company.address || companyLocation || company.notes) && (
            <>
              <h2 className="mb-2 mt-6 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Company: {company.name}
              </h2>
              <dl className="space-y-2 text-sm">
                {company.industry && <p className="text-zinc-600 dark:text-zinc-400">{company.industry}</p>}
                {company.website && (
                  <div className="flex items-center gap-2">
                    <Globe size={14} className="text-zinc-400" />
                    <a href={company.website} target="_blank" rel="noreferrer" className="hover:underline">
                      {company.website}
                    </a>
                  </div>
                )}
                {company.phone && (
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-zinc-400" />
                    <a href={`tel:${company.phone}`} className="hover:underline">
                      {company.phone}
                    </a>
                  </div>
                )}
                {company.email && (
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="text-zinc-400" />
                    <a href={`mailto:${company.email}`} className="hover:underline">
                      {company.email}
                    </a>
                  </div>
                )}
                {(company.address || companyLocation) && (
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-zinc-400" />
                    <span>{[company.address, companyLocation].filter(Boolean).join(", ")}</span>
                  </div>
                )}
                {company.notes && (
                  <p className="whitespace-pre-wrap text-zinc-600 dark:text-zinc-400">{company.notes}</p>
                )}
              </dl>
            </>
          )}

          <p className="mt-6 text-xs text-zinc-400">
            Added {formatDistanceToNow(contact.createdAt, { addSuffix: true })}
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
                        {isLast && contact.status === "OPEN" ? " (so far)" : ""}
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
          Reminders
        </h2>
        <ReminderList contactId={contact.id} reminders={contact.reminders} />
      </div>

      <div className="mt-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Journal
        </h2>
        <ContactJournal contactId={contact.id} entries={contact.journalEntries} />
      </div>
    </div>
  );
}
