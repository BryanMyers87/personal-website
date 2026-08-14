"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { clsx } from "clsx";
import { GripVertical, Star } from "lucide-react";
import { moveDealStage } from "@/actions/companies";
import { STAGE_COLORS, STAGE_LABELS, STAGE_ORDER } from "@/lib/stages";
import type { DealStage } from "@/generated/prisma/enums";
import { Badge } from "@/components/ui";

// Won and Lost deals never reach the board — Won moves to Relationship
// Management (a stage outside STAGE_ORDER) and Lost is filtered out
// upstream into the Holding Tank — so every deal here is always OPEN.
export type PipelineDeal = {
  id: string;
  name: string;
  stage: DealStage;
  jobsPerMonth: number | null;
  contacts: { id: string; firstName: string; lastName: string; isDecisionMaker: boolean }[];
};

export default function PipelineBoard({ deals }: { deals: PipelineDeal[] }) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<DealStage | null>(null);
  const [isPending, startTransition] = useTransition();

  const columns = STAGE_ORDER.map((stage) => ({
    stage,
    deals: deals.filter((deal) => deal.stage === stage),
  }));

  function handleDrop(stage: DealStage) {
    setDragOverStage(null);
    if (!draggingId) return;
    const companyId = draggingId;
    setDraggingId(null);
    startTransition(() => {
      moveDealStage(companyId, stage);
    });
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map(({ stage, deals: stageDeals }) => {
        const colors = STAGE_COLORS[stage];
        const totalJobsPerMonth = stageDeals.reduce((sum, deal) => sum + (deal.jobsPerMonth ?? 0), 0);

        return (
          <div
            key={stage}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverStage(stage);
            }}
            onDragLeave={() => setDragOverStage((s) => (s === stage ? null : s))}
            onDrop={(e) => {
              e.preventDefault();
              handleDrop(stage);
            }}
            className={clsx(
              "flex w-[280px] shrink-0 flex-col rounded-xl border bg-white transition-colors dark:bg-zinc-900",
              dragOverStage === stage
                ? "border-indigo-400 ring-2 ring-indigo-200 dark:ring-indigo-900"
                : "border-zinc-200 dark:border-zinc-800",
            )}
          >
            <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={clsx("h-2 w-2 rounded-full", colors.dot)} />
                  <p className="text-sm font-semibold">{STAGE_LABELS[stage]}</p>
                </div>
                <Badge className="bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                  {stageDeals.length}
                </Badge>
              </div>
              {totalJobsPerMonth > 0 && (
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{totalJobsPerMonth} jobs/mo</p>
              )}
            </div>

            <div className="flex-1 space-y-2 p-2" style={{ minHeight: 160 }}>
              {stageDeals.length === 0 ? (
                <p className="px-2 py-6 text-center text-xs text-zinc-400">No deals</p>
              ) : (
                stageDeals.map((deal) => {
                  const decisionMaker = deal.contacts.find((c) => c.isDecisionMaker);
                  const otherContacts = deal.contacts.filter((c) => c.id !== decisionMaker?.id);
                  return (
                    <div
                      key={deal.id}
                      draggable
                      onDragStart={() => setDraggingId(deal.id)}
                      onDragEnd={() => setDraggingId(null)}
                      className={clsx(
                        "group rounded-lg border border-zinc-200 bg-white p-3 shadow-sm transition-opacity dark:border-zinc-800 dark:bg-zinc-950",
                        draggingId === deal.id && "opacity-40",
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <GripVertical size={14} className="mt-0.5 shrink-0 cursor-grab text-zinc-300 dark:text-zinc-700" />
                        <Link href={`/companies/${deal.id}`} className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium hover:underline">{deal.name}</p>
                          {deal.contacts.length > 0 && (
                            <div className="mt-1 space-y-0.5">
                              {decisionMaker && (
                                <p className="flex items-center gap-1 truncate text-xs text-zinc-500 dark:text-zinc-400">
                                  <Star size={10} className="shrink-0 fill-current text-amber-500" />
                                  {decisionMaker.firstName} {decisionMaker.lastName}
                                </p>
                              )}
                              {otherContacts.length > 0 && (
                                <p className="truncate text-xs text-zinc-400">
                                  {otherContacts.map((c) => `${c.firstName} ${c.lastName}`).join(", ")}
                                </p>
                              )}
                            </div>
                          )}
                          {deal.jobsPerMonth != null && (
                            <div className="mt-2 flex flex-wrap items-center gap-1.5">
                              <Badge className="bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                                {deal.jobsPerMonth} jobs/mo
                              </Badge>
                            </div>
                          )}
                        </Link>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
      {isPending && (
        <div className="pointer-events-none fixed bottom-6 right-6 rounded-lg bg-zinc-900 px-3 py-2 text-xs text-white shadow-lg dark:bg-zinc-100 dark:text-zinc-900">
          Updating…
        </div>
      )}
    </div>
  );
}
