import Link from "next/link";
import { Mail, Phone, Search } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { prisma } from "@/lib/prisma";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import { STAGE_COLORS, STAGE_LABELS } from "@/lib/stages";

export default async function HoldingTankPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  const deals = await prisma.contact.findMany({
    where: {
      status: "LOST",
      ...(query
        ? {
            OR: [
              { firstName: { contains: query } },
              { lastName: { contains: query } },
              { email: { contains: query } },
              { company: { name: { contains: query } } },
            ],
          }
        : {}),
    },
    include: { company: true },
    orderBy: { closedAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Holding Tank"
        description="Lost deals, out of the active pipeline but kept on file in case they're worth revisiting."
      />

      <form className="mb-4">
        <div className="relative max-w-sm">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search lost deals or companies…"
            className="w-full rounded-lg border border-zinc-300 bg-white py-2 pl-9 pr-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
      </form>

      {deals.length === 0 ? (
        <EmptyState
          title={query ? "No lost deals match your search" : "The holding tank is empty"}
          description={
            query
              ? "Try a different name, email, or company."
              : "Once you mark a deal Lost, it lands here instead of cluttering the pipeline."
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-4 py-3 font-medium">Contact info</th>
                <th className="px-4 py-3 font-medium">Lost from</th>
                <th className="px-4 py-3 font-medium">Reason</th>
                <th className="px-4 py-3 font-medium">Lost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {deals.map((deal) => (
                <tr key={deal.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/contacts/${deal.id}`}
                      className="font-medium text-zinc-900 hover:underline dark:text-zinc-100"
                    >
                      {deal.firstName} {deal.lastName}
                    </Link>
                    {deal.title && <p className="text-xs text-zinc-500 dark:text-zinc-400">{deal.title}</p>}
                  </td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                    {deal.company ? deal.company.name : <span className="text-zinc-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    <div className="flex flex-col gap-0.5">
                      {deal.email && (
                        <span className="flex items-center gap-1.5 text-xs">
                          <Mail size={12} /> {deal.email}
                        </span>
                      )}
                      {deal.phone && (
                        <span className="flex items-center gap-1.5 text-xs">
                          <Phone size={12} /> {deal.phone}
                        </span>
                      )}
                      {!deal.email && !deal.phone && <span className="text-zinc-400">—</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={`${STAGE_COLORS[deal.stage].bg} ${STAGE_COLORS[deal.stage].text}`}>
                      {STAGE_LABELS[deal.stage]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {deal.lostReason || <span className="text-zinc-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {deal.closedAt ? formatDistanceToNow(deal.closedAt, { addSuffix: true }) : "—"}
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
