"use client";

import { useTransition } from "react";
import { clsx } from "clsx";
import { toggleContactDecisionMaker } from "@/actions/contacts";

export default function DecisionMakerToggle({
  contactId,
  isDecisionMaker,
}: {
  contactId: string;
  isDecisionMaker: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <label
      className={clsx(
        "inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium transition-colors",
        isDecisionMaker
          ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
          : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700",
        isPending && "opacity-60",
      )}
      onClick={(e) => e.stopPropagation()}
    >
      <input
        type="checkbox"
        checked={isDecisionMaker}
        disabled={isPending}
        onChange={(e) => {
          const next = e.target.checked;
          startTransition(() => {
            toggleContactDecisionMaker(contactId, next);
          });
        }}
        className="h-3 w-3"
      />
      Key decision maker
    </label>
  );
}
