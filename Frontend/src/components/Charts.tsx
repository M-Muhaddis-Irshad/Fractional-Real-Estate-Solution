"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

export interface ChartPoint {
  [key: string]: string | number;
}

const tooltipStyle: React.CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--border-strong)",
  borderRadius: 10,
  boxShadow: "var(--shadow-md)",
  fontSize: 12.5,
  color: "var(--ink)",
};

const axisStyle = { fill: "var(--muted)", fontSize: 11.5 };

function fmtAxis(v: string | number): string {
  const n = Number(v);
  const abs = Math.abs(n);
  if (abs >= 1e6) return `Rs ${(n / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `Rs ${(n / 1e3).toFixed(0)}K`;
  return `Rs ${n}`;
}

interface TrendProps {
  data: ChartPoint[];
  dataKey?: string;
  color?: string;
  height?: number;
  xKey?: string;
}

export function AreaTrend({ data, dataKey = "invested", color = "#6366f1", height = 260, xKey = "month" }: TrendProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
        <defs>
          <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.28} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey={xKey} tickLine={false} axisLine={false} tick={axisStyle} />
        <YAxis tickLine={false} axisLine={false} tick={axisStyle} tickFormatter={fmtAxis} width={52} />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(v) => [`Rs ${Number(v).toLocaleString()}`, "Value"]}
        />
        <Area
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          strokeWidth={2.4}
          fill={`url(#grad-${dataKey})`}
          dot={false}
          activeDot={{ r: 4 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function BarTrend({
  data,
  dataKey = "invested",
  color = "#6366f1",
  height = 260,
  xKey = "month",
  radius = [6, 6, 0, 0],
}: TrendProps & { radius?: [number, number, number, number] }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey={xKey} tickLine={false} axisLine={false} tick={axisStyle} />
        <YAxis tickLine={false} axisLine={false} tick={axisStyle} tickFormatter={fmtAxis} width={52} />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(v) => [`Rs ${Number(v).toLocaleString()}`, ""]}
          cursor={{ fill: "rgba(99, 102, 241, 0.1)" }}
        />
        <Bar dataKey={dataKey} fill={color} radius={radius} maxBarSize={34} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export interface DonutDatum {
  name: string;
  value: number;
}

export function Donut({
  data,
  height = 240,
  colors = ["#6366f1", "#0ea5e9", "#f59e0b", "#10b981", "#ef4444"],
}: {
  data: DonutDatum[];
  height?: number;
  colors?: string[];
}) {
  const total = data.reduce((s, d) => s + (d.value || 0), 0);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius="58%"
          outerRadius="82%"
          paddingAngle={3}
          stroke="none"
        >
          {data.map((_, i) => (
            <Cell key={i} fill={colors[i % colors.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(v, name) => [`${total ? Math.round((Number(v) / total) * 100) : 0}%`, name]}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 12, color: "var(--muted)" }}
          formatter={(value) => <span style={{ color: "var(--ink-2)" }}>{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
