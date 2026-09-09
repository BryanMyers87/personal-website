import { startOfWeek, subWeeks, format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { STAGE_LABELS, STAGE_ORDER } from "@/lib/stages";
import { DealStage } from "@/generated/prisma/enums";

const WEEKS_OF_HISTORY = 12;

// Consecutive stage pairs that make up the pipeline:
// prospect -> qualify -> meeting -> proposal -> negotiation.
const CYCLE_TRANSITIONS: [DealStage, DealStage][] = [
  [DealStage.PROSPECT, DealStage.LEAD_QUALIFICATION],
  [DealStage.LEAD_QUALIFICATION, DealStage.MEETING],
  [DealStage.MEETING, DealStage.PROPOSAL],
  [DealStage.PROPOSAL, DealStage.NEGOTIATION],
];

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function weekBuckets(): { key: string; label: string }[] {
  const buckets: { key: string; label: string }[] = [];
  for (let i = WEEKS_OF_HISTORY - 1; i >= 0; i--) {
    const weekStart = startOfWeek(subWeeks(new Date(), i), { weekStartsOn: 1 });
    buckets.push({ key: format(weekStart, "yyyy-MM-dd"), label: format(weekStart, "MMM d") });
  }
  return buckets;
}

export async function getAnalytics() {
  const [companyCount, contactCount, deals, historyEntries] = await Promise.all([
    prisma.company.count(),
    prisma.contact.count(),
    prisma.company.findMany({
      select: {
        id: true,
        name: true,
        stage: true,
        status: true,
        source: true,
        jobsPerMonth: true,
        pricePerHl: true,
        healthTier: true,
        appointmentDate: true,
        createdAt: true,
        closedAt: true,
      },
    }),
    prisma.stageHistoryEntry.findMany({
      orderBy: { changedAt: "asc" },
      select: { companyId: true, fromStage: true, toStage: true, changedAt: true },
    }),
  ]);

  // --- Top-line totals -----------------------------------------------------
  const openDeals = deals.filter((d) => d.status === "OPEN");
  const wonDeals = deals.filter((d) => d.status === "WON");
  const lostDeals = deals.filter((d) => d.status === "LOST");
  const openJobsPerMonth = openDeals.reduce((sum, d) => sum + (d.jobsPerMonth ?? 0), 0);
  const wonJobsPerMonth = wonDeals.reduce((sum, d) => sum + (d.jobsPerMonth ?? 0), 0);

  const totals = {
    contacts: contactCount,
    companies: companyCount,
    deals: deals.length,
    open: openDeals.length,
    won: wonDeals.length,
    lost: lostDeals.length,
    openJobsPerMonth,
    wonJobsPerMonth,
    winRate: wonDeals.length + lostDeals.length > 0 ? wonDeals.length / (wonDeals.length + lostDeals.length) : null,
    // Distinct from winRate: this counts every deal ever created (including
    // still-open ones) rather than only closed ones, so it reads as the
    // true top-of-funnel-to-Won conversion rate.
    conversionRate: deals.length > 0 ? wonDeals.length / deals.length : null,
  };

  // --- Funnel: how many deals have ever reached each stage ------------------
  const reachedStageDealIds = new Map<DealStage, Set<string>>();
  for (const stage of STAGE_ORDER) reachedStageDealIds.set(stage, new Set());
  for (const entry of historyEntries) {
    reachedStageDealIds.get(entry.toStage)?.add(entry.companyId);
  }
  const funnel = STAGE_ORDER.map((stage) => ({
    stage,
    label: STAGE_LABELS[stage],
    count: reachedStageDealIds.get(stage)?.size ?? 0,
  }));

  // --- Meetings booked ---------------------------------------------------
  const meetingEntries = historyEntries.filter((e) => e.toStage === DealStage.MEETING);
  const buckets = weekBuckets();
  const bucketIndex = new Map(buckets.map((b, i) => [b.key, i]));
  const meetingsByWeek = buckets.map((b) => ({ week: b.label, count: 0 }));
  for (const entry of meetingEntries) {
    const key = format(startOfWeek(entry.changedAt, { weekStartsOn: 1 }), "yyyy-MM-dd");
    const idx = bucketIndex.get(key);
    if (idx !== undefined) meetingsByWeek[idx].count += 1;
  }

  const dealsByWeek = buckets.map((b) => ({ week: b.label, count: 0 }));
  for (const deal of deals) {
    const key = format(startOfWeek(deal.createdAt, { weekStartsOn: 1 }), "yyyy-MM-dd");
    const idx = bucketIndex.get(key);
    if (idx !== undefined) dealsByWeek[idx].count += 1;
  }

  // --- Close health: of deals that reached Negotiation, how many won? -------
  const reachedNegotiation = reachedStageDealIds.get(DealStage.NEGOTIATION) ?? new Set();
  const dealById = new Map(deals.map((d) => [d.id, d]));
  let negotiationWon = 0;
  let negotiationLost = 0;
  let negotiationOpen = 0;
  for (const dealId of reachedNegotiation) {
    const deal = dealById.get(dealId);
    if (!deal) continue;
    if (deal.status === "WON") negotiationWon += 1;
    else if (deal.status === "LOST") negotiationLost += 1;
    else negotiationOpen += 1;
  }
  const closeHealth = {
    reached: reachedNegotiation.size,
    won: negotiationWon,
    lost: negotiationLost,
    stillOpen: negotiationOpen,
    successRate: negotiationWon + negotiationLost > 0 ? negotiationWon / (negotiationWon + negotiationLost) : null,
  };

  // --- Cycle time per transition, computed from consecutive history rows ----
  const entriesByDeal = new Map<string, typeof historyEntries>();
  for (const entry of historyEntries) {
    const arr = entriesByDeal.get(entry.companyId) ?? [];
    arr.push(entry);
    entriesByDeal.set(entry.companyId, arr);
  }

  const transitionDurationsMs = new Map<string, number[]>();
  for (const [, entries] of entriesByDeal) {
    for (let i = 1; i < entries.length; i++) {
      const prev = entries[i - 1];
      const curr = entries[i];
      const key = `${prev.toStage}->${curr.toStage}`;
      const durationMs = curr.changedAt.getTime() - prev.changedAt.getTime();
      const arr = transitionDurationsMs.get(key) ?? [];
      arr.push(durationMs);
      transitionDurationsMs.set(key, arr);
    }
  }

  const cycleTimes = CYCLE_TRANSITIONS.map(([from, to]) => {
    const durations = transitionDurationsMs.get(`${from}->${to}`) ?? [];
    const avgMs = average(durations);
    return {
      from,
      to,
      label: `${STAGE_LABELS[from]} → ${STAGE_LABELS[to]}`,
      avgHours: avgMs != null ? avgMs / (1000 * 60 * 60) : null,
      count: durations.length,
    };
  });

  // Overall cycle: created -> won (time to close a deal).
  const wonDurations: number[] = [];
  for (const deal of wonDeals) {
    if (deal.closedAt && deal.closedAt >= deal.createdAt) {
      wonDurations.push(deal.closedAt.getTime() - deal.createdAt.getTime());
    }
  }
  const wonAvgMs = average(wonDurations);
  const totalCycleTime = {
    avgHours: wonAvgMs != null ? wonAvgMs / (1000 * 60 * 60) : null,
    count: wonDurations.length,
  };

  // --- Deals by source --------------------------------------------------------
  const sourceCounts = new Map<string, number>();
  for (const deal of deals) {
    const key = deal.source?.trim() || "Unspecified";
    sourceCounts.set(key, (sourceCounts.get(key) ?? 0) + 1);
  }
  const dealsBySource = Array.from(sourceCounts.entries())
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count);

  // --- Revenue: projected monthly recurring value across won accounts -------
  const projectedValue = (d: { jobsPerMonth: number | null; pricePerHl: number | null }) =>
    (d.jobsPerMonth ?? 0) * (d.pricePerHl ?? 0);
  const revenue = {
    totalMonthly: wonDeals.reduce((sum, d) => sum + projectedValue(d), 0),
  };

  // --- Health: relationship-health tier breakdown across won accounts -------
  const healthCounts: Record<"HEALTHY" | "AT_RISK" | "CRITICAL", number> = {
    HEALTHY: 0,
    AT_RISK: 0,
    CRITICAL: 0,
  };
  let healthUnassigned = 0;
  for (const d of wonDeals) {
    if (d.healthTier === "HEALTHY" || d.healthTier === "AT_RISK" || d.healthTier === "CRITICAL") {
      healthCounts[d.healthTier] += 1;
    } else {
      healthUnassigned += 1;
    }
  }
  const health = { counts: healthCounts, unassigned: healthUnassigned };

  // --- Top accounts: won accounts ranked by projected monthly value ---------
  const topAccounts = [...wonDeals]
    .map((d) => ({
      id: d.id,
      name: d.name,
      jobsPerMonth: d.jobsPerMonth,
      pricePerHl: d.pricePerHl,
      projectedValue: projectedValue(d),
      healthTier: d.healthTier,
    }))
    .sort((a, b) => b.projectedValue - a.projectedValue)
    .slice(0, 30);

  return {
    totals,
    funnel,
    meetings: { total: meetingEntries.length, byWeek: meetingsByWeek },
    closeHealth,
    cycleTimes,
    totalCycleTime,
    dealsBySource,
    dealsOverTime: dealsByWeek,
    revenue,
    health,
    topAccounts,
  };
}

export type Analytics = Awaited<ReturnType<typeof getAnalytics>>;
