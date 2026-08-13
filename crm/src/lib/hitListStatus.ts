export const OUTREACH_STATUSES = [
  {
    value: "NOT_CONTACTED",
    label: "Not Contacted",
    select: "bg-white text-zinc-700 border border-zinc-300 dark:bg-zinc-900 dark:text-zinc-300 dark:border-zinc-700",
  },
  {
    value: "ATTEMPTED",
    label: "Attempted",
    select: "bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-900",
  },
  {
    value: "RESPONDED",
    label: "Responded",
    select: "bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-900",
  },
  {
    value: "NOT_INTERESTED",
    label: "Not Interested",
    select: "bg-red-100 text-red-800 border border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-900",
  },
] as const;

export type OutreachStatusValue = (typeof OUTREACH_STATUSES)[number]["value"];

export function outreachStatusInfo(value: OutreachStatusValue) {
  return OUTREACH_STATUSES.find((s) => s.value === value) ?? OUTREACH_STATUSES[0];
}
