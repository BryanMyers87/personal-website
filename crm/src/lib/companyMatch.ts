// Company-name matching for lead-report uploads: case-insensitive exact
// match only, against both the company's own name and any saved aliases.
// No fuzzy matching — an unresolved name is surfaced for a human decision
// rather than silently guessed at.

export function normalizeCompanyName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

export type MatchableCompany = { id: string; name: string };
export type MatchableAlias = { alias: string; companyId: string };

export function buildCompanyMatchIndex(
  companies: MatchableCompany[],
  aliases: MatchableAlias[],
): Map<string, string> {
  const index = new Map<string, string>();
  for (const company of companies) index.set(normalizeCompanyName(company.name), company.id);
  for (const alias of aliases) index.set(normalizeCompanyName(alias.alias), alias.companyId);
  return index;
}

export function matchCompanyId(rawName: string, index: Map<string, string>): string | null {
  return index.get(normalizeCompanyName(rawName)) ?? null;
}
