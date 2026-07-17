"use client";

import { useTransition } from "react";
import { clsx } from "clsx";
import { moveDealStage, markDealWon, markDealLost, reopenDeal } from "@/actions/contacts";
import { STAGE_COLORS, STAGE_LABELS, STAGE_ORDER } from "@/lib/stages";
import type { DealStage, DealStatus } from "@/generated/prisma/enums";
import { Badge, Button } from "@/components/ui";

export default function DealStageControl({
  contactId,
  stage,
  status,
  lostReason,
}: {
  contactId: string;
  stage: DealStage;
  status: DealStatus;
  lostReason: string | null;
}) {
  const [isPending, startTransition] = useTransition();
  const colors = STAGE_COLORS[stage];
  const inRelationshipManagement = stage === "RELATIONSHIP_MANAGEMENT";

  return (
    <div className="flex flex-wrap items-center gap-3">
      {inRelationshipManagement ? (
        <Badge className={`${colors.bg} ${colors.text}`}>{STAGE_LABELS[stage]}</Badge>
      ) : (
        <select
          value={stage}
          disabled={isPending}
          onChange={(e) => {
            const next = e.target.value as DealStage;
            startTransition(() => {
              moveDealStage(contactId, next);
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
      )}

      {status === "OPEN" && (
        <>
          <Button
            type="button"
            variant="secondary"
            disabled={isPending}
            onClick={() => startTransition(() => markDealWon(contactId))}
          >
            Mark Won
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={isPending}
            onClick={() => {
              const reason = window.prompt("Why was this deal lost? (optional)") ?? "";
              startTransition(() => markDealLost(contactId, reason));
            }}
          >
            Mark Lost
          </Button>
        </>
      )}

      {status === "WON" && (
        <>
          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">Won</Badge>
          <Button type="button" variant="secondary" disabled={isPending} onClick={() => startTransition(() => reopenDeal(contactId))}>
            Reopen
          </Button>
        </>
      )}

      {status === "LOST" && (
        <>
          <Badge className="bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">
            Lost{lostReason ? `: ${lostReason}` : ""}
          </Badge>
          <Button type="button" variant="secondary" disabled={isPending} onClick={() => startTransition(() => reopenDeal(contactId))}>
            Reopen
          </Button>
        </>
      )}
    </div>
  );
}
