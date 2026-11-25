import { format, startOfYear, startOfMonth, subWeeks, subDays } from "date-fns";
import { prisma } from "@/lib/prisma";

export type MonthlyLeadDatum = { month: string; leads: number; appsBooked: number };

export type BookingRateWindow = {
  leads: number;
  appsBooked: number;
  rate: number; // appsBooked / leads, 0 when leads is 0
};

export type ContractorLeadStats = {
  monthlySeries: MonthlyLeadDatum[];
  yearToDate: BookingRateWindow;
  last60Days: BookingRateWindow;
};

function toWindow(rows: { leads: number; appsBooked: number }[]): BookingRateWindow {
  const leads = rows.reduce((sum, r) => sum + r.leads, 0);
  const appsBooked = rows.reduce((sum, r) => sum + r.appsBooked, 0);
  return { leads, appsBooked, rate: leads > 0 ? appsBooked / leads : 0 };
}

export async function getContractorLeadStats(companyId: string): Promise<ContractorLeadStats> {
  const reports = await prisma.leadReport.findMany({
    where: { companyId },
    orderBy: { periodStart: "asc" },
    select: { periodStart: true, leads: true, appsBooked: true },
  });

  const byMonth = new Map<string, MonthlyLeadDatum>();
  for (const report of reports) {
    const key = format(report.periodStart, "MMM yyyy");
    const existing = byMonth.get(key);
    if (existing) {
      existing.leads += report.leads;
      existing.appsBooked += report.appsBooked;
    } else {
      byMonth.set(key, { month: key, leads: report.leads, appsBooked: report.appsBooked });
    }
  }

  const now = new Date();
  const yearStart = startOfYear(now);
  const sixtyDaysAgo = subDays(now, 60);

  return {
    monthlySeries: Array.from(byMonth.values()),
    yearToDate: toWindow(reports.filter((r) => r.periodStart >= yearStart)),
    last60Days: toWindow(reports.filter((r) => r.periodStart >= sixtyDaysAgo)),
  };
}

export type GoneQuietAccount = {
  id: string;
  name: string;
  lastLeadDate: Date;
};

export type TopHvacAccount = {
  id: string;
  name: string;
  appsBooked: number;
};

export type LeadDashboardStats = {
  goneQuiet: GoneQuietAccount[];
  topHvacThisMonth: TopHvacAccount[];
};

export async function getLeadDashboardStats(): Promise<LeadDashboardStats> {
  const now = new Date();
  const fourWeeksAgo = subWeeks(now, 4);
  const monthStart = startOfMonth(now);

  const accounts = await prisma.company.findMany({
    where: { stage: "RELATIONSHIP_MANAGEMENT" },
    select: {
      id: true,
      name: true,
      industry: true,
      leadReports: {
        select: { periodStart: true, periodEnd: true, leads: true, appsBooked: true, industry: true },
      },
    },
  });

  const goneQuiet: GoneQuietAccount[] = [];
  const topHvacThisMonth: TopHvacAccount[] = [];

  for (const account of accounts) {
    const reports = account.leadReports;
    if (reports.length === 0) continue;

    const everHadLeads = reports.some((r) => r.leads > 0);
    const recentLeads = reports
      .filter((r) => r.periodStart >= fourWeeksAgo)
      .reduce((sum, r) => sum + r.leads, 0);
    if (everHadLeads && recentLeads === 0) {
      const lastLeadDate = reports
        .filter((r) => r.leads > 0)
        .reduce((latest, r) => (r.periodEnd > latest ? r.periodEnd : latest), reports[0].periodEnd);
      goneQuiet.push({ id: account.id, name: account.name, lastLeadDate });
    }

    const industry = account.industry ?? reports[reports.length - 1]?.industry ?? "";
    if (/hvac/i.test(industry)) {
      const appsBookedThisMonth = reports
        .filter((r) => r.periodStart >= monthStart)
        .reduce((sum, r) => sum + r.appsBooked, 0);
      if (appsBookedThisMonth > 0) {
        topHvacThisMonth.push({ id: account.id, name: account.name, appsBooked: appsBookedThisMonth });
      }
    }
  }

  goneQuiet.sort((a, b) => b.lastLeadDate.getTime() - a.lastLeadDate.getTime());
  topHvacThisMonth.sort((a, b) => b.appsBooked - a.appsBooked);

  return { goneQuiet, topHvacThisMonth: topHvacThisMonth.slice(0, 10) };
}
