import { previousDay, subDays, startOfDay, endOfDay } from "date-fns";

// Energuy lead reports are pulled every Friday, covering the previous
// Friday through Thursday (the week that just finished). Defaults to the
// most recently completed Fri–Thu week as of `today`.
export function lastFridayThursdayRange(today: Date = new Date()): { periodStart: Date; periodEnd: Date } {
  const periodEnd = startOfDay(previousDay(today, 4)); // most recent past Thursday
  const periodStart = subDays(periodEnd, 6); // the Friday 6 days before it
  return { periodStart, periodEnd: endOfDay(periodEnd) };
}
