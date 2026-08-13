import Link from "next/link";
import { startOfDay, endOfDay, addDays, formatDistanceToNow } from "date-fns";
import { AlertTriangle, Mail, Phone } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Badge, Card, PageHeader, StatTile } from "@/components/ui";
import ReminderRow, { type ReminderRowData } from "@/components/ReminderRow";
import HitListStatusSelect from "@/components/HitListStatusSelect";
import { healthTierInfo, type HealthTierValue } from "@/lib/accountHealth";

// The daily to-do list — always live, never a stale build-time snapshot.
export const dynamic = "force-dynamic";

const HEALTH_RANK: Record<HealthTierValue, number> = { CRITICAL: 0, AT_RISK: 1, HEALTHY: 2 };

export default async function ThisWeekPage() {
  const now = new Date();
  const todayStart = startOfDay(now);
  const weekEnd = endOfDay(addDays(now, 7));

  const [overdueReminders, thisWeekReminders, atRiskAccounts, hitListFollowUps] = await Promise.all([
    prisma.reminder.findMany({
      where: { completedAt: null, dueAt: { lt: todayStart } },
      include: { contact: { select: { firstName: true, lastName: true, company: { select: { name: true } } } } },
      orderBy: { dueAt: "asc" },
    }),
    prisma.reminder.findMany({
      where: { completedAt: null, dueAt: { gte: todayStart, lte: weekEnd } },
      include: { contact: { select: { firstName: true, lastName: true, company: { select: { name: true } } } } },
      orderBy: { dueAt: "asc" },
    }),
    prisma.contact.findMany({
      where: { stage: "RELATIONSHIP_MANAGEMENT", healthTier: { in: ["AT_RISK", "CRITICAL"] } },
      include: { company: true },
    }),
    prisma.hitListEntry.findMany({
      where: { outreachStatus: "ATTEMPTED" },
      orderBy: { contactedAt: "asc" },
      take: 10,
    }),
  ]);

  atRiskAccounts.sort((a, b) => HEALTH_RANK[a.healthTier as HealthTierValue] - HEALTH_RANK[b.healthTier as HealthTierValue]);

  function toReminderRow(reminder: (typeof overdueReminders)[number]): ReminderRowData {
    return {
      id: reminder.id,
      note: reminder.note,
      dueAt: reminder.dueAt,
      contactId: reminder.contactId,
      contactName: `${reminder.contact.firstName} ${reminder.contact.lastName}`,
      companyName: reminder.contact.company?.name ?? null,
    };
  }

  const allCaughtUp = overdueReminders.length === 0 && thisWeekReminders.length === 0;

  return (
    <div>
      <PageHeader
        title="This Week"
        description="Your daily to-do list, generated from what's actually due — overdue and upcoming reminders, at-risk accounts, and Hit List follow-ups."
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Overdue" value={overdueReminders.length} />
        <StatTile label="Due this week" value={thisWeekReminders.length} />
        <StatTile label="At-risk accounts" value={atRiskAccounts.length} />
        <StatTile label="Hit List follow-ups" value={hitListFollowUps.length} />
      </div>

      <div className="space-y-8">
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Overdue Reminders <span className="ml-1 font-normal text-zinc-400">({overdueReminders.length})</span>
          </h2>
          {overdueReminders.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Nothing overdue.</p>
          ) : (
            <ul className="space-y-2">
              {overdueReminders.map((reminder) => (
                <li key={reminder.id}>
                  <ReminderRow reminder={toReminderRow(reminder)} />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Due This Week <span className="ml-1 font-normal text-zinc-400">({thisWeekReminders.length})</span>
          </h2>
          {thisWeekReminders.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Nothing due in the next 7 days.</p>
          ) : (
            <ul className="space-y-2">
              {thisWeekReminders.map((reminder) => (
                <li key={reminder.id}>
                  <ReminderRow reminder={toReminderRow(reminder)} />
                </li>
              ))}
            </ul>
          )}
          {allCaughtUp && (
            <p className="mt-2 text-sm text-emerald-600 dark:text-emerald-400">
              You&apos;re fully caught up on reminders. 🎉
            </p>
          )}
        </div>

        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            At-Risk Accounts <span className="ml-1 font-normal text-zinc-400">({atRiskAccounts.length})</span>
          </h2>
          {atRiskAccounts.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">No won accounts flagged At Risk or Critical.</p>
          ) : (
            <ul className="space-y-2">
              {atRiskAccounts.map((account) => {
                const info = healthTierInfo(account.healthTier as HealthTierValue);
                return (
                  <li key={account.id}>
                    <Card className="flex items-center justify-between gap-3 p-3">
                      <div className="flex items-center gap-2">
                        <AlertTriangle size={15} className="shrink-0 text-red-500" />
                        <div>
                          <Link
                            href={`/contacts/${account.id}`}
                            className="text-sm font-medium hover:underline"
                          >
                            {account.firstName} {account.lastName}
                          </Link>
                          {account.company && (
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">{account.company.name}</p>
                          )}
                        </div>
                      </div>
                      {info && <Badge className={info.badge}>{info.label}</Badge>}
                    </Card>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Hit List Follow-ups <span className="ml-1 font-normal text-zinc-400">({hitListFollowUps.length})</span>
          </h2>
          <p className="mb-3 text-xs text-zinc-400">Attempted but not yet Responded — the oldest attempts first.</p>
          {hitListFollowUps.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">No pending Hit List follow-ups.</p>
          ) : (
            <ul className="space-y-2">
              {hitListFollowUps.map((entry) => (
                <li key={entry.id}>
                  <Card className="flex flex-wrap items-center justify-between gap-3 p-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{entry.companyName}</p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                        {entry.city && <span>{entry.city}</span>}
                        {entry.phone && (
                          <span className="flex items-center gap-1">
                            <Phone size={11} /> {entry.phone}
                          </span>
                        )}
                        {entry.email && (
                          <span className="flex items-center gap-1">
                            <Mail size={11} /> {entry.email}
                          </span>
                        )}
                        {entry.contactedAt && <span>Attempted {formatDistanceToNow(entry.contactedAt, { addSuffix: true })}</span>}
                      </div>
                    </div>
                    <HitListStatusSelect id={entry.id} status={entry.outreachStatus} />
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
