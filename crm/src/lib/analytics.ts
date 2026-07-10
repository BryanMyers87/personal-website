import { startOfWeek, subWeeks, format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { STAGE_LABELS, STAGE_ORDER } from "@/lib/stages";
import { LeadStage } from "@/generated/prisma/enums";

const WEEKS_OF_HISTORY = 12;

// Consecutive stage pairs that make up the core delivery cycle:
// booking the appointment -> performing the audit -> submitting -> approval.
const CYCLE_TRANSITIONS: [LeadStage, LeadStage][] = [
  [LeadStage.APPOINTMENT_BOOKED, LeadStage.AUDIT_IN_PROGRESS],
  [LeadStage.AUDIT_IN_PROGRESS, LeadStage.SUBMITTED_FOR_APPROVAL],
  [LeadStage.SUBMITTED_FOR_APPROVAL, LeadStage.APPROVED],
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
  const [contactCount, companyCount, leads, historyEntries] = await Promise.all([
    prisma.contact.count(),
    prisma.company.count(),
    prisma.lead.findMany({
      select: {
        id: true,
        stage: true,
        status: true,
        source: true,
        estimatedValue: true,
        appointmentDate: true,
        createdAt: true,
      },
    }),
    prisma.stageHistoryEntry.findMany({
      orderBy: { changedAt: "asc" },
      select: { leadId: true, fromStage: true, toStage: true, changedAt: true },
    }),
  ]);

  // --- Top-line totals -----------------------------------------------------
  const openLeads = leads.filter((l) => l.status === "OPEN");
  const wonLeads = leads.filter((l) => l.status === "WON");
  const lostLeads = leads.filter((l) => l.status === "LOST");
  const openValue = openLeads.reduce((sum, l) => sum + (l.estimatedValue ?? 0), 0);
  const wonValue = wonLeads.reduce((sum, l) => sum + (l.estimatedValue ?? 0), 0);

  const totals = {
    contacts: contactCount,
    companies: companyCount,
    leads: leads.length,
    open: openLeads.length,
    won: wonLeads.length,
    lost: lostLeads.length,
    openValue,
    wonValue,
    winRate: wonLeads.length + lostLeads.length > 0 ? wonLeads.length / (wonLeads.length + lostLeads.length) : null,
  };

  // --- Funnel: how many leads have ever reached each stage ------------------
  const reachedStageLeadIds = new Map<LeadStage, Set<string>>();
  for (const stage of STAGE_ORDER) reachedStageLeadIds.set(stage, new Set());
  for (const entry of historyEntries) {
    reachedStageLeadIds.get(entry.toStage)?.add(entry.leadId);
  }
  const funnel = STAGE_ORDER.map((stage) => ({
    stage,
    label: STAGE_LABELS[stage],
    count: reachedStageLeadIds.get(stage)?.size ?? 0,
  }));

  // --- Appointments booked ---------------------------------------------------
  const appointmentEntries = historyEntries.filter((e) => e.toStage === LeadStage.APPOINTMENT_BOOKED);
  const buckets = weekBuckets();
  const bucketIndex = new Map(buckets.map((b, i) => [b.key, i]));
  const appointmentsByWeek = buckets.map((b) => ({ week: b.label, count: 0 }));
  for (const entry of appointmentEntries) {
    const key = format(startOfWeek(entry.changedAt, { weekStartsOn: 1 }), "yyyy-MM-dd");
    const idx = bucketIndex.get(key);
    if (idx !== undefined) appointmentsByWeek[idx].count += 1;
  }

  const leadsByWeek = buckets.map((b) => ({ week: b.label, count: 0 }));
  for (const lead of leads) {
    const key = format(startOfWeek(lead.createdAt, { weekStartsOn: 1 }), "yyyy-MM-dd");
    const idx = bucketIndex.get(key);
    if (idx !== undefined) leadsByWeek[idx].count += 1;
  }

  // --- Submission health: of leads that reached submission, how many won? ---
  const reachedSubmission = reachedStageLeadIds.get(LeadStage.SUBMITTED_FOR_APPROVAL) ?? new Set();
  const leadById = new Map(leads.map((l) => [l.id, l]));
  let submittedApproved = 0;
  let submittedLost = 0;
  let submittedOpen = 0;
  for (const leadId of reachedSubmission) {
    const lead = leadById.get(leadId);
    if (!lead) continue;
    if (lead.status === "WON") submittedApproved += 1;
    else if (lead.status === "LOST") submittedLost += 1;
    else submittedOpen += 1;
  }
  const submissionHealth = {
    reached: reachedSubmission.size,
    approved: submittedApproved,
    lost: submittedLost,
    stillOpen: submittedOpen,
    successRate:
      submittedApproved + submittedLost > 0 ? submittedApproved / (submittedApproved + submittedLost) : null,
  };

  // --- Cycle time per transition, computed from consecutive history rows ----
  const entriesByLead = new Map<string, typeof historyEntries>();
  for (const entry of historyEntries) {
    const arr = entriesByLead.get(entry.leadId) ?? [];
    arr.push(entry);
    entriesByLead.set(entry.leadId, arr);
  }

  const transitionDurationsMs = new Map<string, number[]>();
  for (const [, entries] of entriesByLead) {
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

  // Overall cycle: appointment booked -> approved (may span multiple hops).
  const overallDurations: number[] = [];
  for (const [, entries] of entriesByLead) {
    const bookedEntry = entries.find((e) => e.toStage === LeadStage.APPOINTMENT_BOOKED);
    const approvedEntry = entries.find((e) => e.toStage === LeadStage.APPROVED);
    if (bookedEntry && approvedEntry && approvedEntry.changedAt >= bookedEntry.changedAt) {
      overallDurations.push(approvedEntry.changedAt.getTime() - bookedEntry.changedAt.getTime());
    }
  }
  const overallAvgMs = average(overallDurations);
  const totalCycleTime = {
    avgHours: overallAvgMs != null ? overallAvgMs / (1000 * 60 * 60) : null,
    count: overallDurations.length,
  };

  // --- Leads by source --------------------------------------------------------
  const sourceCounts = new Map<string, number>();
  for (const lead of leads) {
    const key = lead.source?.trim() || "Unspecified";
    sourceCounts.set(key, (sourceCounts.get(key) ?? 0) + 1);
  }
  const leadsBySource = Array.from(sourceCounts.entries())
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count);

  return {
    totals,
    funnel,
    appointments: { total: appointmentEntries.length, byWeek: appointmentsByWeek },
    submissionHealth,
    cycleTimes,
    totalCycleTime,
    leadsBySource,
    leadsOverTime: leadsByWeek,
  };
}

export type Analytics = Awaited<ReturnType<typeof getAnalytics>>;
