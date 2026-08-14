import Link from "next/link";
import { Mail, Phone, Plus, Search, Star } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, EmptyState, PageHeader, ButtonLink, Badge } from "@/components/ui";
import { STAGE_COLORS, STAGE_LABELS } from "@/lib/stages";
import { parseCompanySort } from "@/lib/companySort";
import CompanySortSelect from "@/components/CompanySortSelect";
import ScheduleFirstTouchButton from "@/components/ScheduleFirstTouchButton";

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sort?: string }>;
}) {
  const { q, sort: sortParam } = await searchParams;
  const query = q?.trim() ?? "";
  const sort = parseCompanySort(sortParam);

  const orderBy =
    sort === "name"
      ? { name: "asc" as const }
      : sort === "city"
        ? { city: "asc" as const }
        : { createdAt: "desc" as const };

  const companies = await prisma.company.findMany({
    where: query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { city: { contains: query, mode: "insensitive" } },
            { contacts: { some: { firstName: { contains: query, mode: "insensitive" } } } },
            { contacts: { some: { lastName: { contains: query, mode: "insensitive" } } } },
          ],
        }
      : undefined,
    include: {
      contacts: { orderBy: [{ isDecisionMaker: "desc" }, { firstName: "asc" }] },
    },
    orderBy,
  });

  return (
    <div>
      <PageHeader
        title="Companies"
        description="Every company in your pipeline — each one is a deal moving through its stages, with the people who work there attached."
        action={
          <ButtonLink href="/companies/new">
            <Plus size={16} /> New Company
          </ButtonLink>
        }
      />

      <form className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search companies or contacts…"
            className="w-full rounded-lg border border-zinc-300 bg-white py-2 pl-9 pr-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <input type="hidden" name="sort" value={sort} />
        <CompanySortSelect value={sort} />
      </form>

      {companies.length === 0 ? (
        <EmptyState
          title={query ? "No companies match your search" : "No companies yet"}
          description={
            query
              ? "Try a different name or city."
              : "Add your first company to start building your pipeline."
          }
          action={
            !query && (
              <ButtonLink href="/companies/new">
                <Plus size={16} /> New Company
              </ButtonLink>
            )
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-4 py-3 font-medium">Stage</th>
                <th className="px-4 py-3 font-medium">Contacts</th>
                <th className="px-4 py-3 font-medium">Contact info</th>
                <th className="px-4 py-3 font-medium">First Touch</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {companies.map((company) => (
                <tr key={company.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                  <td className="px-4 py-3">
                    <Link href={`/companies/${company.id}`} className="font-medium text-zinc-900 hover:underline dark:text-zinc-100">
                      {company.name}
                    </Link>
                    {company.city && <p className="text-xs text-zinc-500 dark:text-zinc-400">{company.city}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge className={`${STAGE_COLORS[company.stage].bg} ${STAGE_COLORS[company.stage].text}`}>
                        {STAGE_LABELS[company.stage]}
                      </Badge>
                      {company.status === "WON" && (
                        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                          Won
                        </Badge>
                      )}
                      {company.status === "LOST" && (
                        <Badge className="bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">Lost</Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {company.contacts.length === 0 ? (
                      <span className="text-zinc-400">—</span>
                    ) : (
                      <div className="flex flex-col gap-0.5">
                        {company.contacts.slice(0, 3).map((contact) => (
                          <span key={contact.id} className="flex items-center gap-1 text-xs">
                            {contact.isDecisionMaker && <Star size={10} className="shrink-0 fill-current text-amber-500" />}
                            {contact.firstName} {contact.lastName}
                          </span>
                        ))}
                        {company.contacts.length > 3 && (
                          <span className="text-xs text-zinc-400">+{company.contacts.length - 3} more</span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    <div className="flex flex-col gap-0.5">
                      {company.email && (
                        <span className="flex items-center gap-1.5 text-xs">
                          <Mail size={12} /> {company.email}
                        </span>
                      )}
                      {company.phone && (
                        <span className="flex items-center gap-1.5 text-xs">
                          <Phone size={12} /> {company.phone}
                        </span>
                      )}
                      {!company.email && !company.phone && <span className="text-zinc-400">—</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {!company.touchCallTextAt && company.stage !== "RELATIONSHIP_MANAGEMENT" ? (
                      <ScheduleFirstTouchButton
                        companyId={company.id}
                        companyName={company.name}
                        phone={company.phone}
                        email={company.email}
                        scheduledAt={company.firstTouchScheduledAt}
                      />
                    ) : (
                      <span className="text-zinc-400">—</span>
                    )}
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
