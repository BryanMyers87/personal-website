import type { DealStage } from "@/generated/prisma/enums";

// The 5 active stages a deal moves through before it's won or lost.
// RELATIONSHIP_MANAGEMENT isn't part of this ordinal ramp — it's the
// post-win state a deal is moved into automatically, not something dragged
// through in sequence.
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
  RELATIONSHIP_MANAGEMENT: "Relationship Management",
};

export const STAGE_SHORT_LABELS: Record<DealStage, string> = {
  PROSPECT: "Prospect",
  LEAD_QUALIFICATION: "Qualification",
  MEETING: "Meeting",
  PROPOSAL: "Proposal",
  NEGOTIATION: "Negotiation",
  RELATIONSHIP_MANAGEMENT: "Relationship Mgmt",
};

// Tailwind-friendly bg/text/dot tokens for badges and the kanban board.
// Backgrounds/text stay neutral (ink tokens); the dot alone carries the
// per-stage hue so it never has to double as a text color. The first 5 use
// the validated single-hue funnel ramp; Relationship Management uses the
// validated categorical purple since it's a separate, non-ordinal state.
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
  RELATIONSHIP_MANAGEMENT: {
    bg: "bg-zinc-100 dark:bg-zinc-800",
    text: "text-zinc-700 dark:text-zinc-300",
    dot: "bg-[#4a3aa7] dark:bg-[#9085e9]",
  },
};
