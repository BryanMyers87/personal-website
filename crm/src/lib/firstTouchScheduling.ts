// All computed in the caller's local time (this runs client-side), so
// "9:30 AM" means 9:30 AM in whoever's browser is scheduling — there's no
// server-side timezone to get wrong.
const WINDOW_START = { hour: 9, minute: 30 };
const WINDOW_END = { hour: 10, minute: 30 };
const SLOT_MINUTES = 5;

export const SLOT_LENGTH_MS = SLOT_MINUTES * 60 * 1000;

function isMondayOrFriday(date: Date): boolean {
  const day = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 5 = Friday, 6 = Saturday
  return day === 1 || day === 5;
}

function upcomingMondaysAndFridays(from: Date, count: number): Date[] {
  const dates: Date[] = [];
  const cursor = new Date(from);
  cursor.setHours(0, 0, 0, 0);
  while (dates.length < count) {
    if (isMondayOrFriday(cursor)) dates.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

function slotsForDay(day: Date): Date[] {
  const start = new Date(day);
  start.setHours(WINDOW_START.hour, WINDOW_START.minute, 0, 0);
  const end = new Date(day);
  end.setHours(WINDOW_END.hour, WINDOW_END.minute, 0, 0);

  const slots: Date[] = [];
  for (let t = start.getTime(); t + SLOT_LENGTH_MS <= end.getTime(); t += SLOT_LENGTH_MS) {
    slots.push(new Date(t));
  }
  return slots;
}

// Walks forward through upcoming Mondays/Fridays, packing 5-minute slots
// from 9:30-10:30, and returns the first one not already in `occupied`.
export function findNextAvailableSlot(occupied: Date[], from: Date = new Date()): Date {
  const occupiedTimes = new Set(occupied.map((d) => d.getTime()));
  const candidateDays = upcomingMondaysAndFridays(from, 12); // ~6 weeks of Mon/Fri lookahead

  for (const day of candidateDays) {
    for (const slot of slotsForDay(day)) {
      if (slot.getTime() < from.getTime()) continue; // never book into the past
      if (!occupiedTimes.has(slot.getTime())) return slot;
    }
  }

  // Every slot in the lookahead window was taken — fall back to the first
  // slot of the day after the window rather than failing outright.
  return slotsForDay(upcomingMondaysAndFridays(from, 13)[12])[0];
}
