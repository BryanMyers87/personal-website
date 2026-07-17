import Link from "next/link";
import { Mail, Phone, Plus, Search } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, EmptyState, PageHeader, ButtonLink, Badge } from "@/components/ui";
import { STAGE_COLORS, STAGE_LABELS } from "@/lib/stages";

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  const contacts = await prisma.contact.findMany({
    where: query
      ? {
          OR: [
            { firstName: { contains: query } },
            { lastName: { contains: query } },
            { email: { contains: query } },
            { company: { name: { contains: query } } },
          ],
        }
      : undefined,
    include: {
      company: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Contacts"
        description="Everyone in your pipeline — each contact is a deal moving through its stages."
        action={
          <ButtonLink href="/contacts/new">
            <Plus size={16} /> New Contact
          </ButtonLink>
        }
      />

      <form className="mb-4">
        <div className="relative max-w-sm">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search contacts or companies…"
            className="w-full rounded-lg border border-zinc-300 bg-white py-2 pl-9 pr-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
      </form>

      {contacts.length === 0 ? (
        <EmptyState
          title={query ? "No contacts match your search" : "No contacts yet"}
          description={
            query
              ? "Try a different name, email, or company."
              : "Add your first contact to start building your pipeline."
          }
          action={
            !query && (
              <ButtonLink href="/contacts/new">
                <Plus size={16} /> New Contact
              </ButtonLink>
            )
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-4 py-3 font-medium">Contact info</th>
                <th className="px-4 py-3 font-medium">Stage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {contacts.map((contact) => (
                <tr key={contact.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                  <td className="px-4 py-3">
                    <Link href={`/contacts/${contact.id}`} className="font-medium text-zinc-900 hover:underline dark:text-zinc-100">
                      {contact.firstName} {contact.lastName}
                    </Link>
                    {contact.title && <p className="text-xs text-zinc-500 dark:text-zinc-400">{contact.title}</p>}
                  </td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                    {contact.company ? contact.company.name : <span className="text-zinc-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    <div className="flex flex-col gap-0.5">
                      {contact.email && (
                        <span className="flex items-center gap-1.5 text-xs">
                          <Mail size={12} /> {contact.email}
                        </span>
                      )}
                      {contact.phone && (
                        <span className="flex items-center gap-1.5 text-xs">
                          <Phone size={12} /> {contact.phone}
                        </span>
                      )}
                      {!contact.email && !contact.phone && <span className="text-zinc-400">—</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge className={`${STAGE_COLORS[contact.stage].bg} ${STAGE_COLORS[contact.stage].text}`}>
                        {STAGE_LABELS[contact.stage]}
                      </Badge>
                      {contact.status === "WON" && (
                        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                          Won
                        </Badge>
                      )}
                      {contact.status === "LOST" && (
                        <Badge className="bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">Lost</Badge>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
