import { cn } from "@/lib/utils";
import { toneBg, toneForScore } from "@/lib/scoring";

/** Thin progress bar for a 1-10 score. */
export function ScoreBar({ score, className, target }: { score: number | null | undefined; className?: string; target?: number | null }) {
  const pct = score ? Math.max(0, Math.min(100, Number(score) * 10)) : 0;
  return (
    <div className={cn("relative h-1.5 w-full overflow-hidden rounded-full bg-foreground/[0.07]", className)}>
      <div className={cn("h-full rounded-full transition-[width] duration-700", toneBg[toneForScore(score)])} style={{ width: `${pct}%` }} />
      {target ? (
        <div className="absolute top-0 h-full w-0.5 bg-foreground/60" style={{ left: `calc(${target * 10}% - 1px)` }} aria-hidden />
      ) : null}
    </div>
  );
}
