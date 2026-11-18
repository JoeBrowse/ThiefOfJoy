import { ArrowDownRight, ArrowUpRight, Minus, ChevronUp, ChevronDown, Sparkle } from "lucide-react";
import { cn } from "@/lib/utils";

/** Score change indicator, e.g. +2.3 / -1.0. */
export function Delta({
  value,
  decimals = 1,
  suffix = "",
  className,
  hideZero = false,
}: {
  value: number | null | undefined;
  decimals?: number;
  suffix?: string;
  className?: string;
  hideZero?: boolean;
}) {
  if (value === null || value === undefined || Number.isNaN(value)) return null;
  const v = Math.round(value * 10 ** decimals) / 10 ** decimals;
  if (v === 0) {
    if (hideZero) return null;
    return (
      <span className={cn("inline-flex items-center gap-0.5 text-xs text-muted-foreground tabular", className)}>
        <Minus className="size-3" aria-hidden /> <span className="sr-only">No change</span>0{suffix}
      </span>
    );
  }
  const up = v > 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-xs font-medium tabular", up ? "text-up" : "text-down", className)}>
      <Icon className="size-3.5" aria-hidden />
      <span className="sr-only">{up ? "Up" : "Down"}</span>
      {up ? "+" : ""}
      {v.toFixed(decimals)}
      {suffix}
    </span>
  );
}

/**
 * Leaderboard movement, based on actual rank changes (not score changes).
 * previous_rank is the rank before the user's most recent movement.
 */
export function RankDelta({
  current,
  previous,
  className,
}: {
  current: number | null | undefined;
  previous: number | null | undefined;
  className?: string;
}) {
  if (!current) return null;
  if (!previous) {
    return (
      <span className={cn("inline-flex items-center gap-1 rounded-full bg-primary/12 px-2 py-0.5 text-[11px] font-medium text-primary", className)}>
        <Sparkle className="size-3" aria-hidden /> New
      </span>
    );
  }
  const moved = previous - current;
  if (moved === 0) {
    return <span className={cn("text-xs text-muted-foreground", className)}>—</span>;
  }
  const up = moved > 0;
  const n = Math.abs(moved);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular",
        up ? "bg-up/12 text-up" : "bg-down/12 text-down",
        className,
      )}
      title={`Moved from #${previous} to #${current}`}
    >
      {up ? <ChevronUp className="size-3.5" aria-hidden /> : <ChevronDown className="size-3.5" aria-hidden />}
      {n} {n === 1 ? "place" : "places"}
      <span className="sr-only">{up ? "up" : "down"}</span>
    </span>
  );
}
