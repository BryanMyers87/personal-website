// Purely derived from jobsPerMonth — not stored, so it can never drift out
// of sync with the number it's based on.
export const VOLUME_TIERS = [
  {
    tier: 1,
    label: "Tier 1",
    sub: "11+ /mo",
    badge: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
  },
  {
    tier: 2,
    label: "Tier 2",
    sub: "5–10 /mo",
    badge: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  },
  {
    tier: 3,
    label: "Tier 3",
    sub: "≤4 /mo",
    badge: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  },
] as const;

export type VolumeTierNumber = (typeof VOLUME_TIERS)[number]["tier"];

export function getVolumeTier(jobsPerMonth: number | null): VolumeTierNumber | null {
  if (jobsPerMonth == null) return null;
  if (jobsPerMonth >= 11) return 1;
  if (jobsPerMonth >= 5) return 2;
  return 3;
}

export function volumeTierInfo(jobsPerMonth: number | null) {
  const tier = getVolumeTier(jobsPerMonth);
  if (tier == null) return null;
  return VOLUME_TIERS.find((t) => t.tier === tier) ?? null;
}
