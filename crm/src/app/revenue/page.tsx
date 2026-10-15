import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
import RevenueLedger from "@/components/RevenueLedger";

// Reflects newly-logged or deleted entries immediately; never serve a
// stale build-time snapshot.
export const dynamic = "force-dynamic";

export default async function RevenueLogPage() {
  const [entries, wonAccounts] = await Promise.all([
    prisma.revenueEntry.findMany({
      include: { company: { select: { name: true } } },
      orderBy: { receivedAt: "desc" },
    }),
    prisma.company.findMany({
      where: { status: "WON" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const mappedEntries = entries.map((e) => ({
    id: e.id,
    companyId: e.companyId,
    companyName: e.company.name,
    amount: e.amount,
    receivedAt: e.receivedAt,
    note: e.note,
  }));

  return (
    <div>
      <PageHeader
        title="Revenue Log"
        description="Every actual revenue payment logged against a won account."
        action={
          <Link
            href="/analytics"
            className="flex items-center gap-1.5 text-sm font-medium text-zinc-600 hover:underline dark:text-zinc-300"
          >
            <ArrowLeft size={14} /> Back to Analytics
          </Link>
        }
      />
      <RevenueLedger accounts={wonAccounts} entries={mappedEntries} />
    </div>
  );
}
