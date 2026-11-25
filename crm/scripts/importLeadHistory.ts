// One-time import of the Energuy lead-report history CSV.
//
// Usage (run locally, with DATABASE_URL pointed at the Railway database):
//   npx tsx scripts/importLeadHistory.ts /path/to/history.csv          (dry run — reports only)
//   npx tsx scripts/importLeadHistory.ts /path/to/history.csv --apply  (writes to the database)
//
// The CSV itself should never live inside this repo — keep it anywhere
// outside the checkout. Safe to re-run: existing periods are upserted, not
// duplicated. Unmatched company names are skipped and listed so you can
// create the company (or an alias) and re-run.

import { readFileSync } from "fs";
import { prisma } from "@/lib/prisma";
import { parseHistoryCsv } from "@/lib/leadCsv";
import { buildCompanyMatchIndex, matchCompanyId } from "@/lib/companyMatch";

async function main() {
  const args = process.argv.slice(2);
  const apply = args.includes("--apply");
  const csvPath = args.find((a) => !a.startsWith("--"));

  if (!csvPath) {
    console.error("Usage: npx tsx scripts/importLeadHistory.ts <path-to-history.csv> [--apply]");
    process.exit(1);
  }

  const csvText = readFileSync(csvPath, "utf-8");
  const rows = parseHistoryCsv(csvText);
  if (rows.length === 0) {
    console.error("No rows found in that file.");
    process.exit(1);
  }

  const [companies, aliases] = await Promise.all([
    prisma.company.findMany({ select: { id: true, name: true } }),
    prisma.companyAlias.findMany({ select: { alias: true, companyId: true } }),
  ]);
  const matchIndex = buildCompanyMatchIndex(companies, aliases);

  const unmatchedNames = new Set<string>();
  let matchedCount = 0;
  let skippedZero = 0;

  for (const row of rows) {
    if (row.leads === 0) {
      skippedZero++;
      continue;
    }

    const companyId = matchCompanyId(row.company, matchIndex);
    if (!companyId) {
      unmatchedNames.add(row.company);
      continue;
    }

    matchedCount++;
    if (apply) {
      await prisma.leadReport.upsert({
        where: {
          companyId_periodStart_periodEnd: { companyId, periodStart: row.periodStart, periodEnd: row.periodEnd },
        },
        update: {
          leads: row.leads,
          appsBooked: row.appsBooked,
          billedToContractor: row.billedToContractor,
          dnq: row.dnq,
          industry: row.industry,
          granularity: row.granularity,
        },
        create: {
          companyId,
          periodStart: row.periodStart,
          periodEnd: row.periodEnd,
          granularity: row.granularity,
          leads: row.leads,
          appsBooked: row.appsBooked,
          billedToContractor: row.billedToContractor,
          dnq: row.dnq,
          industry: row.industry,
        },
      });
    }
  }

  console.log(
    `Parsed ${rows.length} rows: ${matchedCount} matched, ${skippedZero} skipped (zero leads), ${unmatchedNames.size} unmatched company name(s).`,
  );
  if (unmatchedNames.size > 0) {
    console.log("\nUnmatched company names — create the company or add an alias, then re-run:");
    for (const name of unmatchedNames) console.log(`  - ${name}`);
  }
  console.log(apply ? "\nDone." : "\nDry run only — nothing written. Re-run with --apply to commit.");

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
