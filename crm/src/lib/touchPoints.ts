export const TOUCH_POINTS = [
  { key: "callText", field: "touchCallTextAt", label: "Call + Text", dayLabel: "Day 1" },
  { key: "email", field: "touchEmailAt", label: "Email", dayLabel: "Day 1 afternoon" },
  { key: "linkedin", field: "touchLinkedinAt", label: "LinkedIn", dayLabel: "Day 4" },
  { key: "dropIn", field: "touchDropInAt", label: "Drop-In", dayLabel: "Day 7" },
  { key: "call", field: "touchCallAt", label: "Call", dayLabel: "Day 10" },
  { key: "text", field: "touchTextAt", label: "Text", dayLabel: "Day 14" },
  { key: "breakup", field: "touchBreakupAt", label: "Break-up", dayLabel: "Day 19" },
] as const;

export type TouchPointKey = (typeof TOUCH_POINTS)[number]["key"];
export type TouchPointField = (typeof TOUCH_POINTS)[number]["field"];

export type TouchPointDates = {
  [K in TouchPointField]: Date | null;
};
