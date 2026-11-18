import Link from "next/link";
import { AlertTriangle, ArrowRight, ArrowUpDown, ClipboardList, History, Plus, RefreshCcw, Target, Trophy } from "lucide-react";
import { requireOnboarded } from "@/lib/auth";
import { getCategoryScores, getLifeScoreHistory, getRecentChanges, getStats } from "@/lib/data";
import { CATEGORIES, getCategory } from "@/lib/content/categories";
import { MANTRAS } from "@/lib/copy";
import { fmtPct, fmtScore, toneForPct, toneForScore, toneLabel, toneText } from "@/lib/scoring";
import { fmtDate, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Container } from "@/components/page-header";
import { ScoreGauge } from "@/components/score-gauge";
import { Delta, RankDelta } from "@/components/delta";
import { ScoreBar } from "@/components/score-bar";
import { CategoryBadge } from "@/components/category-icon";
import { TrendChart } from "@/components/charts/trend-chart";
import { InviteButton } from "@/components/invite-button";
import { buttonVariants } from "@/components/ui/button";

export const metadata = { title: "Dashboard" };

type Sort = "default" | "high" | "low";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ sort?: string }> }) {
  const { supabase, userId, profile } = await requireOnboarded();
  const sort: Sort = ((await searchParams).sort as Sort) ?? "default";

  const [stats, scores, history, changes, goalsRes, inProgress] = await Promise.all([
    getStats(supabase, userId),
    getCategoryScores(supabase, userId),
    getLifeScoreHistory(supabase, userId),
    getRecentChanges(supabase, userId, 8),
    supabase.from("custom_goals").select("*").eq("user_id", userId).eq("status", "active").order("updated_at", { ascending: false }).limit(4),
    supabase.from("assessment_sessions").select("id").eq("user_id", userId).eq("kind", "full").eq("status", "in_progress").limit(1),
  ]);
  const goals = goalsRes.data ?? [];
  const hasDraft = (inProgress.data?.length ?? 0) > 0;

  if (stats?.life_score == null) {
    return (
      <Container>
        <div className="mx-auto flex max-w-xl flex-col items-center py-10 text-center">
          <ScoreGauge value={null} size={240} sublabel="Not scored yet" />
          <h1 className="mt-6 text-2xl font-semibold tracking-tight">
            {hasDraft ? "Pick up where you left off" : `Welcome${profile.display_name ? `, ${profile.display_name}` : ""}. Let's find your Life Score.`}
          </h1>
          <p className="mt-2 text-muted-foreground">
            Score how satisfied you are across 15 areas of life. Your answers save as you go. {MANTRAS[1]}
          </p>
          <Link href="/assessment" className={cn(buttonVariants({ size: "lg" }), "mt-6")}>
            <ClipboardList /> {hasDraft ? "Continue assessment" : "Start assessment"}
          </Link>
        </div>
      </Container>
    );
  }

  const score = Number(stats.life_score);
  const prev = stats.previous_life_score == null ? null : Number(stats.previous_life_score);
  const tone = toneForPct(score);
  const scored = CATEGORIES.filter((c) => scores[c.id]);
  const byScore = [...scored].sort((a, b) => Number(scores[b.id].score) - Number(scores[a.id].score));
  const strongest = byScore[0];
  // only call out a "weakest" area when there is an actual spread in scores
  const weakest =
    byScore.length > 1 && Number(scores[byScore[byScore.length - 1].id].score) < Number(scores[byScore[0].id].score)
      ? byScore[byScore.length - 1]
      : undefined;

  const ordered =
    sort === "default"
      ? CATEGORIES
      : [...CATEGORIES].sort((a, b) => {
          const av = scores[a.id] ? Number(scores[a.id].score) : sort === "high" ? -1 : 11;
          const bv = scores[b.id] ? Number(scores[b.id].score) : sort === "high" ? -1 : 11;
          return sort === "high" ? bv - av : av - bv;
        });

  return (
    <Container className="space-y-6">
      {/* Hero score */}
      <section className="surface relative overflow-hidden p-6 sm:p-8">
        <div className="grid items-center gap-8 md:grid-cols-[auto_1fr]">
          <div className="flex justify-center">
            <ScoreGauge value={score} size={260} sublabel="Your current life satisfaction" />
          </div>
          <div className="space-y-6">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", toneText[tone], "bg-foreground/[0.05]")}>{toneLabel[tone]}</span>
                {!stats.is_complete && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-score-mid/12 px-2.5 py-0.5 text-xs font-medium text-score-mid">
                    <AlertTriangle className="size-3" aria-hidden /> Incomplete · {stats.categories_scored}/15
                  </span>
                )}
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{MANTRAS[0]}</p>
            </div>

            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Stat label="Previous">
                <span className="tabular">{prev === null ? "—" : `${fmtPct(prev)}%`}</span>
              </Stat>
              <Stat label="Change">{prev === null ? <span className="text-muted-foreground">First score</span> : <Delta value={score - prev} suffix=" pts" className="text-base" />}</Stat>
              <Stat label="Leaderboard">
                {stats.current_rank ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="tabular">#{stats.current_rank}</span>
                    <RankDelta current={stats.current_rank} previous={stats.previous_rank} />
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground">{profile.show_on_leaderboard ? "Not ranked" : "Hidden"}</span>
                )}
              </Stat>
              <Stat label="Last updated">
                <span className="text-sm" title={fmtDate(stats.score_updated_at)}>
                  {timeAgo(stats.score_updated_at)}
                </span>
              </Stat>
            </dl>

            <div className="flex flex-wrap gap-2">
              <Link href={stats.is_complete ? "/categories" : "/assessment"} className={buttonVariants()}>
                {stats.is_complete ? (
                  <>
                    <RefreshCcw /> Update a category
                  </>
                ) : (
                  <>
                    <ClipboardList /> Finish assessment
                  </>
                )}
              </Link>
              <Link href="/assessment" className={buttonVariants({ variant: "outline" })}>
                {hasDraft ? "Continue retake" : "Retake full assessment"}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Strongest / weakest + chart */}
      <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
        <section className="grid gap-4">
          {[
            { label: "Most satisfied", c: strongest },
            { label: "Most room to grow", c: weakest },
          ].map(
            ({ label, c }) =>
              c && (
                <Link
                  key={label}
                  href={`/categories/${c.id}`}
                  className="surface flex items-center gap-4 p-5 transition-colors hover:border-foreground/15"
                >
                  <CategoryBadge id={c.id} />
                  <div className="min-w-0 flex-1">
                    <div className="eyebrow">{label}</div>
                    <div className="mt-0.5 truncate font-medium">{c.name}</div>
                  </div>
                  <div className={cn("tabular text-2xl font-semibold", toneText[toneForScore(Number(scores[c.id].score))])}>
                    {fmtScore(scores[c.id].score)}
                  </div>
                </Link>
              ),
          )}
          <div className="surface flex items-center justify-between gap-3 p-5">
            <div>
              <div className="font-medium">Compare with friends</div>
              <div className="text-sm text-muted-foreground">The more the merrier.</div>
            </div>
            <InviteButton label="Invite" />
          </div>
        </section>

        <section className="surface p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-medium">Life Score history</h2>
            <Link href="/history" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              <History className="size-4" aria-hidden /> All changes
            </Link>
          </div>
          <div className="mt-4">
            {history.length > 1 ? (
              <TrendChart scale="pct" data={history.map((h) => ({ t: h.created_at, value: Number(h.life_score) }))} />
            ) : (
              <div className="grid h-[220px] place-items-center rounded-xl border border-dashed border-border text-center text-sm text-muted-foreground">
                <div>
                  Your trend appears here after your next update.
                  <div className="mt-1 text-xs">Update a category whenever something in your life changes.</div>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Category breakdown */}
      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Category breakdown</h2>
            <p className="text-sm text-muted-foreground">Each category counts equally. Trends compare with your previous score.</p>
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-border p-0.5 text-xs" role="group" aria-label="Sort categories">
            <ArrowUpDown className="mx-1.5 size-3.5 text-muted-foreground" aria-hidden />
            {(["default", "high", "low"] as const).map((s) => (
              <Link
                key={s}
                href={s === "default" ? "/dashboard" : `/dashboard?sort=${s}`}
                scroll={false}
                aria-current={sort === s ? "true" : undefined}
                className={cn("rounded-md px-2.5 py-1 text-muted-foreground", sort === s && "bg-foreground/[0.08] text-foreground")}
              >
                {s === "default" ? "Default" : s === "high" ? "Highest" : "Lowest"}
              </Link>
            ))}
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ordered.map((c) => {
            const s = scores[c.id];
            const trend = s && s.previous_score != null ? Number(s.score) - Number(s.previous_score) : null;
            return (
              <Link
                key={c.id}
                href={s ? `/categories/${c.id}` : `/categories/${c.id}/update`}
                className="surface group p-4 transition-colors hover:border-foreground/15"
              >
                <div className="flex items-center gap-3">
                  <CategoryBadge id={c.id} className="size-8" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{c.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {s ? (c.id === strongest?.id ? "Strongest area" : c.id === weakest?.id ? "Most room to grow" : `Updated ${timeAgo(s.updated_at)}`) : "Not scored yet"}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={cn("tabular text-lg font-semibold", s ? toneText[toneForScore(Number(s.score))] : "text-muted-foreground")}>
                      {s ? fmtScore(s.score) : "—"}
                      <span className="text-xs font-normal text-muted-foreground">/10</span>
                    </div>
                    {trend !== null && <Delta value={trend} hideZero />}
                  </div>
                </div>
                <ScoreBar score={s ? Number(s.score) : null} className="mt-3" />
              </Link>
            );
          })}
        </div>
      </section>

      {/* Goals + activity */}
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <section className="surface p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-medium">Personal goals</h2>
            <Link href="/goals" className="text-sm text-muted-foreground hover:text-foreground">
              View all
            </Link>
          </div>
          {goals.length ? (
            <ul className="mt-4 space-y-4">
              {goals.map((g) => (
                <li key={g.id}>
                  <Link href={`/goals/${g.id}`} className="block rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="truncate font-medium">{g.name}</span>
                      <span className="tabular shrink-0 text-muted-foreground">
                        <span className="text-foreground">{g.current_score}</span> → {g.target_score}
                      </span>
                    </div>
                    <ScoreBar score={g.current_score} target={g.target_score} className="mt-2" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-4 rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">
              <Target className="mb-2 size-5" aria-hidden />
              Track anything else you want to work on, like fitness, saving, confidence or discipline.
              <div className="mt-3">
                <Link href="/goals/new" className={buttonVariants({ variant: "outline", size: "sm" })}>
                  <Plus /> Add a goal
                </Link>
              </div>
            </div>
          )}
        </section>

        <section className="surface p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-medium">Recent changes</h2>
            <Link href="/history" className="text-sm text-muted-foreground hover:text-foreground">
              History
            </Link>
          </div>
          <ul className="mt-3 divide-y divide-border">
            {changes.map((ch) => {
              const cat = getCategory(ch.category_id);
              return (
                <li key={ch.id} className="flex items-center gap-3 py-2.5">
                  <CategoryBadge id={ch.category_id} className="size-7 rounded-lg" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm">{cat?.name}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {ch.source === "manual" ? "Quick update" : ch.source === "goal" ? "Linked goal" : "Assessment"} · {timeAgo(ch.created_at)}
                      {ch.note ? ` · “${ch.note}”` : ""}
                    </div>
                  </div>
                  <div className="tabular text-right text-sm">
                    <span className="text-muted-foreground">{ch.previous_score != null ? `${fmtScore(ch.previous_score)} → ` : ""}</span>
                    {fmtScore(ch.new_score)}
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="mt-3">
            <Link href="/leaderboard" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
              <Trophy className="size-4" aria-hidden /> See the leaderboard <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </div>
        </section>
      </div>
    </Container>
  );
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="eyebrow">{label}</dt>
      <dd className="mt-1 text-lg font-medium">{children}</dd>
    </div>
  );
}
