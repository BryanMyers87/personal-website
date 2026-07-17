import { useIsDarkMode } from "@/lib/useIsDarkMode";

// Chart chrome tokens from the dataviz palette (references/palette.md),
// selected per-mode rather than auto-flipped.
export function useChartTheme() {
  const isDark = useIsDarkMode();
  return {
    isDark,
    grid: isDark ? "#2c2c2a" : "#e1e0d9",
    axis: isDark ? "#898781" : "#898781",
    tooltipBg: isDark ? "#1a1a19" : "#fcfcfb",
    tooltipBorder: isDark ? "rgba(255,255,255,0.10)" : "rgba(11,11,11,0.10)",
    tooltipText: isDark ? "#ffffff" : "#0b0b0b",
  };
}

// Single-hue ordinal ramp used for the 5 pipeline stages (light -> dark =
// earlier -> later stage), validated with the dataviz palette checker.
export const STAGE_RAMP = {
  light: ["#86b6ef", "#5598e7", "#2a78d6", "#1c5cab", "#104281"],
  dark: ["#b7d3f6", "#86b6ef", "#5598e7", "#2a78d6", "#184f95"],
};

// Sequential "blue" mid-step, for single-series magnitude/trend charts.
export const SEQUENTIAL_HUE = { light: "#2a78d6", dark: "#3987e5" };

// Fixed-order categorical palette (validated), for the deals-by-source chart.
export const CATEGORICAL = {
  light: ["#2a78d6", "#1baf7a", "#eda100", "#008300", "#4a3aa7", "#e34948", "#e87ba4", "#eb6834"],
  dark: ["#3987e5", "#199e70", "#c98500", "#008300", "#9085e9", "#e66767", "#d55181", "#d95926"],
};

// Fixed status roles, never reused for series identity.
export const STATUS = {
  good: { light: "#0ca30c", dark: "#0ca30c" },
  critical: { light: "#d03b3b", dark: "#d03b3b" },
  neutral: { light: "#c3c2b7", dark: "#383835" },
};
