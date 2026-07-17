"use client";

import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useChartTheme, CATEGORICAL } from "./theme";

export type SourceDatum = { source: string; count: number };

export default function SourceBarChart({ data }: { data: SourceDatum[] }) {
  const theme = useChartTheme();
  const palette = theme.isDark ? CATEGORICAL.dark : CATEGORICAL.light;

  // Assign color by the source's identity (alphabetical), not by its rank in
  // this render, so a given source keeps its color as counts change.
  const allSourcesAlphabetical = [...data].map((d) => d.source).sort((a, b) => a.localeCompare(b));
  const colorOf = (source: string) => palette[allSourcesAlphabetical.indexOf(source) % palette.length];

  const sorted = [...data].sort((a, b) => b.count - a.count);

  return (
    <ResponsiveContainer width="100%" height={Math.max(180, sorted.length * 40)}>
      <BarChart data={sorted} layout="vertical" margin={{ top: 8, right: 32, left: 8, bottom: 0 }} barCategoryGap="25%">
        <CartesianGrid horizontal={false} stroke={theme.grid} />
        <XAxis type="number" hide allowDecimals={false} />
        <YAxis
          type="category"
          dataKey="source"
          width={130}
          tick={{ fill: theme.axis, fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: theme.isDark ? "rgba(255,255,255,0.04)" : "rgba(11,11,11,0.03)" }}
          contentStyle={{
            background: theme.tooltipBg,
            border: `1px solid ${theme.tooltipBorder}`,
            borderRadius: 8,
            fontSize: 12,
            color: theme.tooltipText,
          }}
          labelStyle={{ color: theme.tooltipText, fontWeight: 600 }}
          formatter={(value) => [`${value} deal${value === 1 ? "" : "s"}`, "Deals"]}
        />
        <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={22}>
          {sorted.map((entry) => (
            <Cell key={entry.source} fill={colorOf(entry.source)} />
          ))}
          <LabelList dataKey="count" position="right" style={{ fill: theme.tooltipText, fontSize: 12, fontWeight: 600 }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
