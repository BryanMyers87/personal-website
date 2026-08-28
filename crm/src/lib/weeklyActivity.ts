export const ACTIVITY_GOALS = {
  calls: 60,
  dropIns: 40,
  meetings: 10,
} as const;

export type ActivityField = keyof typeof ACTIVITY_GOALS;

export const ACTIVITY_LABELS: Record<ActivityField, string> = {
  calls: "Cold Calls",
  dropIns: "Drop-Ins",
  meetings: "Meetings",
};

export const ACTIVITY_FIELDS = Object.keys(ACTIVITY_GOALS) as ActivityField[];
