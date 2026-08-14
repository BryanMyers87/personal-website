"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { CalendarClock, CalendarPlus, X } from "lucide-react";
import {
  getScheduledFirstTouchSlots,
  scheduleFirstTouchCall,
  cancelFirstTouchSchedule,
} from "@/actions/firstTouchSchedule";
import { findNextAvailableSlot, SLOT_LENGTH_MS } from "@/lib/firstTouchScheduling";
import { buildGoogleCalendarLink } from "@/lib/googleCalendarLink";
import { Button } from "@/components/ui";

export default function ScheduleFirstTouchButton({
  companyId,
  companyName,
  phone,
  email,
  scheduledAt,
}: {
  companyId: string;
  companyName: string;
  phone: string | null;
  email: string | null;
  scheduledAt: Date | string | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSchedule() {
    setError(null);
    startTransition(async () => {
      try {
        const existing = await getScheduledFirstTouchSlots();
        const slot = findNextAvailableSlot(existing.map((iso) => new Date(iso)));
        await scheduleFirstTouchCall(companyId, slot);
      } catch {
        setError("Couldn't schedule a slot — try again.");
      }
    });
  }

  function handleCancel() {
    startTransition(() => cancelFirstTouchSchedule(companyId));
  }

  if (scheduledAt) {
    const start = new Date(scheduledAt);
    const end = new Date(start.getTime() + SLOT_LENGTH_MS);
    const contactLines = [phone ? `Phone: ${phone}` : null, email ? `Email: ${email}` : null]
      .filter(Boolean)
      .join("\n");
    const link = buildGoogleCalendarLink({
      title: `Call + Text touch point — ${companyName}`,
      description: ["First touch point call.", contactLines].filter(Boolean).join("\n"),
      start,
      end,
    });

    return (
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-100 px-2.5 py-1.5 font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
          <CalendarClock size={13} />
          Scheduled {format(start, "EEE, MMM d 'at' h:mm a")}
        </span>
        <a
          href={link}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-2.5 py-1.5 font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <CalendarPlus size={13} />
          Add to Calendar
        </a>
        <button
          type="button"
          disabled={isPending}
          onClick={handleCancel}
          className="flex items-center gap-1 text-zinc-400 hover:text-red-600 disabled:opacity-50 dark:hover:text-red-400"
        >
          <X size={13} />
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div>
      <Button type="button" variant="secondary" disabled={isPending} onClick={handleSchedule}>
        <CalendarClock size={14} />
        {isPending ? "Finding a slot…" : "Schedule First Touch Call"}
      </Button>
      {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
