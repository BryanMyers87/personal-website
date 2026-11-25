import Link from "next/link";
import { getAnalytics } from "@/lib/analytics";
import { getPortfolioMonthlyLeads, getTopHvacContractorsAllTime, getHvacContractorMonthlySeries } from "@/lib/leadStats";
import { Badge, Card, ChartCard, PageHeader } from "@/components/ui";
import FunnelChart from "@/components/charts/FunnelChart";
import SourceBarChart from "@/components/charts/SourceBarChart";
import LeadTrendChart from "@/components/charts/LeadTrendChart";
import HvacLeadsLineChart from "@/components/charts/HvacLeadsLineChart";
import { healthTierInfo, type HealthTierValue } from "@/lib/accountHealth";

// This dashboard reads live data on every request; it must never be served
// from a build-time static snapshot.
export const dynamic = "force-dynamic";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

export default async function AnalyticsPage() {
  const [data, monthlyLeads, topHvac, hvacSeries] = await Promise.all([
    getAnalytics(),
    getPortfolioMonthlyLeads(),
    getTopHvacContractorsAllTime(20),
    getHvacContractorMonthlySeries(),
  ]);

  return (
    <div>
      <PageHeader title="Analytics" description="A high-level read on leads coming in and deals completing." />

      <div className="mb-6">
        <ChartCard title="Pipeline funnel" description="Deals that have ever reached each stage">
          <FunnelChart data={data.funnel} />
        </ChartCard>
      </div>

      <div className="mb-6">
        <ChartCard title="Leads per Month" description="Total leads and apps booked across every contractor, by month">
          {monthlyLeads.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">No lead reports logged yet.</p>
          ) : (
            <LeadTrendChart data={monthlyLeads} />
          )}
        </ChartCard>
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
        <ChartCard title="HVAC Contractors — Leads by Month" description="This calendar year, one line per contractor">
          {hvacSeries.contractors.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">No HVAC contractors with lead reports yet.</p>
          ) : (
            <HvacLeadsLineChart months={hvacSeries.months} contractors={hvacSeries.contractors} />
          )}
        </ChartCard>
      </div>

      <div className="mb-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Top 20 HVAC Contractors <span className="ml-1 font-normal text-zinc-400">by total leads to date</span>
        </h2>
        {topHvac.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">No HVAC contractors with lead reports yet.</p>
        ) : (
          <Card className="overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400">
                <tr>
                  <th className="px-4 py-3 font-medium">#</th>
                  <th className="px-4 py-3 font-medium">Contractor</th>
                  <th className="px-4 py-3 font-medium">Leads</th>
                  <th className="px-4 py-3 font-medium">Apps Booked</th>
                  <th className="px-4 py-3 font-medium">Booking Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {topHvac.map((contractor, idx) => (
                  <tr key={contractor.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                    <td className="px-4 py-3 text-zinc-400">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/companies/${contractor.id}`}
                        className="font-medium text-zinc-900 hover:underline dark:text-zinc-100"
                      >
                        {contractor.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-medium">{contractor.leads}</td>
                    <td className="px-4 py-3">{contractor.appsBooked}</td>
                    <td className="px-4 py-3">{formatPercent(contractor.bookingRate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Top 20 Accounts{" "}
          <span className="ml-1 font-normal text-zinc-400">
            by average monthly value (leads × price per HL/HG), trailing 12 months
          </span>
        </h2>
        {data.topAccounts.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No accounts with both lead reports and a price per HL/HG set yet.
          </p>
        ) : (
          <Card className="overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400">
                <tr>
                  <th className="px-4 py-3 font-medium">#</th>
                  <th className="px-4 py-3 font-medium">Account</th>
                  <th className="px-4 py-3 font-medium">Health</th>
                  <th className="px-4 py-3 font-medium">Leads (12mo)</th>
                  <th className="px-4 py-3 font-medium">Avg monthly value</th>
                  <th className="px-4 py-3 font-medium">Total value (12mo)</th>
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
                      <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">{account.leadsTTM}</td>
                      <td className="px-4 py-3 font-medium">{formatCurrency(account.avgMonthlyValue)}</td>
                      <td className="px-4 py-3">{formatCurrency(account.totalValue)}</td>
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
