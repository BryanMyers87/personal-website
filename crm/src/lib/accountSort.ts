export const ACCOUNT_SORT_OPTIONS = [
  { value: "signed", label: "Contract Signed (Newest)" },
  { value: "expires", label: "Contract End Date (Soonest)" },
  { value: "won", label: "Recently Won" },
  { value: "name", label: "Name (A–Z)" },
] as const;

export type AccountSort = (typeof ACCOUNT_SORT_OPTIONS)[number]["value"];

const DEFAULT_SORT: AccountSort = "signed";

export function parseAccountSort(value: string | undefined): AccountSort {
  return ACCOUNT_SORT_OPTIONS.find((o) => o.value === value)?.value ?? DEFAULT_SORT;
}
