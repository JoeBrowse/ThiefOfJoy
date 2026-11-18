"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";
import { DEFAULT_HIGH, DEFAULT_LOW, DEFAULT_MID } from "@/lib/content/categories";
import { toneBg, toneForScore } from "@/lib/scoring";

type Props = {
  value: number | null | undefined;
  onChange: (value: number) => void;
  low?: string;
  high?: string;
  label: string;
  min?: number;
  max?: number;
  size?: "default" | "sm";
};

/** Accessible 1-10 score selector (radio group with roving focus and arrow keys). */
export function ScorePicker({ value, onChange, low = DEFAULT_LOW, high = DEFAULT_HIGH, label, min = 1, max = 10, size = "default" }: Props) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const values = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  function onKeyDown(e: React.KeyboardEvent, current: number) {
    let next: number | null = null;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") next = Math.min(max, current + 1);
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") next = Math.max(min, current - 1);
    if (e.key === "Home") next = min;
    if (e.key === "End") next = max;
    if (next !== null) {
      e.preventDefault();
      onChange(next);
      refs.current[next - min]?.focus();
    }
  }

  const focusable = value ?? min;

  return (
    <div>
      <div role="radiogroup" aria-label={label} className="grid grid-cols-10 gap-1 sm:gap-1.5">
        {values.map((n) => {
          const selected = value === n;
          return (
            <button
              key={n}
              ref={(el) => {
                refs.current[n - min] = el;
              }}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={`${n} out of ${max}`}
              tabIndex={n === focusable ? 0 : -1}
              onClick={() => onChange(n)}
              onKeyDown={(e) => onKeyDown(e, n)}
              className={cn(
                "tabular relative rounded-lg border text-sm font-medium outline-none transition-all duration-150 focus-visible:ring-3 focus-visible:ring-ring/50",
                size === "sm" ? "h-9" : "h-11 sm:h-12 sm:text-base",
                selected
                  ? cn("border-transparent text-background shadow-lg", toneBg[toneForScore(n)])
                  : "border-border bg-foreground/[0.03] text-foreground/80 hover:border-foreground/20 hover:bg-foreground/[0.07]",
                value != null && !selected && n < value && "bg-foreground/[0.06]",
              )}
            >
              {n}
            </button>
          );
        })}
      </div>
      <div className="mt-2 grid grid-cols-3 text-[11px] text-muted-foreground">
        <span>1 · {low}</span>
        <span className="text-center">5 · {DEFAULT_MID}</span>
        <span className="text-right">10 · {high}</span>
      </div>
    </div>
  );
}
