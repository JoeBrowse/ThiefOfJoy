import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, Link2 } from "lucide-react";
import { requireOnboarded } from "@/lib/auth";
import { getCategory } from "@/lib/content/categories";
import { goalProgress } from "@/lib/goals";
import { fmtDate, timeAgo } from "@/lib/format";
import { toneForScore, toneText } from "@/lib/scoring";
import { cn } from "@/lib/utils";
import { Container } from "@/components/page-header";
import { ScoreBar } from "@/components/score-bar";
import { TrendChart } from "@/components/charts/trend-chart";
import { Delta } from "@/components/delta";
import { GoalUpdateForm } from "@/components/goals/goal-update-form";
import { GoalActions } from "@/components/goals/goal-actions";

export const metadata = { title: "Goal" };

export default async function GoalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, userId } = await requireOnboarded();
  const [{ data: goal }, { data: updates }] = await Promise.all([
    supabase.from("custom_goals").select("*").eq("id", id).eq("user_id", userId).maybeSingle(),
    supabase.from("custom_goal_updates").select("*").eq("goal_id", id).order("created_at", { ascending: true }),
  ]);
  if (!goal) notFound();

  const points = [{ t: goal.created_at, value: goal.start_score }, ...(updates ?? []).map((u) => ({ t: u.created_at, value: u.new_score }))];
  const reached = goal.current_score >= goal.target_score;
  const category = getCategory(goal.category_id);

  return (
    <Container className="max-w-4xl space-y-6">
      <Link href="/goals" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden /> Goals
      </Link>

      <section className="surface p-6 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">{goal.name}</h1>
              {goal.status === "archived" && <span className="rounded-full bg-foreground/10 px-2 py-0.5 text-xs text-muted-foreground">Archived</span>}
              {reached && (
                <span className="inline-flex items-center gap-1 rounded-full bg-up/12 px-2 py-0.5 text-xs font-medium text-up">
                  <CheckCircle2 className="size-3" aria-hidden /> Target reached
                </span>
              )}
            </div>
            {goal.description && <p className="mt-2 max-w-xl text-sm text-muted-foreground">{goal.description}</p>}
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span>Started {fmtDate(goal.created_at)} at {goal.start_score}</span>
              {goal.target_date && <span>Target date {fmtDate(goal.target_date)}</span>}
              {category && (
                <Link href={`/categories/${category.id}`} className="inline-flex items-center gap-1 hover:text-foreground">
                  <Link2 className="size-3" aria-hidden /> {category.name}
                  {goal.counts_toward_category ? " · counts towards score" : " · not counted in Life Score"}
                </Link>
              )}
              <span>{goal.is_public ? "Shareable" : "Private"}</span>
            </div>
          </div>
          <div className="shrink-0 sm:text-right">
            <div className={cn("tabular text-5xl font-semibold tracking-tight", toneText[toneForScore(goal.current_score)])}>
              {goal.current_score}
              <span className="text-lg text-muted-foreground"> / {goal.target_score}</span>
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              {goalProgress(goal)}% of the way · <Delta value={goal.current_score - goal.start_score} /> since start
            </div>
          </div>
        </div>
        <ScoreBar score={goal.current_score} target={goal.target_score} className="mt-6" />
        <div className="mt-6">
          <GoalActions goal={goal} />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <section className="surface p-5 sm:p-6">
          <h2 className="font-medium">Progress</h2>
          <div className="mt-4">
            <TrendChart scale="score" data={points} target={goal.target_score} color="var(--chart-2)" />
          </div>
          <h3 className="eyebrow mt-6">Update history</h3>
          <ol className="mt-3 space-y-3">
            {[...(updates ?? [])].reverse().map((u) => (
              <li key={u.id} className="flex items-start justify-between gap-4 text-sm">
                <div className="min-w-0">
                  {u.note ? <p className="text-foreground/90">“{u.note}”</p> : <p className="text-muted-foreground">Score updated</p>}
                  <p className="text-xs text-muted-foreground">{timeAgo(u.created_at)}</p>
                </div>
                <span className="tabular shrink-0">
                  <span className="text-muted-foreground">{u.previous_score} → </span>
                  {u.new_score}
                </span>
              </li>
            ))}
            <li className="flex justify-between text-sm text-muted-foreground">
              <span>Goal created · {fmtDate(goal.created_at)}</span>
              <span className="tabular">{goal.start_score}</span>
            </li>
          </ol>
        </section>

        <section className="surface h-fit p-5 sm:p-6">
          <h2 className="font-medium">Log progress</h2>
          <p className="mt-1 mb-4 text-xs text-muted-foreground">
            Rate your satisfaction with your progress, not just the outcome. Consistency and effort count.
          </p>
          <GoalUpdateForm goalId={goal.id} current={goal.current_score} />
        </section>
      </div>
    </Container>
  );
}
