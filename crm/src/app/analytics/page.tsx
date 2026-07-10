import { CalendarCheck, Handshake, TrendingUp, Users2 } from "lucide-react";
import { getAnalytics } from "@/lib/analytics";
import { ChartCard, PageHeader, StatTile } from "@/components/ui";
import FunnelChart from "@/components/charts/FunnelChart";
import TrendChart from "@/components/charts/TrendChart";
import CycleTimeChart from "@/components/charts/CycleTimeChart";
import SourceBarChart from "@/components/charts/SourceBarChart";
import SubmissionHealthBar from "@/components/charts/SubmissionHealthBar";

// This dashboard reads live data on every request; it must never be served
// from a build-time static snapshot.
export const dynamic = "force-dynamic";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

function formatPercent(value: number | null) {
  return value == null ? "—" : `${Math.round(value * 100)}%`;
}

export default async function AnalyticsPage() {
  const data = await getAnalytics();

  return (
    <div>
      <PageHeader title="Analytics" description="A high-level read on contacts, the pipeline, and delivery cycle times." />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Total leads"
          value={data.totals.leads}
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
          label="Appointments booked"
          value={data.appointments.total}
          sub="Leads that reached Appointment Booked"
          icon={<CalendarCheck size={18} />}
        />
        <StatTile
          label="Win rate"
          value={formatPercent(data.totals.winRate)}
          sub={`${formatCurrency(data.totals.openValue)} open pipeline value`}
          icon={<Handshake size={18} />}
        />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard
          title="Pipeline funnel"
          description="Leads that have ever reached each stage"
          className="lg:col-span-2"
        >
          <FunnelChart data={data.funnel} />
        </ChartCard>

        <ChartCard title="Submission health" description="Outcome of leads once submitted for approval">
          <SubmissionHealthBar
            approved={data.submissionHealth.approved}
            lost={data.submissionHealth.lost}
            stillOpen={data.submissionHealth.stillOpen}
          />
          <p className="mt-4 text-sm">
            <span className="text-2xl font-semibold">{formatPercent(data.submissionHealth.successRate)}</span>
            <span className="ml-2 text-zinc-500 dark:text-zinc-400">approval success rate</span>
          </p>
        </ChartCard>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard
          title="Cycle time"
          description="Average time per stage of the delivery cycle"
          className="lg:col-span-2"
        >
          <CycleTimeChart
            data={[
              ...data.cycleTimes.map((c) => ({ label: c.label, avgHours: c.avgHours, count: c.count })),
              { label: "Total: Booked → Approved", avgHours: data.totalCycleTime.avgHours, count: data.totalCycleTime.count },
            ]}
          />
        </ChartCard>

        <ChartCard title="Leads by source" description="Where leads are coming from">
          {data.leadsBySource.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">No leads yet.</p>
          ) : (
            <SourceBarChart data={data.leadsBySource} />
          )}
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Leads created" description="New leads per week, last 12 weeks">
          <TrendChart data={data.leadsOverTime} unitLabel="new leads" />
        </ChartCard>
        <ChartCard title="Appointments booked" description="Appointments booked per week, last 12 weeks">
          <TrendChart data={data.appointments.byWeek} unitLabel="appointments" />
        </ChartCard>
      </div>
    </div>
  );
}
