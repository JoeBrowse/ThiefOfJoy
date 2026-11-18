import Link from "next/link";
import { Plus, Target, CheckCircle2, Link2, Globe } from "lucide-react";
import { requireOnboarded } from "@/lib/auth";
import { getCategory } from "@/lib/content/categories";
import { goalProgress } from "@/lib/goals";
import { fmtDate, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Container, EmptyState, PageHeader } from "@/components/page-header";
import { ScoreBar } from "@/components/score-bar";
import { buttonVariants } from "@/components/ui/button";

export const metadata = { title: "Goals" };

export default async function GoalsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { supabase, userId } = await requireOnboarded();
  const status = (await searchParams).status === "archived" ? "archived" : "active";
  const { data: goals } = await supabase
    .from("custom_goals")
    .select("*")
    .eq("user_id", userId)
    .eq("status", status)
    .order("updated_at", { ascending: false });

  return (
    <Container>
      <PageHeader
        title="Personal goals"
        description="Track anything else you want to work on. Goals are separate from your Life Score unless you link them to a category."
        actions={
          <Link href="/goals/new" className={buttonVariants()}>
            <Plus /> New goal
          </Link>
        }
      />
      <div className="mt-6 flex gap-1 text-sm" role="tablist">
        {(["active", "archived"] as const).map((s) => (
          <Link
            key={s}
            href={s === "active" ? "/goals" : "/goals?status=archived"}
            role="tab"
            aria-selected={status === s}
            className={cn("rounded-lg px-3 py-1.5 capitalize text-muted-foreground", status === s && "bg-foreground/[0.07] text-foreground")}
          >
            {s}
          </Link>
        ))}
      </div>

      {!goals?.length ? (
        <EmptyState
          className="mt-4"
          icon={<Target className="size-6" />}
          title={status === "active" ? "No goals yet" : "No archived goals"}
          action={
            status === "active" && (
              <Link href="/goals/new" className={buttonVariants()}>
                <Plus /> Create your first goal
              </Link>
            )
          }
        >
          {status === "active" && "Fitness, saving money, confidence, alcohol reduction, learning a skill… whatever matters to you."}
        </EmptyState>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {goals.map((g) => {
            const reached = g.current_score >= g.target_score;
            return (
              <Link key={g.id} href={`/goals/${g.id}`} className="surface flex flex-col p-5 transition-colors hover:border-foreground/15">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-medium">{g.name}</h2>
                  {reached && (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-up/12 px-2 py-0.5 text-[11px] font-medium text-up">
                      <CheckCircle2 className="size-3" aria-hidden /> Target reached
                    </span>
                  )}
                </div>
                {g.description && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{g.description}</p>}
                <div className="mt-auto pt-5">
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="tabular">
                      <span className="text-2xl font-semibold">{g.current_score}</span>
                      <span className="text-muted-foreground"> / target {g.target_score}</span>
                    </span>
                    <span className="tabular text-xs text-muted-foreground">{goalProgress(g)}%</span>
                  </div>
                  <ScoreBar score={g.current_score} target={g.target_score} className="mt-2" />
                  <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span>Started at {g.start_score}</span>
                    {g.target_date && <span>By {fmtDate(g.target_date)}</span>}
                    {g.category_id && (
                      <span className="inline-flex items-center gap-1">
                        <Link2 className="size-3" aria-hidden /> {getCategory(g.category_id)?.shortName}
                        {g.counts_toward_category && " (counts)"}
                      </span>
                    )}
                    {g.is_public && (
                      <span className="inline-flex items-center gap-1">
                        <Globe className="size-3" aria-hidden /> Shareable
                      </span>
                    )}
                    <span>Updated {timeAgo(g.updated_at)}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </Container>
  );
}
