export const CONTACT_SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "firstName", label: "First Name (A–Z)" },
  { value: "lastName", label: "Last Name (A–Z)" },
  { value: "company", label: "Company (A–Z)" },
  { value: "city", label: "City (A–Z)" },
] as const;

export type ContactSort = (typeof CONTACT_SORT_OPTIONS)[number]["value"];

const DEFAULT_SORT: ContactSort = "newest";

export function parseContactSort(value: string | undefined): ContactSort {
  return CONTACT_SORT_OPTIONS.find((o) => o.value === value)?.value ?? DEFAULT_SORT;
}
