"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useChartTheme, SEQUENTIAL_HUE } from "./theme";

export type TrendDatum = { week: string; count: number };

export default function TrendChart({ data, unitLabel }: { data: TrendDatum[]; unitLabel: string }) {
  const theme = useChartTheme();
  const color = theme.isDark ? SEQUENTIAL_HUE.dark : SEQUENTIAL_HUE.light;
  const hasData = data.some((d) => d.count > 0);

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap="15%">
        <CartesianGrid vertical={false} stroke={theme.grid} />
        <XAxis
          dataKey="week"
          tick={{ fill: theme.axis, fontSize: 11 }}
          axisLine={{ stroke: theme.grid }}
          tickLine={false}
          interval={1}
        />
        <YAxis allowDecimals={false} tick={{ fill: theme.axis, fontSize: 12 }} axisLine={false} tickLine={false} width={28} />
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
          formatter={(value) => [`${value} ${unitLabel}`, ""]}
        />
        <Bar dataKey="count" fill={color} radius={[4, 4, 0, 0]} maxBarSize={20} isAnimationActive={hasData} />
      </BarChart>
    </ResponsiveContainer>
  );
}
