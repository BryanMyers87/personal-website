"use client";

import { Bar, BarChart, CartesianGrid, LabelList, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useChartTheme, SEQUENTIAL_HUE, STATUS } from "./theme";

export type AccountRevenueDatum = { name: string; amount: number };

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

export default function ThisMonthRevenueChart({
  data,
  projected,
}: {
  data: AccountRevenueDatum[];
  projected: number;
}) {
  const theme = useChartTheme();
  const color = theme.isDark ? SEQUENTIAL_HUE.dark : SEQUENTIAL_HUE.light;
  const refColor = theme.isDark ? STATUS.critical.dark : STATUS.critical.light;

  return (
    <ResponsiveContainer width="100%" height={Math.max(180, data.length * 36)}>
      <BarChart data={data} layout="vertical" margin={{ top: 8, right: 48, left: 8, bottom: 0 }} barCategoryGap="25%">
        <CartesianGrid horizontal={false} stroke={theme.grid} />
        <XAxis
          type="number"
          tickFormatter={(v) => formatCurrency(Number(v))}
          tick={{ fill: theme.axis, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={140}
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
          formatter={(value) => [formatCurrency(Number(value)), "This month"]}
        />
        {projected > 0 && (
          <ReferenceLine
            x={projected}
            stroke={refColor}
            strokeDasharray="4 4"
            label={{ value: "Avg projected", position: "insideTopRight", fill: refColor, fontSize: 11 }}
          />
        )}
        <Bar dataKey="amount" fill={color} radius={[0, 4, 4, 0]} maxBarSize={22}>
          <LabelList
            dataKey="amount"
            position="right"
            formatter={(value) => formatCurrency(Number(value))}
            style={{ fill: theme.tooltipText, fontSize: 11, fontWeight: 600 }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
