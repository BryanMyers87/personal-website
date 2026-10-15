"use client";

import { useTransition } from "react";
import { format } from "date-fns";
import { clsx } from "clsx";
import { setRelationshipChecklistItem } from "@/actions/relationshipChecklist";
import { RELATIONSHIP_CHECKLIST, type RelationshipChecklistDates } from "@/lib/relationshipChecklist";
import { Card } from "@/components/ui";

export default function RelationshipChecklist({
  companyId,
  dates,
}: {
  companyId: string;
  dates: RelationshipChecklistDates;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Card className="divide-y divide-zinc-100 dark:divide-zinc-800">
      {RELATIONSHIP_CHECKLIST.map((item) => {
        const value = dates[item.field];
        const done = !!value;

        return (
          <label key={item.key} className="flex cursor-pointer items-start gap-3 px-4 py-3">
            <input
              type="checkbox"
              checked={done}
              disabled={isPending}
              onChange={(e) => startTransition(() => setRelationshipChecklistItem(companyId, item.key, e.target.checked))}
              className="mt-0.5"
            />
            <div className="min-w-0 flex-1">
              <p className={clsx("text-sm font-medium", done && "text-zinc-500 line-through dark:text-zinc-400")}>
                {item.label}
              </p>
              {value && <p className="text-xs text-zinc-400">Logged {format(new Date(value), "PPp")}</p>}
            </div>
          </label>
        );
      })}
    </Card>
  );
}
