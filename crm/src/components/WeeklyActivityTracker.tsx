"use client";

import { useTransition } from "react";
import { Minus, Plus } from "lucide-react";
import { clsx } from "clsx";
import { adjustActivity } from "@/actions/weeklyActivity";
import { ACTIVITY_FIELDS, ACTIVITY_GOALS, ACTIVITY_LABELS, type ActivityField } from "@/lib/weeklyActivity";
import { Card } from "@/components/ui";

export default function WeeklyActivityTracker({ counts }: { counts: Record<ActivityField, number> }) {
  const [isPending, startTransition] = useTransition();

  function handleAdjust(field: ActivityField, delta: number) {
    startTransition(() => adjustActivity(field, delta));
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {ACTIVITY_FIELDS.map((field) => {
        const count = counts[field];
        const goal = ACTIVITY_GOALS[field];
        const met = count >= goal;
        const pct = Math.min(100, Math.round((count / goal) * 100));

        return (
          <Card key={field} className="p-5">
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{ACTIVITY_LABELS[field]}</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight">
              {count}
              <span className="text-lg font-normal text-zinc-400"> / {goal}</span>
            </p>

            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
              <div
                className={clsx("h-full rounded-full transition-all", met ? "bg-emerald-500" : "bg-indigo-500")}
                style={{ width: `${pct}%` }}
              />
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={isPending || count <= 0}
                onClick={() => handleAdjust(field, -1)}
                aria-label={`Decrease ${ACTIVITY_LABELS[field]}`}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 transition-colors hover:bg-zinc-50 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                <Minus size={14} />
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleAdjust(field, 1)}
                aria-label={`Increase ${ACTIVITY_LABELS[field]}`}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white transition-colors hover:bg-indigo-500 disabled:opacity-40"
              >
                <Plus size={14} />
              </button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
