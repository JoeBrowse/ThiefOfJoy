/** Progress from starting score towards target, 0–100 (can exceed 100 if surpassed). */
export function goalProgress(g: { start_score: number; current_score: number; target_score: number }) {
  if (g.current_score >= g.target_score) return 100;
  const span = g.target_score - g.start_score;
  if (span <= 0) return g.current_score >= g.target_score ? 100 : 0;
  return Math.max(0, Math.round(((g.current_score - g.start_score) / span) * 100));
}

export const GOAL_EXAMPLES = [
  "Addiction recovery",
  "Weight loss",
  "Weight gain",
  "Fitness",
  "Running",
  "Smoking cessation",
  "Alcohol reduction",
  "Confidence",
  "Discipline",
  "Productivity",
  "Socialising",
  "Saving money",
  "Building a business",
  "Improving a relationship",
  "Learning a skill",
];
