import Link from "next/link";
import { Mail, Phone, Search } from "lucide-react";
import { format, formatDistanceToNow, isPast } from "date-fns";
import { clsx } from "clsx";
import { prisma } from "@/lib/prisma";
import { Badge, Card, EmptyState, PageHeader, StatTile } from "@/components/ui";
import HealthTierSelect from "@/components/HealthTierSelect";
import { HEALTH_TIERS, type HealthTierValue } from "@/lib/accountHealth";
import { VOLUME_TIERS, volumeTierInfo } from "@/lib/volumeTier";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

const HEALTH_FILTERS = [
  { value: "all", label: "All" },
  ...HEALTH_TIERS.map((t) => ({ value: t.value, label: t.label })),
  { value: "unassigned", label: "Unassigned" },
] as const;

type HealthFilter = (typeof HEALTH_FILTERS)[number]["value"];

const VOLUME_FILTERS = [
  { value: "all", label: "All" },
  ...VOLUME_TIERS.map((t) => ({ value: String(t.tier), label: `${t.label} (${t.sub})` })),
  { value: "unassigned", label: "Unassigned" },
] as const;

type VolumeFilter = (typeof VOLUME_FILTERS)[number]["value"];

function volumeWhere(volume: VolumeFilter) {
  if (volume === "unassigned") return { jobsPerMonth: null };
  if (volume === "1") return { jobsPerMonth: { gte: 11 } };
  if (volume === "2") return { jobsPerMonth: { gte: 5, lte: 10 } };
  if (volume === "3") return { jobsPerMonth: { lte: 4 } };
  return {};
}

