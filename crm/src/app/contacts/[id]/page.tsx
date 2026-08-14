import Link from "next/link";
import { notFound } from "next/navigation";
import { Building2, Mail, Pencil, Phone } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { deleteContact } from "@/actions/contacts";
import { Badge, ButtonLink, Card, PageHeader } from "@/components/ui";
import DeleteButton from "@/components/DeleteButton";
import { STAGE_COLORS, STAGE_LABELS } from "@/lib/stages";
import { formatDistanceToNow } from "date-fns";

export default async function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const contact = await prisma.contact.findUnique({
    where: { id },
    include: {
      company: true,
      leads: { orderBy: { createdAt: "desc" }, include: { company: true } },
    },
  });

  if (!contact) notFound();

  return (
    <div>
      <PageHeader
        title={
          contact.isDecisionMaker
            ? `${contact.firstName} ${contact.lastName} · Key decision maker`
            : `${contact.firstName} ${contact.lastName}`
        }
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-1">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Details
          </h2>
          <dl className="space-y-3 text-sm">
            {contact.company && (
              <div className="flex items-center gap-2">
                <Building2 size={15} className="text-zinc-400" />
                <Link href={`/companies/${contact.company.id}`} className="font-medium hover:underline">
                  {contact.company.name}
                </Link>
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
            {!contact.company && !contact.email && !contact.phone && (
              <p className="text-zinc-400">No additional details yet.</p>
            )}
          </dl>

          {contact.notes && (
            <>
              <h2 className="mb-2 mt-6 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Notes
              </h2>
              <p className="whitespace-pre-wrap text-sm text-zinc-600 dark:text-zinc-400">{contact.notes}</p>
            </>
          )}

          <p className="mt-6 text-xs text-zinc-400">
            Added {formatDistanceToNow(contact.createdAt, { addSuffix: true })}
          </p>
        </Card>

        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Leads ({contact.leads.length})
            </h2>
            <ButtonLink
              href={`/leads/new?contactId=${contact.id}${contact.company ? `&companyId=${contact.company.id}` : ""}`}
              variant="secondary"
            >
              New Lead
            </ButtonLink>
          </div>

          {contact.leads.length === 0 ? (
            <Card className="p-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
              No leads yet for this contact.
            </Card>
          ) : (
            <div className="space-y-3">
              {contact.leads.map((lead) => (
                <Link key={lead.id} href={`/leads/${lead.id}`}>
                  <Card className="flex items-center justify-between p-4 transition-colors hover:border-indigo-300 dark:hover:border-indigo-700">
                    <div>
                      <p className="font-medium">{lead.title}</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {lead.company.name} · Created{" "}
                        {formatDistanceToNow(lead.createdAt, { addSuffix: true })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {lead.status === "LOST" && (
                        <Badge className="bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">Lost</Badge>
                      )}
                      {lead.status === "WON" && (
                        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                          Won
                        </Badge>
                      )}
                      <Badge className={`${STAGE_COLORS[lead.stage].bg} ${STAGE_COLORS[lead.stage].text}`}>
                        {STAGE_LABELS[lead.stage]}
                      </Badge>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
