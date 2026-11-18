import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, AlertTriangle, Trophy } from "lucide-react";
import { requireOnboarded } from "@/lib/auth";
import { getCategoryScores, getStats } from "@/lib/data";
import { CATEGORIES } from "@/lib/content/categories";
import { fmtPct, fmtScore, toneForPct, toneForScore, toneLabel, toneText } from "@/lib/scoring";
import { ScoreGauge } from "@/components/score-gauge";
import { CountUp } from "@/components/count-up";
import { Delta, RankDelta } from "@/components/delta";
import { CategoryBadge } from "@/components/category-icon";
import { InviteButton } from "@/components/invite-button";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata = { title: "Your Life Score" };

const GOAL_IDEAS = ["Fitness", "Saving money", "Confidence", "Discipline", "Alcohol reduction", "Learning a skill", "Socialising", "Sleep"];

export default async function ResultPage() {
  const { supabase, userId } = await requireOnboarded();
  const [stats, scores, { count: goalCount }] = await Promise.all([
    getStats(supabase, userId),
    getCategoryScores(supabase, userId),
    supabase.from("custom_goals").select("id", { count: "exact", head: true }).eq("user_id", userId),
  ]);
  if (stats?.life_score == null) redirect("/assessment");

  const score = Number(stats.life_score);
  const ranked = CATEGORIES.filter((c) => scores[c.id]).sort((a, b) => Number(scores[b.id].score) - Number(scores[a.id].score));
  const strongest = ranked.slice(0, 3);
  const lowest = ranked.length ? Number(scores[ranked[ranked.length - 1].id].score) : 0;
  const highest = ranked.length ? Number(scores[ranked[0].id].score) : 0;
  const weakest = lowest < highest ? ranked.slice(-3).reverse() : [];
  const isFirst = stats.previous_life_score == null;
  const tone = toneForPct(score);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-10 pb-16">
      <section className="flex flex-col items-center text-center">
        <p className="eyebrow animate-rise">{isFirst ? "Your first Life Score" : "Your updated Life Score"}</p>
        <div className="relative mt-6">
          <ScoreGauge value={score} size={300} stroke={16} hideCenter />
          <div className="absolute inset-0 flex flex-col items-center justify-center" aria-hidden>
            <div className={cn("tabular text-6xl font-semibold tracking-tight", toneText[tone])}>
              <CountUp value={score} />
              <span className="text-2xl text-muted-foreground">%</span>
            </div>
            <div className="eyebrow mt-2">Life Score</div>
          </div>
        </div>
        <p className="mt-4 text-lg font-medium">{toneLabel[tone]}</p>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          This is how satisfied you are with your life right now, by your own standards. It&apos;s a starting point, not a verdict.
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-sm">
          {!isFirst && (
            <span className="inline-flex items-center gap-2 text-muted-foreground">
              Previously {fmtPct(stats.previous_life_score)}% <Delta value={score - Number(stats.previous_life_score)} />
            </span>
          )}
          {stats.current_rank && (
            <span className="inline-flex items-center gap-2 text-muted-foreground">
              <Trophy className="size-4" aria-hidden /> #{stats.current_rank} on the leaderboard
              <RankDelta current={stats.current_rank} previous={stats.previous_rank} />
            </span>
          )}
        </div>
      </section>

      {!stats.is_complete && (
        <div className="mt-8 flex gap-3 rounded-xl border border-score-mid/30 bg-score-mid/10 p-4 text-sm">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-score-mid" aria-hidden />
          <div>
            <p className="font-medium">Incomplete: based on {stats.categories_scored} of 15 categories</p>
            <p className="mt-1 text-muted-foreground">
              Unscored categories aren&apos;t counted as zero; they&apos;re simply left out. Finish them to join the leaderboard.
            </p>
            <Link href="/assessment" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-3")}>
              Finish assessment
            </Link>
          </div>
        </div>
      )}

      <section className="mt-10 grid gap-4 sm:grid-cols-2">
        {[
          { title: "Most satisfied", items: strongest },
          { title: "Most room to grow", items: weakest },
        ].filter((g) => g.items.length).map((group) => (
          <div key={group.title} className="surface p-5">
            <h2 className="eyebrow">{group.title}</h2>
            <ul className="mt-3 space-y-3">
              {group.items.map((c) => (
                <li key={c.id}>
                  <Link href={`/categories/${c.id}`} className="flex items-center gap-3 rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
                    <CategoryBadge id={c.id} className="size-8" />
                    <span className="flex-1 truncate text-sm">{c.name}</span>
                    <span className={cn("tabular text-sm font-semibold", toneText[toneForScore(Number(scores[c.id].score))])}>
                      {fmtScore(scores[c.id].score)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section className="surface mt-6 p-6 sm:p-8">
        <h2 className="text-xl font-semibold tracking-tight">Is there anything else in your life you&apos;d like to track or work towards?</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Personal goals use the same 1–10 satisfaction scale and are tracked separately. They reward effort and consistency, not
          just outcomes. They don&apos;t change your Life Score unless you choose to link them to a category.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          {GOAL_IDEAS.map((g) => (
            <Link
              key={g}
              href={`/goals/new?name=${encodeURIComponent(g)}`}
              className="rounded-full border border-border px-3 py-1.5 text-sm text-foreground/85 transition-colors hover:border-primary/50 hover:text-foreground"
            >
              {g}
            </Link>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link href="/goals/new" className={buttonVariants()}>
            Create a goal
          </Link>
          <Link href="/dashboard" className={buttonVariants({ variant: "ghost" })}>
            {goalCount ? "Go to dashboard" : "Not now"} <ArrowRight />
          </Link>
        </div>
      </section>

      <section className="mt-6 flex flex-col items-start gap-3 rounded-2xl border border-border p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-medium">Better with friends</h2>
          <p className="text-sm text-muted-foreground">Invite friends to take the assessment and join the leaderboard.</p>
        </div>
        <div className="flex gap-2">
          <InviteButton />
          <Link href="/leaderboard" className={buttonVariants({ variant: "ghost" })}>
            Leaderboard
          </Link>
        </div>
      </section>
    </div>
  );
}
