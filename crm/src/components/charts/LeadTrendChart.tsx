"use client";

import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useChartTheme, CATEGORICAL } from "./theme";
import type { MonthlyLeadDatum } from "@/lib/leadStats";

export default function LeadTrendChart({ data }: { data: MonthlyLeadDatum[] }) {
  const theme = useChartTheme();
  const palette = theme.isDark ? CATEGORICAL.dark : CATEGORICAL.light;

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke={theme.grid} />
        <XAxis dataKey="month" tick={{ fill: theme.axis, fontSize: 11 }} axisLine={{ stroke: theme.grid }} tickLine={false} />
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
        <Legend wrapperStyle={{ fontSize: 12, color: theme.axis }} />
        <Line type="monotone" dataKey="leads" name="Leads" stroke={palette[0]} strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="appsBooked" name="Apps booked" stroke={palette[1]} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
