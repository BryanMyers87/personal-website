"use client";

import { useTransition } from "react";
import { format } from "date-fns";
import { clsx } from "clsx";
import { CalendarPlus } from "lucide-react";
import { setTouchPoint } from "@/actions/touchPoints";
import { TOUCH_POINTS, getNextTouchPoint, type TouchPointDates } from "@/lib/touchPoints";
import { buildGoogleCalendarLink } from "@/lib/googleCalendarLink";
import { Card } from "@/components/ui";
import ScheduleFirstTouchButton from "@/components/ScheduleFirstTouchButton";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const FIVE_MINUTES_MS = 5 * 60 * 1000;

export default function TouchPointChecklist({
  contactId,
  contactName,
  phone,
  email,
  firstTouchScheduledAt,
  dates,
}: {
  contactId: string;
  contactName: string;
  phone: string | null;
  email: string | null;
  firstTouchScheduledAt: Date | string | null;
  dates: TouchPointDates;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Card className="divide-y divide-zinc-100 dark:divide-zinc-800">
      {TOUCH_POINTS.map((tp) => {
        const value = dates[tp.field];
        const done = !!value;
        const next = getNextTouchPoint(tp.key);
        const nextDone = next && !!dates[next.field];

        const nextReminder =
          done && value && next && !nextDone
            ? {
                label: next.label,
                link: buildGoogleCalendarLink({
                  title: `${next.label} touch point — ${contactName}`,
                  description: `Next step in the outreach cadence (${next.dayLabel}) after logging ${tp.label}.`,
                  start: new Date(value.getTime() + (next.dayOffset - tp.dayOffset) * ONE_DAY_MS),
                  end: new Date(value.getTime() + (next.dayOffset - tp.dayOffset) * ONE_DAY_MS + FIVE_MINUTES_MS),
                }),
              }
            : null;

        const isFirstTouchPoint = tp.key === TOUCH_POINTS[0].key;

        return (
          <div key={tp.key} className="flex flex-wrap items-start gap-3 px-4 py-3">
            <label className="flex flex-1 cursor-pointer items-start gap-3">
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
            {nextReminder && (
              <a
                href={nextReminder.link}
                target="_blank"
                rel="noreferrer"
                className="flex shrink-0 items-center gap-1.5 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                <CalendarPlus size={13} />
                Add {nextReminder.label} to Calendar
              </a>
            )}
            {isFirstTouchPoint && !done && (
              <div className="w-full sm:w-auto">
                <ScheduleFirstTouchButton
                  contactId={contactId}
                  contactName={contactName}
                  phone={phone}
                  email={email}
                  scheduledAt={firstTouchScheduledAt}
                />
              </div>
            )}
          </div>
        );
      })}
    </Card>
  );
}
