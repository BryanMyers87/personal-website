export const HEALTH_TIERS = [
  {
    value: "HEALTHY",
    label: "Healthy",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  {
    value: "AT_RISK",
    label: "At Risk",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  {
    value: "CRITICAL",
    label: "Critical",
    badge: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
    dot: "bg-red-500",
  },
] as const;

export type HealthTierValue = (typeof HEALTH_TIERS)[number]["value"];

export function healthTierInfo(value: HealthTierValue | null) {
  return HEALTH_TIERS.find((tier) => tier.value === value) ?? null;
}
