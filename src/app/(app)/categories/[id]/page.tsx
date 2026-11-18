import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ListChecks, MessageSquare, MessagesSquare, Target } from "lucide-react";
import { requireOnboarded } from "@/lib/auth";
import { getCategoryScores, getStats } from "@/lib/data";
import { getCategory } from "@/lib/content/categories";
import { fmtScore, toneForScore, toneLabel, toneText } from "@/lib/scoring";
import { fmtDate, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Container } from "@/components/page-header";
import { CategoryBadge } from "@/components/category-icon";
import { ScoreBar } from "@/components/score-bar";
import { Delta } from "@/components/delta";
import { TrendChart } from "@/components/charts/trend-chart";
import { QuickUpdateDialog } from "@/components/quick-update-dialog";
import { buttonVariants } from "@/components/ui/button";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  return { title: getCategory((await params).id)?.name ?? "Category" };
}

export default async function CategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const category = getCategory(id);
  if (!category) notFound();
  const { supabase, userId } = await requireOnboarded();

  const [scores, stats, historyRes, goalsRes, postsRes] = await Promise.all([
    getCategoryScores(supabase, userId),
    getStats(supabase, userId),
    supabase.from("category_score_history").select("*").eq("user_id", userId).eq("category_id", id).order("created_at", { ascending: true }).limit(200),
    supabase.from("custom_goals").select("*").eq("user_id", userId).eq("category_id", id).eq("status", "active"),
    supabase
      .from("posts")
      .select("id, title, comment_count, score, created_at")
      .eq("category_id", id)
      .eq("is_removed", false)
      .order("last_activity_at", { ascending: false })
      .limit(5),
  ]);
  const s = scores[id];
  const history = historyRes.data ?? [];

  const lastSession = s?.last_session_id;
  const { data: answers } = lastSession
    ? await supabase.from("question_answers").select("question_id, score").eq("session_id", lastSession)
    : { data: [] as { question_id: string; score: number | null }[] };
  const answerMap = Object.fromEntries((answers ?? []).map((a) => [a.question_id, a.score]));
  const reflections = [...history].reverse().filter((h) => h.note);

  const allScores = Object.fromEntries(Object.entries(scores).map(([k, v]) => [k, Number(v.score)]));
  const trend = s && s.previous_score != null ? Number(s.score) - Number(s.previous_score) : null;
  const goalBlend = s && Number(s.score) !== Number(s.base_score);

  return (
    <Container className="space-y-6">
      <Link href="/categories" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden /> Categories
      </Link>

      <section className="surface p-6 sm:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4">
            <CategoryBadge id={id} className="size-12 rounded-2xl" />
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{category.name}</h1>
              <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">{category.description}</p>
            </div>
          </div>
          <div className="shrink-0 md:text-right">
            <div className={cn("tabular text-5xl font-semibold tracking-tight", s ? toneText[toneForScore(Number(s.score))] : "text-muted-foreground")}>
              {s ? fmtScore(s.score) : "—"}
              <span className="text-lg text-muted-foreground"> / 10</span>
            </div>
            <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground md:justify-end">
              {s ? (
                <>
                  {toneLabel[toneForScore(Number(s.score))]}
                  {trend !== null && <Delta value={trend} />}
                </>
              ) : (
                "Not scored yet"
              )}
            </div>
          </div>
        </div>

        {s && <ScoreBar score={Number(s.score)} className="mt-6" />}
        {s && (
          <p className="mt-3 text-xs text-muted-foreground">
            {s.source === "manual" ? "Set by quick update" : `Average of ${s.answered_count} answered questions`} · updated {timeAgo(s.updated_at)}
            {goalBlend && ` · includes linked goals (base ${fmtScore(s.base_score)})`}
          </p>
        )}

        <div className="mt-6 flex flex-wrap gap-2">
          <Link href={`/categories/${id}/update`} className={buttonVariants()}>
            <ListChecks /> {s ? "Re-answer questions" : "Score this category"}
          </Link>
          <QuickUpdateDialog
            categoryId={id}
            categoryName={category.name}
            current={s ? Number(s.score) : null}
            allScores={allScores}
            currentLifeScore={stats?.life_score != null ? Number(stats.life_score) : null}
          />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <section className="surface p-5 sm:p-6">
          <h2 className="font-medium">Score history</h2>
          <div className="mt-4">
            {history.length > 1 ? (
              <TrendChart scale="score" data={history.map((h) => ({ t: h.created_at, value: Number(h.new_score) }))} />
            ) : (
              <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                Update this category over time to see your trend.
              </p>
            )}
          </div>
          {history.length > 0 && (
            <ul className="mt-4 divide-y divide-border text-sm">
              {[...history].reverse().slice(0, 8).map((h) => (
                <li key={h.id} className="flex items-center justify-between gap-3 py-2">
                  <span className="text-muted-foreground">
                    {fmtDate(h.created_at)} · {h.source === "manual" ? "Quick update" : h.source === "goal" ? "Linked goal" : "Assessment"}
                  </span>
                  <span className="tabular">
                    <span className="text-muted-foreground">{h.previous_score != null ? `${fmtScore(h.previous_score)} → ` : ""}</span>
                    {fmtScore(h.new_score)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="surface p-5 sm:p-6">
          <h2 className="font-medium">Your latest answers</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">Private to you.</p>
          <ul className="mt-4 space-y-3">
            {category.questions.map((q) => {
              const v = answerMap[q.id];
              return (
                <li key={q.id} className="flex items-start justify-between gap-4 text-sm">
                  <span className="text-foreground/85">{q.prompt}</span>
                  <span className={cn("tabular shrink-0 font-medium", typeof v === "number" ? toneText[toneForScore(v)] : "text-muted-foreground")}>
                    {typeof v === "number" ? v : v === null ? "Skipped" : "—"}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="surface p-5 sm:p-6">
          <h2 className="flex items-center gap-2 font-medium">
            <MessageSquare className="size-4 text-muted-foreground" aria-hidden /> Reflections
          </h2>
          {reflections.length ? (
            <ul className="mt-3 space-y-3">
              {reflections.slice(0, 5).map((r) => (
                <li key={r.id} className="text-sm">
                  <p className="text-foreground/90">“{r.note}”</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{fmtDate(r.created_at)}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">Notes you add when updating this category will appear here.</p>
          )}
        </section>

        <section className="surface p-5 sm:p-6">
          <h2 className="flex items-center gap-2 font-medium">
            <Target className="size-4 text-muted-foreground" aria-hidden /> Linked goals
          </h2>
          {goalsRes.data?.length ? (
            <ul className="mt-3 space-y-3">
              {goalsRes.data.map((g) => (
                <li key={g.id}>
                  <Link href={`/goals/${g.id}`} className="block text-sm">
                    <div className="flex justify-between">
                      <span>{g.name}</span>
                      <span className="tabular text-muted-foreground">
                        {g.current_score} → {g.target_score}
                      </span>
                    </div>
                    <ScoreBar score={g.current_score} target={g.target_score} className="mt-1.5" />
                    {g.counts_toward_category && <p className="mt-1 text-xs text-muted-foreground">Counts towards this category</p>}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              No goals linked.{" "}
              <Link href={`/goals/new?category=${id}`} className="text-foreground underline-offset-4 hover:underline">
                Add one
              </Link>
            </p>
          )}
        </section>

        <section className="surface p-5 sm:p-6">
          <h2 className="flex items-center gap-2 font-medium">
            <MessagesSquare className="size-4 text-muted-foreground" aria-hidden /> Discussions
          </h2>
          {postsRes.data?.length ? (
            <ul className="mt-3 space-y-2.5">
              {postsRes.data.map((p) => (
                <li key={p.id}>
                  <Link href={`/community/${p.id}`} className="block text-sm hover:text-primary">
                    {p.title}
                    <span className="block text-xs text-muted-foreground">
                      {p.comment_count} comments · {timeAgo(p.created_at)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">No discussions yet.</p>
          )}
          <div className="mt-4 flex gap-3 text-sm">
            <Link href={`/community?category=${id}`} className="text-muted-foreground hover:text-foreground">
              View all
            </Link>
            <Link href={`/community/new?category=${id}`} className="text-muted-foreground hover:text-foreground">
              Start a thread
            </Link>
          </div>
        </section>
      </div>
    </Container>
  );
}
