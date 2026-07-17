"use client";

import { useChartTheme, STATUS } from "./theme";

export default function CloseHealthBar({
  won,
  lost,
  stillOpen,
}: {
  won: number;
  lost: number;
  stillOpen: number;
}) {
  const theme = useChartTheme();
  const total = won + lost + stillOpen;
  const good = theme.isDark ? STATUS.good.dark : STATUS.good.light;
  const critical = theme.isDark ? STATUS.critical.dark : STATUS.critical.light;
  const neutral = theme.isDark ? STATUS.neutral.dark : STATUS.neutral.light;

  if (total === 0) {
    return <p className="text-sm text-zinc-500 dark:text-zinc-400">No deals have reached Negotiation yet.</p>;
  }

  const segments = [
    { key: "won", value: won, color: good, label: "Won" },
    { key: "open", value: stillOpen, color: neutral, label: "Still negotiating" },
    { key: "lost", value: lost, color: critical, label: "Lost" },
  ].filter((s) => s.value > 0);

  return (
    <div>
      <div className="flex h-4 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        {segments.map((s, i) => (
          <div
            key={s.key}
            style={{
              width: `${(s.value / total) * 100}%`,
              backgroundColor: s.color,
              marginLeft: i === 0 ? 0 : 2,
            }}
          />
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-zinc-600 dark:text-zinc-400">
        {segments.map((s) => (
          <span key={s.key} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
            {s.label}: <span className="font-medium text-zinc-900 dark:text-zinc-100">{s.value}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
