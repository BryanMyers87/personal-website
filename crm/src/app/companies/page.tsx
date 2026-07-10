import Link from "next/link";
import { Globe, Plus, Search } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Badge, ButtonLink, Card, EmptyState, PageHeader } from "@/components/ui";

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  const companies = await prisma.company.findMany({
    where: query
      ? {
          OR: [{ name: { contains: query } }, { industry: { contains: query } }],
        }
      : undefined,
    include: {
      _count: { select: { contacts: true, leads: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Companies"
        description="The organizations behind your contacts and leads."
        action={
          <ButtonLink href="/companies/new">
            <Plus size={16} /> New Company
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
            placeholder="Search companies or industries…"
            className="w-full rounded-lg border border-zinc-300 bg-white py-2 pl-9 pr-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
      </form>

      {companies.length === 0 ? (
        <EmptyState
          title={query ? "No companies match your search" : "No companies yet"}
          description={query ? "Try a different name or industry." : "Add your first company profile."}
          action={
            !query && (
              <ButtonLink href="/companies/new">
                <Plus size={16} /> New Company
              </ButtonLink>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {companies.map((company) => (
            <Link key={company.id} href={`/companies/${company.id}`}>
              <Card className="h-full p-5 transition-colors hover:border-indigo-300 dark:hover:border-indigo-700">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{company.name}</p>
                    {company.industry && <p className="text-xs text-zinc-500 dark:text-zinc-400">{company.industry}</p>}
                  </div>
                </div>
                {company.website && (
                  <p className="mt-3 flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                    <Globe size={12} /> {company.website}
                  </p>
                )}
                <div className="mt-4 flex gap-2">
                  <Badge className="bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                    {company._count.contacts} contact{company._count.contacts === 1 ? "" : "s"}
                  </Badge>
                  <Badge className="bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                    {company._count.leads} lead{company._count.leads === 1 ? "" : "s"}
                  </Badge>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
