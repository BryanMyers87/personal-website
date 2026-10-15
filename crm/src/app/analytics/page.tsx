import Link from "next/link";
import { format } from "date-fns";
import { clsx } from "clsx";
import { DollarSign, Receipt } from "lucide-react";
import { getAnalytics } from "@/lib/analytics";
import { Badge, Card, ChartCard, PageHeader, StatTile } from "@/components/ui";
import FunnelChart from "@/components/charts/FunnelChart";
import SourceBarChart from "@/components/charts/SourceBarChart";
import RevenueTrendChart from "@/components/charts/RevenueTrendChart";
import ThisMonthRevenueChart from "@/components/charts/ThisMonthRevenueChart";
import { healthTierInfo, type HealthTierValue } from "@/lib/accountHealth";

// This dashboard reads live data on every request; it must never be served
// from a build-time static snapshot.
export const dynamic = "force-dynamic";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

export default async function AnalyticsPage() {
  const data = await getAnalytics();
  const monthPct =
    data.revenue.projectedMonthly > 0
      ? Math.min(100, Math.round((data.revenue.actualThisMonth / data.revenue.projectedMonthly) * 100))
      : 0;
  const monthGoalMet = data.revenue.projectedMonthly > 0 && data.revenue.actualThisMonth >= data.revenue.projectedMonthly;
  const recentEntries = data.revenue.entries.slice(0, 15);

  return (
    <div>
      <PageHeader title="Analytics" description="A high-level read on leads coming in and deals completing." />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatTile
          label="Projected Revenue"
          value={formatCurrency(data.revenue.projectedMonthly)}
          sub="Avg monthly across all contractors, this year's complete months"
          icon={<DollarSign size={18} />}
        />
      </div>

      <div className="mb-6">
        <ChartCard title="Pipeline funnel" description="Deals that have ever reached each stage">
          <FunnelChart data={data.funnel} />
        </ChartCard>
      </div>

      <div className="mb-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Revenue: Actual vs Projected
        </h2>
        <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="p-5 sm:col-span-2">
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">This Month vs Projected</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight">
              {formatCurrency(data.revenue.actualThisMonth)}
              <span className="text-lg font-normal text-zinc-400"> / {formatCurrency(data.revenue.projectedMonthly)}</span>
            </p>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
              <div
                className={clsx("h-full rounded-full transition-all", monthGoalMet ? "bg-emerald-500" : "bg-indigo-500")}
                style={{ width: `${monthPct}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">{monthPct}% of projected achieved this month</p>
          </Card>
          <StatTile label="Actual (All-Time)" value={formatCurrency(data.revenue.actualAllTime)} />
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ChartCard
            title="Actual revenue by month"
            description="Logged revenue vs. the average-projected monthly figure (dashed line), last 6 months"
          >
            <RevenueTrendChart data={data.revenue.actualByMonth} projected={data.revenue.projectedMonthly} />
          </ChartCard>

          <ChartCard title="This month's income by account" description="How much has come in this month, per account">
            {data.revenue.thisMonthByAccount.length === 0 ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">No revenue logged this month yet.</p>
            ) : (
              <ThisMonthRevenueChart data={data.revenue.thisMonthByAccount} projected={data.revenue.projectedMonthly} />
            )}
          </ChartCard>
        </div>
      </div>

      <div className="mb-6">
        <ChartCard title="Deals by source" description="Where deals are coming from">
          {data.dealsBySource.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">No deals yet.</p>
          ) : (
            <SourceBarChart data={data.dealsBySource} />
          )}
        </ChartCard>
      </div>

      <div className="mb-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Recent Revenue <span className="ml-1 font-normal text-zinc-400">(last 15)</span>
          </h2>
          <Link
            href="/revenue"
            className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
          >
            <Receipt size={13} /> Log Revenue
          </Link>
        </div>
        {recentEntries.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">No revenue logged yet.</p>
        ) : (
          <div className="space-y-2">
            {recentEntries.map((entry) => (
              <Card key={entry.id} className="flex items-center justify-between gap-3 p-3">
                <div className="min-w-0">
                  <p className="text-sm">
                    <span className="font-semibold">{formatCurrency(entry.amount)}</span>
                    <span className="text-zinc-400"> from </span>
                    <Link href={`/companies/${entry.companyId}`} className="font-medium hover:underline">
                      {entry.companyName}
                    </Link>
                  </p>
                  <p className="text-xs text-zinc-400">
                    {format(new Date(entry.receivedAt), "PP")}
                    {entry.note ? ` · ${entry.note}` : ""}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Top 20 Accounts <span className="ml-1 font-normal text-zinc-400">by average monthly value, trailing 12 months of logged revenue</span>
        </h2>
        {data.topAccounts.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">No accounts with logged revenue yet.</p>
        ) : (
          <Card className="overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400">
                <tr>
                  <th className="px-4 py-3 font-medium">#</th>
                  <th className="px-4 py-3 font-medium">Account</th>
                  <th className="px-4 py-3 font-medium">Health</th>
                  <th className="px-4 py-3 font-medium">Avg monthly value</th>
                  <th className="px-4 py-3 font-medium">Total (12mo)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {data.topAccounts.map((account, idx) => {
                  const info = healthTierInfo(account.healthTier as HealthTierValue | null);
                  return (
                    <tr key={account.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                      <td className="px-4 py-3 text-zinc-400">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/companies/${account.id}`}
                          className="font-medium text-zinc-900 hover:underline dark:text-zinc-100"
                        >
                          {account.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        {info ? <Badge className={info.badge}>{info.label}</Badge> : <span className="text-zinc-400">—</span>}
                      </td>
                      <td className="px-4 py-3 font-medium">{formatCurrency(account.avgMonthlyValue)}</td>
                      <td className="px-4 py-3">{formatCurrency(account.totalRevenueTTM)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        )}
      </div>
    </div>
  );
}