export default async function AccountManagementPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; health?: string; volume?: string }>;
}) {
  const { q, health: healthParam, volume: volumeParam } = await searchParams;
  const query = q?.trim() ?? "";
  const health: HealthFilter = HEALTH_FILTERS.some((f) => f.value === healthParam)
    ? (healthParam as HealthFilter)
    : "all";
  const volume: VolumeFilter = VOLUME_FILTERS.some((f) => f.value === volumeParam)
    ? (volumeParam as VolumeFilter)
    : "all";

  const accounts = await prisma.company.findMany({
    where: {
      stage: "RELATIONSHIP_MANAGEMENT",
      ...(query
        ? {
            OR: [
              { name: { contains: query } },
              { email: { contains: query } },
              { contacts: { some: { firstName: { contains: query } } } },
              { contacts: { some: { lastName: { contains: query } } } },
            ],
          }
        : {}),
      ...(health === "unassigned" ? { healthTier: null } : {}),
      ...(health !== "all" && health !== "unassigned" ? { healthTier: health as HealthTierValue } : {}),
      ...volumeWhere(volume),
    },
    include: {
      contacts: { where: { isDecisionMaker: true }, take: 1 },
      reminders: { where: { completedAt: null }, orderBy: { dueAt: "asc" }, take: 1 },
    },
    orderBy: { closedAt: "desc" },
  });

  const totalJobsPerMonth = accounts.reduce((sum, a) => sum + (a.jobsPerMonth ?? 0), 0);
  const totalProjectedValue = accounts.reduce((sum, a) => sum + (a.jobsPerMonth ?? 0) * (a.pricePerHl ?? 0), 0);
  const needsAttention = accounts.filter((a) => a.healthTier === "AT_RISK" || a.healthTier === "CRITICAL").length;

  return (
    <div>
      <PageHeader
        title="Account Management"
        description="Won accounts and the relationships you're maintaining with them."
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Won accounts" value={accounts.length} />
        <StatTile label="Total jobs/mo" value={totalJobsPerMonth} />
        <StatTile
          label="Total value of jobs (projected)"
          value={formatCurrency(totalProjectedValue)}
          sub="Jobs/mo × price per HL/HG, summed"
        />
        <StatTile label="Needs attention" value={needsAttention} sub="At Risk + Critical" />
      </div>

      <form className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search accounts or companies…"
            className="w-full rounded-lg border border-zinc-300 bg-white py-2 pl-9 pr-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <input type="hidden" name="health" value={health} />
        <input type="hidden" name="volume" value={volume} />
      </form>

      <div className="mb-4 space-y-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs font-medium text-zinc-400">Health:</span>
          {HEALTH_FILTERS.map((filter) => (
            <Link
              key={filter.value}
              href={`/account-management?${new URLSearchParams({ ...(query ? { q: query } : {}), health: filter.value, volume }).toString()}`}
              className={clsx(
                "rounded-lg px-2.5 py-1.5 text-xs font-medium",
                health === filter.value
                  ? "bg-indigo-600 text-white"
                  : "border border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800",
              )}
            >
              {filter.label}
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs font-medium text-zinc-400">Volume:</span>
          {VOLUME_FILTERS.map((filter) => (
            <Link
              key={filter.value}
              href={`/account-management?${new URLSearchParams({ ...(query ? { q: query } : {}), health, volume: filter.value }).toString()}`}
              className={clsx(
                "rounded-lg px-2.5 py-1.5 text-xs font-medium",
                volume === filter.value
                  ? "bg-indigo-600 text-white"
                  : "border border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800",
              )}
            >
              {filter.label}
            </Link>
          ))}
        </div>
      </div>

      {accounts.length === 0 ? (
        <EmptyState
          title={query ? "No accounts match your search" : "No won accounts yet"}
          description={
            query
              ? "Try a different name, email, or company."
              : "Once you mark a deal Won, it lands here in Account Management."
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3 font-medium">Account</th>
                <th className="px-4 py-3 font-medium">Health</th>
                <th className="px-4 py-3 font-medium">Key Contact</th>
                <th className="px-4 py-3 font-medium">Contact info</th>
                <th className="px-4 py-3 font-medium">Jobs/mo</th>
                <th className="px-4 py-3 font-medium">Volume</th>
                <th className="px-4 py-3 font-medium">Price/HL-HG</th>
                <th className="px-4 py-3 font-medium">Projected value</th>
                <th className="px-4 py-3 font-medium">Won</th>
                <th className="px-4 py-3 font-medium">Next reminder</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {accounts.map((account) => {
                const nextReminder = account.reminders[0];
                const overdue = nextReminder && isPast(nextReminder.dueAt);
                const projectedValue =
                  account.jobsPerMonth != null && account.pricePerHl != null
                    ? account.jobsPerMonth * account.pricePerHl
                    : null;
                const keyContact = account.contacts[0];
                return (
                  <tr key={account.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/companies/${account.id}`}
                        className="font-medium text-zinc-900 hover:underline dark:text-zinc-100"
                      >
                        {account.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <HealthTierSelect companyId={account.id} tier={account.healthTier} />
                    </td>
                    <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                      {keyContact ? (
                        <>
                          {keyContact.firstName} {keyContact.lastName}
                          {keyContact.title && <p className="text-xs text-zinc-500 dark:text-zinc-400">{keyContact.title}</p>}
                        </>
                      ) : (
                        <span className="text-zinc-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      <div className="flex flex-col gap-0.5">
                        {(keyContact?.email ?? account.email) && (
                          <span className="flex items-center gap-1.5 text-xs">
                            <Mail size={12} /> {keyContact?.email ?? account.email}
                          </span>
                        )}
                        {(keyContact?.phone ?? account.phone) && (
                          <span className="flex items-center gap-1.5 text-xs">
                            <Phone size={12} /> {keyContact?.phone ?? account.phone}
                          </span>
                        )}
                        {!(keyContact?.email ?? account.email) && !(keyContact?.phone ?? account.phone) && (
                          <span className="text-zinc-400">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {account.jobsPerMonth != null ? account.jobsPerMonth : <span className="text-zinc-400">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {(() => {
                        const info = volumeTierInfo(account.jobsPerMonth);
                        return info ? (
                          <Badge className={info.badge}>{info.label}</Badge>
                        ) : (
                          <span className="text-zinc-400">—</span>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-3">
                      {account.pricePerHl != null ? formatCurrency(account.pricePerHl) : (
                        <span className="text-zinc-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {projectedValue != null ? formatCurrency(projectedValue) : <span className="text-zinc-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {account.closedAt ? formatDistanceToNow(account.closedAt, { addSuffix: true }) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {nextReminder ? (
                        <span className={clsx("text-xs", overdue ? "font-medium text-red-600 dark:text-red-400" : "text-zinc-600 dark:text-zinc-400")}>
                          {format(nextReminder.dueAt, "PP")}
                          {overdue ? " · Overdue" : ""}
                        </span>
                      ) : (
                        <span className="text-xs text-zinc-400">None set</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
