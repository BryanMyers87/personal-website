"use client";

import { useTransition } from "react";
import { clsx } from "clsx";
import { setAccountHealth } from "@/actions/accountHealth";
import { HEALTH_TIERS, healthTierInfo, type HealthTierValue } from "@/lib/accountHealth";

export default function HealthTierSelect({
  companyId,
  tier,
}: {
  companyId: string;
  tier: HealthTierValue | null;
}) {
  const [isPending, startTransition] = useTransition();
  const info = healthTierInfo(tier);

  return (
    <select
      value={tier ?? ""}
      disabled={isPending}
      onChange={(e) => startTransition(() => setAccountHealth(companyId, e.target.value as HealthTierValue | ""))}
      className={clsx(
        "rounded-lg border-none px-2.5 py-1.5 text-xs font-medium",
        info ? info.badge : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
      )}
    >
      <option value="">Unassigned</option>
      {HEALTH_TIERS.map((t) => (
        <option key={t.value} value={t.value}>
          {t.label}
        </option>
      ))}
    </select>
  );
}
