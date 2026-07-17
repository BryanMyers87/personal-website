import type { DealStage } from "@/generated/prisma/enums";

export const STAGE_ORDER: DealStage[] = [
  "PROSPECT",
  "LEAD_QUALIFICATION",
  "MEETING",
  "PROPOSAL",
  "NEGOTIATION",
];

export const STAGE_LABELS: Record<DealStage, string> = {
  PROSPECT: "Prospect",
  LEAD_QUALIFICATION: "Lead Qualification",
  MEETING: "Meeting",
  PROPOSAL: "Proposal",
  NEGOTIATION: "Negotiation",
};

export const STAGE_SHORT_LABELS: Record<DealStage, string> = {
  PROSPECT: "Prospect",
  LEAD_QUALIFICATION: "Qualification",
  MEETING: "Meeting",
  PROPOSAL: "Proposal",
  NEGOTIATION: "Negotiation",
};

// A single-hue ordinal ramp (light -> dark = earlier -> later stage), validated
// with the dataviz skill's palette checker for both light and dark surfaces.
// Text always uses neutral ink tokens (never these hexes) so identity comes
// from the dot/bar, never from color-as-text.
export const STAGE_RAMP_LIGHT: Record<DealStage, string> = {
  PROSPECT: "#86b6ef",
  LEAD_QUALIFICATION: "#5598e7",
  MEETING: "#2a78d6",
  PROPOSAL: "#1c5cab",
  NEGOTIATION: "#104281",
};

export const STAGE_RAMP_DARK: Record<DealStage, string> = {
  PROSPECT: "#b7d3f6",
  LEAD_QUALIFICATION: "#86b6ef",
  MEETING: "#5598e7",
  PROPOSAL: "#2a78d6",
  NEGOTIATION: "#184f95",
};

// Tailwind-friendly bg/text/dot tokens for badges and the kanban board.
// Backgrounds/text stay neutral (ink tokens); the dot alone carries the
// per-stage hue so it never has to double as a text color.
export const STAGE_COLORS: Record<DealStage, { bg: string; text: string; dot: string }> = {
  PROSPECT: {
    bg: "bg-zinc-100 dark:bg-zinc-800",
    text: "text-zinc-700 dark:text-zinc-300",
    dot: "bg-[#86b6ef] dark:bg-[#b7d3f6]",
  },
  LEAD_QUALIFICATION: {
    bg: "bg-zinc-100 dark:bg-zinc-800",
    text: "text-zinc-700 dark:text-zinc-300",
    dot: "bg-[#5598e7] dark:bg-[#86b6ef]",
  },
  MEETING: {
    bg: "bg-zinc-100 dark:bg-zinc-800",
    text: "text-zinc-700 dark:text-zinc-300",
    dot: "bg-[#2a78d6] dark:bg-[#5598e7]",
  },
  PROPOSAL: {
    bg: "bg-zinc-100 dark:bg-zinc-800",
    text: "text-zinc-700 dark:text-zinc-300",
    dot: "bg-[#1c5cab] dark:bg-[#2a78d6]",
  },
  NEGOTIATION: {
    bg: "bg-zinc-100 dark:bg-zinc-800",
    text: "text-zinc-700 dark:text-zinc-300",
    dot: "bg-[#104281] dark:bg-[#184f95]",
  },
};

export function stageIndex(stage: DealStage): number {
  return STAGE_ORDER.indexOf(stage);
}

export function nextStage(stage: DealStage): DealStage | null {
  const idx = stageIndex(stage);
  if (idx === -1 || idx === STAGE_ORDER.length - 1) return null;
  return STAGE_ORDER[idx + 1];
}
