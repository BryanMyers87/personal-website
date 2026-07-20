"use client";

import { useTransition } from "react";
import { format } from "date-fns";
import { clsx } from "clsx";
import { setTouchPoint } from "@/actions/touchPoints";
import { TOUCH_POINTS, type TouchPointDates } from "@/lib/touchPoints";
import { Card } from "@/components/ui";

export default function TouchPointChecklist({
  contactId,
  dates,
}: {
  contactId: string;
  dates: TouchPointDates;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Card className="divide-y divide-zinc-100 dark:divide-zinc-800">
      {TOUCH_POINTS.map((tp) => {
        const value = dates[tp.field];
        const done = !!value;
        return (
          <label key={tp.key} className="flex cursor-pointer items-start gap-3 px-4 py-3">
            <input
              type="checkbox"
              checked={done}
              disabled={isPending}
              onChange={(e) => startTransition(() => setTouchPoint(contactId, tp.key, e.target.checked))}
              className="mt-0.5"
            />
            <div className="min-w-0 flex-1">
              <p className={clsx("text-sm font-medium", done && "text-zinc-500 line-through dark:text-zinc-400")}>
                {tp.label} <span className="text-xs font-normal text-zinc-400">({tp.dayLabel})</span>
              </p>
              {value && <p className="text-xs text-zinc-400">Logged {format(value, "PPp")}</p>}
            </div>
          </label>
        );
      })}
    </Card>
  );
}
