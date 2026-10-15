"use client";

import { Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useChartTheme, SEQUENTIAL_HUE, STATUS } from "./theme";

export type RevenueMonthDatum = { month: string; amount: number };

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

export default function RevenueTrendChart({ data, projected }: { data: RevenueMonthDatum[]; projected: number }) {
  const theme = useChartTheme();
  const color = theme.isDark ? SEQUENTIAL_HUE.dark : SEQUENTIAL_HUE.light;
  const refColor = theme.isDark ? STATUS.critical.dark : STATUS.critical.light;
  const hasData = data.some((d) => d.amount > 0);

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap="20%">
        <CartesianGrid vertical={false} stroke={theme.grid} />
        <XAxis dataKey="month" tick={{ fill: theme.axis, fontSize: 11 }} axisLine={{ stroke: theme.grid }} tickLine={false} />
        <YAxis
          tickFormatter={(v) => formatCurrency(Number(v))}
          tick={{ fill: theme.axis, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={64}
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
          formatter={(value) => [formatCurrency(Number(value)), "Actual"]}
        />
        {projected > 0 && (
          <ReferenceLine
            y={projected}
            stroke={refColor}
            strokeDasharray="4 4"
            label={{ value: "Projected", position: "insideTopRight", fill: refColor, fontSize: 11 }}
          />
        )}
        <Bar dataKey="amount" fill={color} radius={[4, 4, 0, 0]} maxBarSize={28} isAnimationActive={hasData} />
      </BarChart>
    </ResponsiveContainer>
  );
}
