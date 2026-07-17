"use client";

import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useChartTheme, SEQUENTIAL_HUE } from "./theme";

export type CycleTimeDatum = { label: string; avgHours: number | null; count: number };

function formatDuration(hours: number | null | undefined): string {
  if (hours == null) return "No data";
  if (hours < 48) return `${hours.toFixed(1)}h`;
  return `${(hours / 24).toFixed(1)}d`;
}

export default function CycleTimeChart({ data }: { data: CycleTimeDatum[] }) {
  const theme = useChartTheme();
  const color = theme.isDark ? SEQUENTIAL_HUE.dark : SEQUENTIAL_HUE.light;

  const chartData = data.map((d) => ({ ...d, displayHours: d.avgHours ?? 0 }));
  const hasAnyData = chartData.some((d) => d.avgHours != null);

  return (
    <ResponsiveContainer width="100%" height={Math.max(180, chartData.length * 56)}>
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 8, right: 48, left: 8, bottom: 0 }}
        barCategoryGap="30%"
      >
        <CartesianGrid horizontal={false} stroke={theme.grid} />
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="label"
          width={170}
          tick={{ fill: theme.axis, fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        {hasAnyData && (
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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={((_value: unknown, _name: unknown, ctx: any) => {
              const datum = ctx.payload as CycleTimeDatum & { displayHours: number };
              return [formatDuration(datum.avgHours), `avg over ${datum.count} deal${datum.count === 1 ? "" : "s"}`];
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
            }) as any}
          />
        )}
        <Bar dataKey="displayHours" fill={color} radius={[0, 4, 4, 0]} maxBarSize={22}>
          <LabelList
            dataKey="avgHours"
            position="right"
            formatter={(value) => formatDuration(value as number | null | undefined)}
            style={{ fill: theme.tooltipText, fontSize: 12, fontWeight: 600 }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
