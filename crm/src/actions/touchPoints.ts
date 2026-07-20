"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { createCalendarEvent } from "@/lib/googleCalendar";
import { TOUCH_POINTS, getNextTouchPoint, type TouchPointKey } from "@/lib/touchPoints";

const FIVE_MINUTES_MS = 5 * 60 * 1000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export async function setTouchPoint(contactId: string, key: TouchPointKey, checked: boolean): Promise<void> {
  const value = checked ? new Date() : null;

  const data =
    key === "callText"
      ? { touchCallTextAt: value }
      : key === "email"
        ? { touchEmailAt: value }
        : key === "linkedin"
          ? { touchLinkedinAt: value }
          : key === "dropIn"
            ? { touchDropInAt: value }
            : key === "call"
              ? { touchCallAt: value }
              : key === "text"
                ? { touchTextAt: value }
                : { touchBreakupAt: value };

  const contact = await prisma.contact.update({
    where: { id: contactId },
    data,
    select: { firstName: true, lastName: true },
  });

  revalidatePath(`/contacts/${contactId}`);

  if (checked && value) {
    await scheduleNextTouchPointReminder(contactId, key, value, contact);
  }
}

async function scheduleNextTouchPointReminder(
  contactId: string,
  key: TouchPointKey,
  checkedAt: Date,
  contact: { firstName: string; lastName: string },
): Promise<void> {
  const current = TOUCH_POINTS.find((tp) => tp.key === key);
  const next = getNextTouchPoint(key);
  if (!current || !next) return;

  const gapDays = next.dayOffset - current.dayOffset;
  const start = new Date(checkedAt.getTime() + gapDays * ONE_DAY_MS);
  const end = new Date(start.getTime() + FIVE_MINUTES_MS);

  const host = (await headers()).get("host");
  const contactUrl = host ? `${host.startsWith("localhost") ? "http" : "https"}://${host}/contacts/${contactId}` : null;

  try {
    await createCalendarEvent({
      summary: `${next.label} touch point — ${contact.firstName} ${contact.lastName}`,
      description: [
        `Next step in the outreach cadence (${next.dayLabel}) after logging ${current.label}.`,
        contactUrl ? `View contact: ${contactUrl}` : null,
      ]
        .filter(Boolean)
        .join("\n"),
      start,
      end,
    });
  } catch (err) {
    // Calendar creation is best-effort — never let it block checking a
    // touch point off in the CRM itself.
    console.error("Failed to create Google Calendar reminder for touch point", err);
  }
}
