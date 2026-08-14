export const COMPANY_SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "name", label: "Name (A–Z)" },
  { value: "city", label: "City (A–Z)" },
] as const;

export type CompanySort = (typeof COMPANY_SORT_OPTIONS)[number]["value"];

const DEFAULT_SORT: CompanySort = "newest";

export function parseCompanySort(value: string | undefined): CompanySort {
  return COMPANY_SORT_OPTIONS.find((o) => o.value === value)?.value ?? DEFAULT_SORT;
}
