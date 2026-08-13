"use client";

import { useTransition } from "react";
import { clsx } from "clsx";
import { setHitListOutreachStatus } from "@/actions/hitList";
import { OUTREACH_STATUSES, outreachStatusInfo, type OutreachStatusValue } from "@/lib/hitListStatus";

export default function HitListStatusSelect({ id, status }: { id: string; status: OutreachStatusValue }) {
  const [isPending, startTransition] = useTransition();
  const info = outreachStatusInfo(status);

  return (
    <select
      value={status}
      disabled={isPending}
      onChange={(e) => startTransition(() => setHitListOutreachStatus(id, e.target.value as OutreachStatusValue))}
      className={clsx("rounded-lg px-2.5 py-1.5 text-xs font-medium", info.select)}
    >
      {OUTREACH_STATUSES.map((s) => (
        <option key={s.value} value={s.value}>
          {s.label}
        </option>
      ))}
    </select>
  );
}
