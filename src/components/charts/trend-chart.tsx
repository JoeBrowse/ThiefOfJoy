"use client";

import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export type TrendPoint = { t: string; value: number; label?: string };

type Props = {
  data: TrendPoint[];
  /** "pct" for 0-100 Life Score, "score" for 1-10 */
  scale: "pct" | "score";
  height?: number;
  target?: number | null;
  color?: string;
};

const fmtDay = (t: string) => new Date(t).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

export function TrendChart({ data, scale, height = 220, target, color = "var(--primary)" }: Props) {
  if (data.length === 0) return null;
  // A single point still renders as a flat line so the chart never looks broken.
  const series = data.length === 1 ? [data[0], { ...data[0], t: new Date().toISOString() }] : data;
  const values = series.map((d) => d.value).concat(target ? [target] : []);
  const pad = scale === "pct" ? 5 : 0.5;
  const min = Math.max(scale === "pct" ? 0 : 1, Math.floor(Math.min(...values) - pad));
  const max = Math.min(scale === "pct" ? 100 : 10, Math.ceil(Math.max(...values) + pad));
  const id = `fill-${scale}-${Math.abs(hash(color))}`;

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={series} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.28} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey="t"
            tickFormatter={fmtDay}
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            minTickGap={32}
          />
          <YAxis
            domain={[min, max]}
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={44}
            allowDecimals={scale === "score"}
          />
          {target ? <ReferenceLine y={target} stroke="var(--foreground)" strokeOpacity={0.35} strokeDasharray="4 4" label={{ value: "Target", fill: "var(--muted-foreground)", fontSize: 11, position: "insideTopRight" }} /> : null}
          <Tooltip
            cursor={{ stroke: "var(--border)" }}
            contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 12 }}
            labelStyle={{ color: "var(--muted-foreground)" }}
            itemStyle={{ color: "var(--foreground)" }}
            labelFormatter={(t) => new Date(String(t)).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
            formatter={(v) => [scale === "pct" ? `${Number(v).toFixed(1)}%` : `${Number(v).toFixed(1)} / 10`, scale === "pct" ? "Life Score" : "Score"]}
          />
          <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fill={`url(#${id})`} dot={series.length < 12 ? { r: 3, fill: color, strokeWidth: 0 } : false} activeDot={{ r: 4 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}
