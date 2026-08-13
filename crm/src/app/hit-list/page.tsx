import Link from "next/link";
import { Mail, Phone, Search, ArrowRight, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { clsx } from "clsx";
import { prisma } from "@/lib/prisma";
import { addHitListEntryToPipeline } from "@/actions/hitList";
import { Badge, Card, EmptyState, PageHeader, StatTile } from "@/components/ui";
import HitListContactedToggle from "@/components/HitListContactedToggle";

export const dynamic = "force-dynamic";

const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "not-contacted", label: "Not Contacted" },
  { value: "contacted", label: "Contacted" },
  { value: "in-pipeline", label: "In Pipeline" },
] as const;

type StatusFilter = (typeof STATUS_FILTERS)[number]["value"];

const SORT_FIELDS = [
  { value: "company", label: "Company" },
  { value: "city", label: "City" },
  { value: "phone", label: "Contact info" },
  { value: "contacted", label: "Contacted" },
] as const;

type SortField = (typeof SORT_FIELDS)[number]["value"];
type SortDir = "asc" | "desc";

export default async function HitListPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; sort?: string; dir?: string }>;
}) {
  const { q, status: statusParam, sort: sortParam, dir: dirParam } = await searchParams;
  const query = q?.trim() ?? "";
  const status: StatusFilter = STATUS_FILTERS.some((s) => s.value === statusParam)
    ? (statusParam as StatusFilter)
    : "all";
  const sort: SortField = SORT_FIELDS.some((s) => s.value === sortParam) ? (sortParam as SortField) : "company";
  const dir: SortDir = dirParam === "desc" ? "desc" : "asc";

  const orderBy =
    sort === "city"
      ? { city: dir }
      : sort === "phone"
        ? { phone: dir }
        : sort === "contacted"
          ? { contactedAt: dir }
          : { companyName: dir };

  const [totalCount, contactedCount, convertedCount, entries] = await Promise.all([
    prisma.hitListEntry.count(),
    prisma.hitListEntry.count({ where: { contactedAt: { not: null } } }),
    prisma.hitListEntry.count({ where: { convertedCompanyId: { not: null } } }),
    prisma.hitListEntry.findMany({
      where: {
        ...(query
          ? {
              OR: [
                { companyName: { contains: query, mode: "insensitive" } },
                { city: { contains: query, mode: "insensitive" } },
              ],
            }
          : {}),
        ...(status === "contacted" ? { contactedAt: { not: null } } : {}),
        ...(status === "not-contacted" ? { contactedAt: null } : {}),
        ...(status === "in-pipeline" ? { convertedCompanyId: { not: null } } : {}),
      },
      orderBy,
    }),
  ]);

  function sortHref(field: SortField) {
    const nextDir: SortDir = sort === field && dir === "asc" ? "desc" : "asc";
    const params = new URLSearchParams({
      ...(query ? { q: query } : {}),
      ...(status !== "all" ? { status } : {}),
      sort: field,
      dir: nextDir,
    });
    return `/hit-list?${params.toString()}`;
  }

  function sortableHeader(field: SortField, label: string) {
    const active = sort === field;
    return (
      <th key={field} className="px-4 py-3 font-medium">
        <Link href={sortHref(field)} className="flex items-center gap-1 hover:text-zinc-900 dark:hover:text-zinc-100">
          {label}
          {active ? (
            dir === "asc" ? (
              <ChevronUp size={12} />
            ) : (
              <ChevronDown size={12} />
            )
          ) : (
            <ChevronsUpDown size={12} className="text-zinc-300 dark:text-zinc-600" />
          )}
        </Link>
      </th>
    );
  }

  return (
    <div>
      <PageHeader
        title="Hit List"
        description="Contractors you're working to connect with — log a basic touchpoint here, and add to the pipeline only when you're ready to attach a contact."
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Total" value={totalCount} />
        <StatTile label="Contacted" value={contactedCount} />
        <StatTile label="In Pipeline" value={convertedCount} />
        <StatTile label="Remaining" value={totalCount - contactedCount} />
      </div>

      <form className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search company or city…"
            className="w-full rounded-lg border border-zinc-300 bg-white py-2 pl-9 pr-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <input type="hidden" name="status" value={status} />
        <input type="hidden" name="sort" value={sort} />
        <input type="hidden" name="dir" value={dir} />
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map((filter) => (
            <Link
              key={filter.value}
              href={`/hit-list?${new URLSearchParams({ ...(query ? { q: query } : {}), status: filter.value, sort, dir }).toString()}`}
              className={clsx(
                "rounded-lg px-2.5 py-1.5 text-xs font-medium",
                status === filter.value
                  ? "bg-indigo-600 text-white"
                  : "border border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800",
              )}
            >
              {filter.label}
            </Link>
          ))}
        </div>
      </form>

      {entries.length === 0 ? (
        <EmptyState
          title={query || status !== "all" ? "No companies match" : "Hit list is empty"}
          description={query || status !== "all" ? "Try a different search or filter." : undefined}
        />
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400">
              <tr>
                {sortableHeader("contacted", "Contacted")}
                {sortableHeader("company", "Company")}
                {sortableHeader("city", "City")}
                {sortableHeader("phone", "Contact info")}
                <th className="px-4 py-3 font-medium">Services</th>
                <th className="px-4 py-3 font-medium">Pipeline</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {entries.map((entry) => (
                <tr key={entry.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                  <td className="px-4 py-3">
                    <HitListContactedToggle id={entry.id} contacted={!!entry.contactedAt} />
                  </td>
                  <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                    {entry.companyName}
                    {entry.website && (
                      <p className="truncate text-xs font-normal text-zinc-400">
                        <a href={entry.website} target="_blank" rel="noreferrer" className="hover:underline">
                          {entry.website}
                        </a>
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {entry.city ?? <span className="text-zinc-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    <div className="flex flex-col gap-0.5">
                      {entry.phone && (
                        <span className="flex items-center gap-1.5 text-xs">
                          <Phone size={12} /> {entry.phone}
                        </span>
                      )}
                      {entry.email && (
                        <span className="flex items-center gap-1.5 text-xs">
                          <Mail size={12} /> {entry.email}
                        </span>
                      )}
                      {!entry.phone && !entry.email && <span className="text-zinc-400">—</span>}
                    </div>
                  </td>
                  <td className="max-w-[220px] truncate px-4 py-3 text-xs text-zinc-500 dark:text-zinc-400" title={entry.services ?? undefined}>
                    {entry.services ?? <span className="text-zinc-400">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {entry.convertedCompanyId ? (
                      <Link href={`/contacts?q=${encodeURIComponent(entry.companyName)}`}>
                        <Badge className="bg-emerald-100 text-emerald-700 hover:underline dark:bg-emerald-950 dark:text-emerald-300">
                          In Pipeline
                        </Badge>
                      </Link>
                    ) : (
                      <form action={addHitListEntryToPipeline.bind(null, entry.id)}>
                        <button
                          type="submit"
                          className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                        >
                          Add to Pipeline
                          <ArrowRight size={12} />
                        </button>
                      </form>
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
