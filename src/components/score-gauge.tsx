import { cn } from "@/lib/utils";
import { fmtPct, toneForPct, toneVar } from "@/lib/scoring";

type Props = {
  value: number | null | undefined; // 0-100
  size?: number;
  stroke?: number;
  label?: string;
  sublabel?: string;
  className?: string;
  animate?: boolean;
  /** hide the built-in centre label (when overlaying custom content) */
  hideCenter?: boolean;
};

/** 270° arc gauge, the focal point of the dashboard. Pure SVG, server-renderable. */
export function ScoreGauge({ value, size = 260, stroke = 14, label = "Life Score", sublabel, className, animate = true, hideCenter = false }: Props) {
  const v = value === null || value === undefined ? null : Math.max(0, Math.min(100, Number(value)));
  const r = (size - stroke) / 2;
  const c = size / 2;
  const circ = 2 * Math.PI * r;
  const arc = circ * 0.75;
  const offset = v === null ? arc : arc * (1 - v / 100);
  const color = toneVar[toneForPct(v)];
  const gid = `g-${size}-${Math.round((v ?? 0) * 10)}`;

  return (
    <div className={cn("relative inline-grid place-items-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-[225deg]" aria-hidden="true">
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.55} />
            <stop offset="100%" stopColor={color} />
          </linearGradient>
        </defs>
        <circle
          cx={c}
          cy={c}
          r={r}
          fill="none"
          stroke="currentColor"
          className="text-foreground/[0.07]"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${arc} ${circ}`}
        />
        {v !== null && (
          <circle
            cx={c}
            cy={c}
            r={r}
            fill="none"
            stroke={`url(#${gid})`}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${arc} ${circ}`}
            strokeDashoffset={offset}
            className={animate ? "animate-gauge" : undefined}
            style={{ ["--gauge-length" as string]: `${arc}` }}
          />
        )}
      </svg>
      <div className={cn("absolute inset-0 flex flex-col items-center justify-center text-center", hideCenter && "sr-only")} role="img" aria-label={`${label}: ${v === null ? "not yet scored" : `${fmtPct(v)} percent`}`}>
        <div className="tabular font-semibold tracking-tight" style={{ fontSize: size * 0.2 }}>
          {v === null ? "—" : fmtPct(v)}
          {v !== null && <span className="text-muted-foreground" style={{ fontSize: size * 0.09 }}>%</span>}
        </div>
        <div className="eyebrow mt-1">{label}</div>
        {sublabel && <div className="mt-1.5 max-w-[70%] text-xs text-muted-foreground">{sublabel}</div>}
      </div>
    </div>
  );
}
