"use client";

import { useTransition } from "react";
import { clsx } from "clsx";
import { moveLeadStage, markLeadLost, reopenLead } from "@/actions/leads";
import { STAGE_COLORS, STAGE_LABELS, STAGE_ORDER } from "@/lib/stages";
import type { LeadStage, LeadStatus } from "@/generated/prisma/enums";
import { Badge, Button } from "@/components/ui";

export default function LeadStageControl({
  leadId,
  stage,
  status,
  lostReason,
}: {
  leadId: string;
  stage: LeadStage;
  status: LeadStatus;
  lostReason: string | null;
}) {
  const [isPending, startTransition] = useTransition();
  const colors = STAGE_COLORS[stage];

  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        value={stage}
        disabled={isPending}
        onChange={(e) => {
          const next = e.target.value as LeadStage;
          startTransition(() => {
            moveLeadStage(leadId, next);
          });
        }}
        className={clsx(
          "rounded-lg border-none px-3 py-1.5 text-sm font-medium",
          colors.bg,
          colors.text,
        )}
      >
        {STAGE_ORDER.map((s) => (
          <option key={s} value={s}>
            {STAGE_LABELS[s]}
          </option>
        ))}
      </select>

      {status === "WON" && (
        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">Won</Badge>
      )}

      {status === "LOST" ? (
        <>
          <Badge className="bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">
            Lost{lostReason ? `: ${lostReason}` : ""}
          </Badge>
          <Button
            type="button"
            variant="secondary"
            disabled={isPending}
            onClick={() => startTransition(() => reopenLead(leadId))}
          >
            Reopen
          </Button>
        </>
      ) : (
        <Button
          type="button"
          variant="secondary"
          disabled={isPending}
          onClick={() => {
            const reason = window.prompt("Why was this lead lost? (optional)") ?? "";
            startTransition(() => markLeadLost(leadId, reason));
          }}
        >
          Mark Lost
        </Button>
      )}
    </div>
  );
}
