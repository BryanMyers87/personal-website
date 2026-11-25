"use client";

import { useMemo, useState } from "react";
import { clsx } from "clsx";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useChartTheme, CATEGORICAL } from "./theme";
import type { ContractorLeadSeries } from "@/lib/leadStats";

export default function ContractorsLineChart({
  periods,
  contractors,
  allLabel = "All",
}: {
  periods: string[];
  contractors: ContractorLeadSeries[];
  allLabel?: string;
}) {
  const theme = useChartTheme();
  const palette = theme.isDark ? CATEGORICAL.dark : CATEGORICAL.light;
  const [showAll, setShowAll] = useState(false);

  const visible = showAll ? contractors : contractors.slice(0, 20);

  const data = useMemo(
    () =>
      periods.map((period, i) => {
        const row: Record<string, string | number> = { period };
        for (const c of visible) row[c.name] = c.leadsByPeriod[i];
        return row;
      }),
    [periods, visible],
  );

  return (
    <div>
      <div className="mb-3 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => setShowAll(false)}
          className={clsx(
            "rounded-lg px-2.5 py-1.5 text-xs font-medium",
            !showAll
              ? "bg-indigo-600 text-white"
              : "border border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800",
          )}
        >
          Top 20
        </button>
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className={clsx(
            "rounded-lg px-2.5 py-1.5 text-xs font-medium",
            showAll
              ? "bg-indigo-600 text-white"
              : "border border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800",
          )}
        >
          {allLabel} ({contractors.length})
        </button>
      </div>
      <ResponsiveContainer width="100%" height={640}>
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke={theme.grid} />
          <XAxis dataKey="period" tick={{ fill: theme.axis, fontSize: 11 }} axisLine={{ stroke: theme.grid }} tickLine={false} />
          <YAxis allowDecimals={false} tick={{ fill: theme.axis, fontSize: 11 }} axisLine={false} tickLine={false} width={32} />
          <Tooltip
            contentStyle={{
              background: theme.tooltipBg,
              border: `1px solid ${theme.tooltipBorder}`,
              borderRadius: 8,
              fontSize: 12,
              color: theme.tooltipText,
            }}
            labelStyle={{ color: theme.tooltipText, fontWeight: 600 }}
          />
          <Legend wrapperStyle={{ fontSize: 11, color: theme.axis }} />
          {visible.map((c, i) => (
            <Line
              key={c.id}
              type="monotone"
              dataKey={c.name}
              stroke={palette[i % palette.length]}
              strokeWidth={1.5}
              dot={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
