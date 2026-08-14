import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Globe, Mail, MapPin, Pencil, Phone } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { deleteCompany } from "@/actions/companies";
import { Badge, ButtonLink, Card, PageHeader } from "@/components/ui";
import DeleteButton from "@/components/DeleteButton";
import { STAGE_COLORS, STAGE_LABELS } from "@/lib/stages";

export default async function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const company = await prisma.company.findUnique({
    where: { id },
    include: {
      contacts: { orderBy: { createdAt: "desc" } },
      leads: { orderBy: { createdAt: "desc" }, include: { contact: true } },
    },
  });

  if (!company) notFound();

  const location = [company.city, company.state].filter(Boolean).join(", ");

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
              confirmText={`Delete ${company.name}? Contacts will be unlinked, not deleted. Leads attached to this company must be removed or reassigned first.`}
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
            {!company.website && !company.email && !company.phone && !company.address && !location && (
              <p className="text-zinc-400">No additional details yet.</p>
            )}
          </dl>

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

        <div className="space-y-8 lg:col-span-2">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Contacts ({company.contacts.length})
              </h2>
              <ButtonLink href={`/contacts/new?companyId=${company.id}`} variant="secondary">
                New Contact
              </ButtonLink>
            </div>
            {company.contacts.length === 0 ? (
              <Card className="p-6 text-center text-sm text-zinc-500 dark:text-zinc-400">No contacts yet.</Card>
            ) : (
              <Card className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {company.contacts.map((contact) => (
                  <Link
                    key={contact.id}
                    href={`/contacts/${contact.id}`}
                    className="flex items-center justify-between px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="font-medium">
                          {contact.firstName} {contact.lastName}
                        </p>
                        {contact.isDecisionMaker && (
                          <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                            Key decision maker
                          </Badge>
                        )}
                      </div>
                      {contact.title && <p className="text-xs text-zinc-500 dark:text-zinc-400">{contact.title}</p>}
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{contact.email}</p>
                  </Link>
                ))}
              </Card>
            )}
          </div>

          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Leads ({company.leads.length})
            </h2>
            {company.leads.length === 0 ? (
              <Card className="p-6 text-center text-sm text-zinc-500 dark:text-zinc-400">No leads yet.</Card>
            ) : (
              <div className="space-y-3">
                {company.leads.map((lead) => (
                  <Link key={lead.id} href={`/leads/${lead.id}`}>
                    <Card className="flex items-center justify-between p-4 transition-colors hover:border-indigo-300 dark:hover:border-indigo-700">
                      <div>
                        <p className="font-medium">{lead.title}</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          {lead.contact ? `${lead.contact.firstName} ${lead.contact.lastName}` : "No contact"}
                        </p>
                      </div>
                      <Badge className={`${STAGE_COLORS[lead.stage].bg} ${STAGE_COLORS[lead.stage].text}`}>
                        {STAGE_LABELS[lead.stage]}
                      </Badge>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
