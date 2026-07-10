"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { clsx } from "clsx";
import { GripVertical } from "lucide-react";
import { moveLeadStage } from "@/actions/leads";
import { STAGE_COLORS, STAGE_LABELS, STAGE_ORDER } from "@/lib/stages";
import type { LeadStage } from "@/generated/prisma/enums";
import { Badge } from "@/components/ui";

export type PipelineLead = {
  id: string;
  title: string;
  stage: LeadStage;
  status: "OPEN" | "WON" | "LOST";
  estimatedValue: number | null;
  contact: { firstName: string; lastName: string };
  company: { name: string } | null;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

export default function PipelineBoard({ leads }: { leads: PipelineLead[] }) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<LeadStage | null>(null);
  const [isPending, startTransition] = useTransition();

  const columns = STAGE_ORDER.map((stage) => ({
    stage,
    leads: leads.filter((lead) => lead.stage === stage),
  }));

  function handleDrop(stage: LeadStage) {
    setDragOverStage(null);
    if (!draggingId) return;
    const leadId = draggingId;
    setDraggingId(null);
    startTransition(() => {
      moveLeadStage(leadId, stage);
    });
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map(({ stage, leads: stageLeads }) => {
        const colors = STAGE_COLORS[stage];
        const totalValue = stageLeads.reduce((sum, lead) => sum + (lead.estimatedValue ?? 0), 0);

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
                  {stageLeads.length}
                </Badge>
              </div>
              {totalValue > 0 && (
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{formatCurrency(totalValue)}</p>
              )}
            </div>

            <div className="flex-1 space-y-2 p-2" style={{ minHeight: 160 }}>
              {stageLeads.length === 0 ? (
                <p className="px-2 py-6 text-center text-xs text-zinc-400">No leads</p>
              ) : (
                stageLeads.map((lead) => (
                  <div
                    key={lead.id}
                    draggable
                    onDragStart={() => setDraggingId(lead.id)}
                    onDragEnd={() => setDraggingId(null)}
                    className={clsx(
                      "group rounded-lg border border-zinc-200 bg-white p-3 shadow-sm transition-opacity dark:border-zinc-800 dark:bg-zinc-950",
                      draggingId === lead.id && "opacity-40",
                      lead.status === "LOST" && "opacity-60",
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <GripVertical size={14} className="mt-0.5 shrink-0 cursor-grab text-zinc-300 dark:text-zinc-700" />
                      <Link href={`/leads/${lead.id}`} className="min-w-0 flex-1">
                        <p
                          className={clsx(
                            "truncate text-sm font-medium hover:underline",
                            lead.status === "LOST" && "line-through",
                          )}
                        >
                          {lead.title}
                        </p>
                        <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                          {lead.contact.firstName} {lead.contact.lastName}
                          {lead.company ? ` · ${lead.company.name}` : ""}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          {lead.estimatedValue != null && (
                            <Badge className="bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                              {formatCurrency(lead.estimatedValue)}
                            </Badge>
                          )}
                          {lead.status === "WON" && (
                            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                              Won
                            </Badge>
                          )}
                          {lead.status === "LOST" && (
                            <Badge className="bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">Lost</Badge>
                          )}
                        </div>
                      </Link>
                    </div>
                  </div>
                ))
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
