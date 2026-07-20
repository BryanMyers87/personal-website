export const TOUCH_POINTS = [
  { key: "callText", field: "touchCallTextAt", label: "Call + Text", dayLabel: "Day 1", dayOffset: 1 },
  { key: "email", field: "touchEmailAt", label: "Email", dayLabel: "Day 1 afternoon", dayOffset: 1 },
  { key: "linkedin", field: "touchLinkedinAt", label: "LinkedIn", dayLabel: "Day 4", dayOffset: 4 },
  { key: "dropIn", field: "touchDropInAt", label: "Drop-In", dayLabel: "Day 7", dayOffset: 7 },
  { key: "call", field: "touchCallAt", label: "Call", dayLabel: "Day 10", dayOffset: 10 },
  { key: "text", field: "touchTextAt", label: "Text", dayLabel: "Day 14", dayOffset: 14 },
  { key: "breakup", field: "touchBreakupAt", label: "Break-up", dayLabel: "Day 19", dayOffset: 19 },
] as const;

export type TouchPointKey = (typeof TOUCH_POINTS)[number]["key"];
export type TouchPointField = (typeof TOUCH_POINTS)[number]["field"];
export type TouchPoint = (typeof TOUCH_POINTS)[number];

export type TouchPointDates = {
  [K in TouchPointField]: Date | null;
};

// The step immediately after `key` in the fixed cadence, or null if `key` is
// the last step (Break-up) — nothing to schedule a reminder for.
export function getNextTouchPoint(key: TouchPointKey): TouchPoint | null {
  const idx = TOUCH_POINTS.findIndex((tp) => tp.key === key);
  if (idx === -1 || idx === TOUCH_POINTS.length - 1) return null;
  return TOUCH_POINTS[idx + 1];
}
