import type { LeadStage } from "@/generated/prisma/enums";

export const STAGE_ORDER: LeadStage[] = [
  "NEW",
  "APPOINTMENT_BOOKED",
  "AUDIT_IN_PROGRESS",
  "SUBMITTED_FOR_APPROVAL",
  "APPROVED",
];

export const STAGE_LABELS: Record<LeadStage, string> = {
  NEW: "New Lead",
  APPOINTMENT_BOOKED: "Appointment Booked",
  AUDIT_IN_PROGRESS: "Audit In Progress",
  SUBMITTED_FOR_APPROVAL: "Submitted for Approval",
  APPROVED: "Approved",
};

export const STAGE_SHORT_LABELS: Record<LeadStage, string> = {
  NEW: "New",
  APPOINTMENT_BOOKED: "Booked",
  AUDIT_IN_PROGRESS: "Audit",
  SUBMITTED_FOR_APPROVAL: "Submitted",
  APPROVED: "Approved",
};

// A single-hue ordinal ramp (light -> dark = earlier -> later stage), validated
// with the dataviz skill's palette checker for both light and dark surfaces.
// Text always uses neutral ink tokens (never these hexes) so identity comes
// from the dot/bar, never from color-as-text.
export const STAGE_RAMP_LIGHT: Record<LeadStage, string> = {
  NEW: "#86b6ef",
  APPOINTMENT_BOOKED: "#5598e7",
  AUDIT_IN_PROGRESS: "#2a78d6",
  SUBMITTED_FOR_APPROVAL: "#1c5cab",
  APPROVED: "#104281",
};

export const STAGE_RAMP_DARK: Record<LeadStage, string> = {
  NEW: "#b7d3f6",
  APPOINTMENT_BOOKED: "#86b6ef",
  AUDIT_IN_PROGRESS: "#5598e7",
  SUBMITTED_FOR_APPROVAL: "#2a78d6",
  APPROVED: "#184f95",
};

// Tailwind-friendly bg/text/dot tokens for badges and the kanban board.
// Backgrounds/text stay neutral (ink tokens); the dot alone carries the
// per-stage hue so it never has to double as a text color.
export const STAGE_COLORS: Record<LeadStage, { bg: string; text: string; dot: string }> = {
  NEW: {
    bg: "bg-zinc-100 dark:bg-zinc-800",
    text: "text-zinc-700 dark:text-zinc-300",
    dot: "bg-[#86b6ef] dark:bg-[#b7d3f6]",
  },
  APPOINTMENT_BOOKED: {
    bg: "bg-zinc-100 dark:bg-zinc-800",
    text: "text-zinc-700 dark:text-zinc-300",
    dot: "bg-[#5598e7] dark:bg-[#86b6ef]",
  },
  AUDIT_IN_PROGRESS: {
    bg: "bg-zinc-100 dark:bg-zinc-800",
    text: "text-zinc-700 dark:text-zinc-300",
    dot: "bg-[#2a78d6] dark:bg-[#5598e7]",
  },
  SUBMITTED_FOR_APPROVAL: {
    bg: "bg-zinc-100 dark:bg-zinc-800",
    text: "text-zinc-700 dark:text-zinc-300",
    dot: "bg-[#1c5cab] dark:bg-[#2a78d6]",
  },
  APPROVED: {
    bg: "bg-zinc-100 dark:bg-zinc-800",
    text: "text-zinc-700 dark:text-zinc-300",
    dot: "bg-[#104281] dark:bg-[#184f95]",
  },
};

export function stageIndex(stage: LeadStage): number {
  return STAGE_ORDER.indexOf(stage);
}

export function nextStage(stage: LeadStage): LeadStage | null {
  const idx = stageIndex(stage);
  if (idx === -1 || idx === STAGE_ORDER.length - 1) return null;
  return STAGE_ORDER[idx + 1];
}
