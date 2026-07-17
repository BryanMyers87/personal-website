import { CalendarCheck, Handshake, TrendingUp, Users2 } from "lucide-react";
import { getAnalytics } from "@/lib/analytics";
import { ChartCard, PageHeader, StatTile } from "@/components/ui";
import FunnelChart from "@/components/charts/FunnelChart";
import TrendChart from "@/components/charts/TrendChart";
import CycleTimeChart from "@/components/charts/CycleTimeChart";
import SourceBarChart from "@/components/charts/SourceBarChart";
import CloseHealthBar from "@/components/charts/CloseHealthBar";

// This dashboard reads live data on every request; it must never be served
// from a build-time static snapshot.
export const dynamic = "force-dynamic";

function formatPercent(value: number | null) {
  return value == null ? "—" : `${Math.round(value * 100)}%`;
}

export default async function AnalyticsPage() {
  const data = await getAnalytics();

  return (
    <div>
      <PageHeader title="Analytics" description="A high-level read on leads coming in and deals completing." />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Total deals"
          value={data.totals.deals}
          sub={`${data.totals.open} open · ${data.totals.won} won · ${data.totals.lost} lost`}
          icon={<TrendingUp size={18} />}
        />
        <StatTile
          label="Contacts & companies"
          value={`${data.totals.contacts} / ${data.totals.companies}`}
          sub="Contacts / Companies on file"
          icon={<Users2 size={18} />}
        />
        <StatTile
          label="Meetings booked"
          value={data.meetings.total}
          sub="Deals that reached Meeting"
          icon={<CalendarCheck size={18} />}
        />
        <StatTile
          label="Win rate"
          value={formatPercent(data.totals.winRate)}
          sub={`${data.totals.openJobsPerMonth} jobs/mo in open pipeline`}
          icon={<Handshake size={18} />}
        />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard
          title="Pipeline funnel"
          description="Deals that have ever reached each stage"
          className="lg:col-span-2"
        >
          <FunnelChart data={data.funnel} />
        </ChartCard>

        <ChartCard title="Close health" description="Outcome of deals once they reach Negotiation">
          <CloseHealthBar
            won={data.closeHealth.won}
            lost={data.closeHealth.lost}
            stillOpen={data.closeHealth.stillOpen}
          />
          <p className="mt-4 text-sm">
            <span className="text-2xl font-semibold">{formatPercent(data.closeHealth.successRate)}</span>
            <span className="ml-2 text-zinc-500 dark:text-zinc-400">close success rate</span>
          </p>
        </ChartCard>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard
          title="Cycle time"
          description="Average time per stage of the pipeline"
          className="lg:col-span-2"
        >
          <CycleTimeChart
            data={[
              ...data.cycleTimes.map((c) => ({ label: c.label, avgHours: c.avgHours, count: c.count })),
              { label: "Total: Created → Won", avgHours: data.totalCycleTime.avgHours, count: data.totalCycleTime.count },
            ]}
          />
        </ChartCard>

        <ChartCard title="Deals by source" description="Where deals are coming from">
          {data.dealsBySource.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">No deals yet.</p>
          ) : (
            <SourceBarChart data={data.dealsBySource} />
          )}
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Leads created" description="New leads (contacts) per week, last 12 weeks">
          <TrendChart data={data.dealsOverTime} unitLabel="new leads" />
        </ChartCard>
        <ChartCard title="Meetings booked" description="Meetings booked per week, last 12 weeks">
          <TrendChart data={data.meetings.byWeek} unitLabel="meetings" />
        </ChartCard>
      </div>
    </div>
  );
}
