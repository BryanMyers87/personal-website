import { format, startOfYear, startOfMonth, subWeeks, subDays, addMonths } from "date-fns";
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

export async function getPortfolioMonthlyLeads(): Promise<MonthlyLeadDatum[]> {
  const reports = await prisma.leadReport.findMany({
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

  return Array.from(byMonth.values());
}

export type TopHvacContractor = {
  id: string;
  name: string;
  leads: number;
  appsBooked: number;
  bookingRate: number;
};

export async function getTopHvacContractorsAllTime(limit = 20): Promise<TopHvacContractor[]> {
  const accounts = await prisma.company.findMany({
    where: { stage: "RELATIONSHIP_MANAGEMENT" },
    select: {
      id: true,
      name: true,
      industry: true,
      leadReports: { select: { leads: true, appsBooked: true, industry: true } },
    },
  });

  const contractors: TopHvacContractor[] = [];
  for (const account of accounts) {
    if (account.leadReports.length === 0) continue;
    const industry = account.industry ?? account.leadReports[account.leadReports.length - 1]?.industry ?? "";
    if (!/hvac/i.test(industry)) continue;

    const leads = account.leadReports.reduce((sum, r) => sum + r.leads, 0);
    const appsBooked = account.leadReports.reduce((sum, r) => sum + r.appsBooked, 0);
    if (leads === 0) continue;

    contractors.push({ id: account.id, name: account.name, leads, appsBooked, bookingRate: appsBooked / leads });
  }

  contractors.sort((a, b) => b.leads - a.leads);
  return contractors.slice(0, limit);
}

export type HvacContractorSeries = {
  id: string;
  name: string;
  totalLeads: number;
  leadsByMonth: number[]; // aligned to the months array returned alongside it
};

// Every HVAC contractor's leads by month for the current calendar year
// (Jan–Dec), sorted by total leads descending so callers can slice the
// top N or use the full list.
export async function getHvacContractorMonthlySeries(): Promise<{ months: string[]; contractors: HvacContractorSeries[] }> {
  const yearStart = startOfYear(new Date());
  const months = Array.from({ length: 12 }, (_, i) => format(addMonths(yearStart, i), "MMM"));
  const monthIndex = new Map(months.map((m, i) => [m, i]));

  const accounts = await prisma.company.findMany({
    where: { stage: "RELATIONSHIP_MANAGEMENT" },
    select: {
      id: true,
      name: true,
      industry: true,
      leadReports: { where: { periodStart: { gte: yearStart } }, select: { periodStart: true, leads: true, industry: true } },
    },
  });

  const contractors: HvacContractorSeries[] = [];
  for (const account of accounts) {
    if (account.leadReports.length === 0) continue;
    const industry = account.industry ?? account.leadReports[account.leadReports.length - 1]?.industry ?? "";
    if (!/hvac/i.test(industry)) continue;

    const leadsByMonth = new Array(12).fill(0);
    for (const report of account.leadReports) {
      const idx = monthIndex.get(format(report.periodStart, "MMM"));
      if (idx !== undefined) leadsByMonth[idx] += report.leads;
    }
    const totalLeads = leadsByMonth.reduce((sum, n) => sum + n, 0);
    if (totalLeads === 0) continue;

    contractors.push({ id: account.id, name: account.name, totalLeads, leadsByMonth });
  }

  contractors.sort((a, b) => b.totalLeads - a.totalLeads);
  return { months, contractors };
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
