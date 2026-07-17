"use client";

import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useChartTheme, STAGE_RAMP } from "./theme";
import { STAGE_SHORT_LABELS } from "@/lib/stages";
import type { DealStage } from "@/generated/prisma/enums";

export type FunnelDatum = { stage: DealStage; label: string; count: number };

export default function FunnelChart({ data }: { data: FunnelDatum[] }) {
  const theme = useChartTheme();
  const ramp = theme.isDark ? STAGE_RAMP.dark : STAGE_RAMP.light;

  const chartData = data.map((d) => ({ ...d, name: STAGE_SHORT_LABELS[d.stage] }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={chartData} margin={{ top: 16, right: 8, left: 0, bottom: 0 }} barCategoryGap="20%">
        <CartesianGrid vertical={false} stroke={theme.grid} strokeDasharray="0" />
        <XAxis dataKey="name" tick={{ fill: theme.axis, fontSize: 12 }} axisLine={{ stroke: theme.grid }} tickLine={false} />
        <YAxis allowDecimals={false} tick={{ fill: theme.axis, fontSize: 12 }} axisLine={false} tickLine={false} width={32} />
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
          formatter={(value) => [`${value} deal${value === 1 ? "" : "s"}`, "Reached this stage"]}
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={24}>
          {chartData.map((entry, i) => (
            <Cell key={entry.stage} fill={ramp[i]} />
          ))}
          <LabelList dataKey="count" position="top" style={{ fill: theme.tooltipText, fontSize: 12, fontWeight: 600 }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
