import Papa from "papaparse";

export type ParsedLeadRow = {
  company: string;
  industry: string | null;
  leads: number;
  appsBooked: number;
  billedToContractor: number;
  dnq: number;
};

export type ParsedHistoryRow = ParsedLeadRow & {
  periodStart: Date;
  periodEnd: Date;
  granularity: "MONTH" | "WEEK";
};

function toInt(value: string | undefined): number {
  if (!value) return 0;
  const n = Number(String(value).replace(/,/g, "").trim());
  return Number.isFinite(n) ? Math.round(n) : 0;
}

// The raw weekly/monthly "Company List" export Energuy sends: Company,
// Leads, Converted Leads, Conversion Rate, Billed To Contractor, Billed To
// Contractor Rate, DNQ, Industry. The two rate columns are derived from
// the counts and aren't stored — they're recomputed wherever needed.
export function parseFridayReportCsv(csvText: string): ParsedLeadRow[] {
  const { data } = Papa.parse<Record<string, string>>(csvText, { header: true, skipEmptyLines: true });
  return data
    .map((row) => ({
      company: (row["Company"] ?? "").trim(),
      industry: row["Industry"]?.trim() || null,
      leads: toInt(row["Leads"]),
      appsBooked: toInt(row["Converted Leads"]),
      billedToContractor: toInt(row["Billed To Contractor"]),
      dnq: toInt(row["DNQ"]),
    }))
    .filter((row) => row.company.length > 0);
}

// The historical export: period_start, period_end, granularity, company,
// industry, leads, apps_booked, billed_to_contractor, dnq. Jan–Aug rows are
// monthly; Sep on, weekly — the granularity column says which per row.
export function parseHistoryCsv(csvText: string): ParsedHistoryRow[] {
  const { data } = Papa.parse<Record<string, string>>(csvText, { header: true, skipEmptyLines: true });
  return data
    .map((row) => {
      const periodStart = new Date(row["period_start"] ?? "");
      const periodEnd = new Date(row["period_end"] ?? "");
      const granularity: "MONTH" | "WEEK" = (row["granularity"] ?? "").trim().toLowerCase() === "week" ? "WEEK" : "MONTH";
      return {
        company: (row["company"] ?? "").trim(),
        industry: row["industry"]?.trim() || null,
        leads: toInt(row["leads"]),
        appsBooked: toInt(row["apps_booked"]),
        billedToContractor: toInt(row["billed_to_contractor"]),
        dnq: toInt(row["dnq"]),
        periodStart,
        periodEnd,
        granularity,
      };
    })
    .filter(
      (row) => row.company.length > 0 && !Number.isNaN(row.periodStart.getTime()) && !Number.isNaN(row.periodEnd.getTime()),
    );
}
