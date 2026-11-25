import { format, formatDistanceToNow } from "date-fns";
import { prisma } from "@/lib/prisma";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import UnmatchedNumberResolver from "@/components/UnmatchedNumberResolver";
import { getUnmatchedNumberGroups } from "@/actions/communicationImport";

export const dynamic = "force-dynamic";

export default async function UnmatchedNumbersPage() {
  const [groups, companies] = await Promise.all([
    getUnmatchedNumberGroups(),
    prisma.company.findMany({
      select: { id: true, name: true, contacts: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="Unmatched Phone Numbers"
        description="Calls and texts from numbers that don't match any contact or company yet. Assign one to a company (and optionally a specific person) to log its history and auto-match it going forward, or ignore it for good."
      />

      {groups.length === 0 ? (
        <EmptyState
          title="Nothing to review"
          description="Every imported call and text either matched a known number or has been ignored."
        />
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3 font-medium">Number</th>
                <th className="px-4 py-3 font-medium">Activity</th>
                <th className="px-4 py-3 font-medium">Last seen</th>
                <th className="px-4 py-3 font-medium">Assign</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {groups.map((group) => (
                <tr key={group.rawNumber}>
                  <td className="px-4 py-3 font-medium">{group.rawNumber}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {group.calls > 0 && (
                        <Badge className="bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                          {group.calls} call{group.calls === 1 ? "" : "s"}
                        </Badge>
                      )}
                      {group.texts > 0 && (
                        <Badge className="bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                          {group.texts} text{group.texts === 1 ? "" : "s"}
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 max-w-xs truncate text-xs text-zinc-400">{group.latestSummary}</p>
                  </td>
                  <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                    <span title={format(group.lastSeenAt, "PPp")}>
                      {formatDistanceToNow(group.lastSeenAt, { addSuffix: true })}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <UnmatchedNumberResolver rawNumber={group.rawNumber} companies={companies} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
