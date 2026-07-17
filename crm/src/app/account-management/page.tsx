import Link from "next/link";
import { Mail, Phone, Search } from "lucide-react";
import { format, formatDistanceToNow, isPast } from "date-fns";
import { clsx } from "clsx";
import { prisma } from "@/lib/prisma";
import { Card, EmptyState, PageHeader, StatTile } from "@/components/ui";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

export default async function AccountManagementPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  const accounts = await prisma.contact.findMany({
    where: {
      stage: "RELATIONSHIP_MANAGEMENT",
      ...(query
        ? {
            OR: [
              { firstName: { contains: query } },
              { lastName: { contains: query } },
              { email: { contains: query } },
              { company: { name: { contains: query } } },
            ],
          }
        : {}),
    },
    include: {
      company: true,
      reminders: { where: { completedAt: null }, orderBy: { dueAt: "asc" }, take: 1 },
    },
    orderBy: { closedAt: "desc" },
  });

  const totalJobsPerMonth = accounts.reduce((sum, a) => sum + (a.jobsPerMonth ?? 0), 0);

  return (
    <div>
      <PageHeader
        title="Account Management"
        description="Won accounts and the relationships you're maintaining with them."
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatTile label="Won accounts" value={accounts.length} />
        <StatTile label="Total jobs/mo" value={totalJobsPerMonth} />
      </div>

      <form className="mb-4">
        <div className="relative max-w-sm">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search accounts or companies…"
            className="w-full rounded-lg border border-zinc-300 bg-white py-2 pl-9 pr-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
      </form>

      {accounts.length === 0 ? (
        <EmptyState
          title={query ? "No accounts match your search" : "No won accounts yet"}
          description={
            query
              ? "Try a different name, email, or company."
              : "Once you mark a deal Won, it lands here in Account Management."
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3 font-medium">Account</th>
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-4 py-3 font-medium">Contact info</th>
                <th className="px-4 py-3 font-medium">Jobs/mo</th>
                <th className="px-4 py-3 font-medium">Price/HL-HG</th>
                <th className="px-4 py-3 font-medium">Won</th>
                <th className="px-4 py-3 font-medium">Next reminder</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {accounts.map((account) => {
                const nextReminder = account.reminders[0];
                const overdue = nextReminder && isPast(nextReminder.dueAt);
                return (
                  <tr key={account.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/contacts/${account.id}`}
                        className="font-medium text-zinc-900 hover:underline dark:text-zinc-100"
                      >
                        {account.firstName} {account.lastName}
                      </Link>
                      {account.title && <p className="text-xs text-zinc-500 dark:text-zinc-400">{account.title}</p>}
                    </td>
                    <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                      {account.company ? account.company.name : <span className="text-zinc-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      <div className="flex flex-col gap-0.5">
                        {account.email && (
                          <span className="flex items-center gap-1.5 text-xs">
                            <Mail size={12} /> {account.email}
                          </span>
                        )}
                        {account.phone && (
                          <span className="flex items-center gap-1.5 text-xs">
                            <Phone size={12} /> {account.phone}
                          </span>
                        )}
                        {!account.email && !account.phone && <span className="text-zinc-400">—</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {account.jobsPerMonth != null ? account.jobsPerMonth : <span className="text-zinc-400">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {account.pricePerHl != null ? formatCurrency(account.pricePerHl) : (
                        <span className="text-zinc-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {account.closedAt ? formatDistanceToNow(account.closedAt, { addSuffix: true }) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {nextReminder ? (
                        <span className={clsx("text-xs", overdue ? "font-medium text-red-600 dark:text-red-400" : "text-zinc-600 dark:text-zinc-400")}>
                          {format(nextReminder.dueAt, "PP")}
                          {overdue ? " · Overdue" : ""}
                        </span>
                      ) : (
                        <span className="text-xs text-zinc-400">None set</span>
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
