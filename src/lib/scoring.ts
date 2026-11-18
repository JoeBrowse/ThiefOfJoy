/**
 * Client-side mirror of the scoring rules (the database is authoritative,
 * see supabase/migrations/*_functions.sql). Used for live previews.
 */

/** Average of answered questions (skips ignored). Null if nothing answered. */
export function categoryAverage(scores: (number | null | undefined)[]): number | null {
  const answered = scores.filter((s): s is number => typeof s === "number");
  if (!answered.length) return null;
  return answered.reduce((a, b) => a + b, 0) / answered.length;
}

/** Life Score % = average of category scores (equal weight) / 10 * 100, 1 dp. */
export function lifeScore(categoryScores: (number | null | undefined)[]): number | null {
  const avg = categoryAverage(categoryScores);
  return avg === null ? null : Math.round(avg * 10 * 10) / 10;
}

export function fmtPct(n: number | string | null | undefined, withSign = false): string {
  if (n === null || n === undefined || n === "") return "—";
  const v = Number(n);
  const s = v.toFixed(1);
  return withSign && v > 0 ? `+${s}` : s;
}

export function fmtScore(n: number | string | null | undefined, withSign = false): string {
  if (n === null || n === undefined || n === "") return "—";
  const v = Number(n);
  const s = (Math.round(v * 10) / 10).toFixed(1);
  return withSign && v > 0 ? `+${s}` : s;
}

export type Tone = "low" | "mid" | "good" | "great";

/** Tone for a 0-100 percentage. */
export function toneForPct(pct: number | null | undefined): Tone {
  const v = Number(pct ?? 0);
  if (v >= 80) return "great";
  if (v >= 65) return "good";
  if (v >= 45) return "mid";
  return "low";
}

/** Tone for a 1-10 score. */
export function toneForScore(score: number | null | undefined): Tone {
  return toneForPct(Number(score ?? 0) * 10);
}

export const toneText: Record<Tone, string> = {
  low: "text-score-low",
  mid: "text-score-mid",
  good: "text-score-good",
  great: "text-score-great",
};

export const toneBg: Record<Tone, string> = {
  low: "bg-score-low",
  mid: "bg-score-mid",
  good: "bg-score-good",
  great: "bg-score-great",
};

export const toneVar: Record<Tone, string> = {
  low: "var(--score-low)",
  mid: "var(--score-mid)",
  good: "var(--score-good)",
  great: "var(--score-great)",
};

export const toneLabel: Record<Tone, string> = {
  low: "Room to grow",
  mid: "Mixed",
  good: "Satisfied",
  great: "Thriving",
};

export function scoreAnchor(score: number): string {
  if (score <= 2) return "Very dissatisfied";
  if (score <= 4) return "Somewhat dissatisfied";
  if (score <= 6) return "Mixed / average";
  if (score <= 8) return "Mostly satisfied";
  return "Genuinely satisfied";
}
