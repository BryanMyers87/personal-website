"use client";

import { useTransition } from "react";
import { toggleHitListContacted } from "@/actions/hitList";

export default function HitListContactedToggle({ id, contacted }: { id: string; contacted: boolean }) {
  const [isPending, startTransition] = useTransition();

  return (
    <input
      type="checkbox"
      checked={contacted}
      disabled={isPending}
      onChange={(e) => startTransition(() => toggleHitListContacted(id, e.target.checked))}
      aria-label="Contacted"
    />
  );
}
