import Link from "next/link";
import { format, addDays, startOfWeek } from "date-fns";
import { ArrowLeft, Check } from "lucide-react";
import { clsx } from "clsx";
import { prisma } from "@/lib/prisma";
import { Badge, Card, EmptyState, PageHeader, StatTile } from "@/components/ui";
import { ACTIVITY_FIELDS, ACTIVITY_GOALS, ACTIVITY_LABELS } from "@/lib/weeklyActivity";

// Always reflects the latest logged counts; never serve a stale build-time
// snapshot.
export const dynamic = "force-dynamic";

export default async function ActivityHistoryPage() {
  const weeks = await prisma.weeklyActivity.findMany({ orderBy: { weekStart: "desc" } });

  const currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 }).getTime();
  const weeksAllGoalsMet = weeks.filter((w) =>
    ACTIVITY_FIELDS.every((field) => w[field] >= ACTIVITY_GOALS[field]),
  ).length;

  return (
    <div>
      <PageHeader
        title="Weekly Activity History"
        description="Every week you've logged cold calls, drop-ins, and meetings against goal."
        action={
          <Link
            href="/this-week"
            className="flex items-center gap-1.5 text-sm font-medium text-zinc-600 hover:underline dark:text-zinc-300"
          >
            <ArrowLeft size={14} /> Back to This Week
          </Link>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatTile label="Weeks Tracked" value={weeks.length} />
        <StatTile label="Weeks All Goals Met" value={weeksAllGoalsMet} />
      </div>

      {weeks.length === 0 ? (
        <EmptyState
          title="No activity logged yet"
          description="Log a cold call, drop-in, or meeting on This Week and it'll show up here once the week ends."
        />
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3 font-medium">Week</th>
                {ACTIVITY_FIELDS.map((field) => (
                  <th key={field} className="px-4 py-3 font-medium">
                    {ACTIVITY_LABELS[field]}
                  </th>
                ))}
                <th className="px-4 py-3 font-medium">Goals Met</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {weeks.map((week) => {
                const isCurrent = week.weekStart.getTime() === currentWeekStart;
                const metCount = ACTIVITY_FIELDS.filter((field) => week[field] >= ACTIVITY_GOALS[field]).length;
                const allMet = metCount === ACTIVITY_FIELDS.length;

                return (
                  <tr key={week.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">
                        {format(week.weekStart, "MMM d")} – {format(addDays(week.weekStart, 6), "MMM d, yyyy")}
                      </p>
                      {isCurrent && (
                        <Badge className="mt-1 bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
                          This week
                        </Badge>
                      )}
                    </td>
                    {ACTIVITY_FIELDS.map((field) => {
                      const met = week[field] >= ACTIVITY_GOALS[field];
                      return (
                        <td key={field} className="px-4 py-3">
                          <span
                            className={clsx(
                              "font-medium",
                              met ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-700 dark:text-zinc-300",
                            )}
                          >
                            {week[field]}
                          </span>
                          <span className="text-zinc-400"> / {ACTIVITY_GOALS[field]}</span>
                        </td>
                      );
                    })}
                    <td className="px-4 py-3">
                      {allMet ? (
                        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                          <Check size={11} /> All goals met
                        </Badge>
                      ) : (
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">
                          {metCount} / {ACTIVITY_FIELDS.length}
                        </span>
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
