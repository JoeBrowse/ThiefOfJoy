import Link from "next/link";
import { notFound } from "next/navigation";
import { Lock, Trophy } from "lucide-react";
import { requireOnboarded } from "@/lib/auth";
import { CATEGORIES } from "@/lib/content/categories";
import { fmtPct, fmtScore, toneForScore, toneText } from "@/lib/scoring";
import { fmtDate, timeAgo } from "@/lib/format";
import { goalProgress } from "@/lib/goals";
import { cn } from "@/lib/utils";
import { Container } from "@/components/page-header";
import { ScoreGauge } from "@/components/score-gauge";
import { RankDelta } from "@/components/delta";
import { ScoreBar } from "@/components/score-bar";
import { CategoryIcon } from "@/components/category-icon";
import { buttonVariants } from "@/components/ui/button";

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }) {
  return { title: `@${(await params).username}` };
}

export default async function PublicProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const { supabase, userId } = await requireOnboarded();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, display_name, bio, created_at, public_category_scores, public_goals, show_on_leaderboard")
    .eq("username", username.toLowerCase())
    .maybeSingle();
  if (!profile) notFound();
  const isMe = profile.id === userId;

  // RLS only returns rows the viewer is allowed to see.
  const [{ data: stats }, { data: catScores }, { data: goals }, { data: posts }, { data: rankHistory }] = await Promise.all([
    supabase.from("user_stats").select("*").eq("user_id", profile.id).maybeSingle(),
    profile.public_category_scores ? supabase.from("category_scores").select("category_id, score").eq("user_id", profile.id) : Promise.resolve({ data: [] }),
    profile.public_goals
      ? supabase.from("custom_goals").select("id, name, start_score, current_score, target_score, is_public").eq("user_id", profile.id).eq("status", "active").eq("is_public", true)
      : Promise.resolve({ data: [] }),
    supabase.from("posts").select("id, title, comment_count, created_at").eq("author_id", profile.id).eq("is_removed", false).order("created_at", { ascending: false }).limit(5),
    supabase.from("leaderboard_history").select("rank, previous_rank, created_at").eq("user_id", profile.id).not("rank", "is", null).order("created_at", { ascending: false }).limit(6),
  ]);
  const showStats = stats?.current_rank != null; // same view for everyone, including a self-preview
  const scoreMap = Object.fromEntries((catScores ?? []).map((c) => [c.category_id, Number(c.score)]));

  return (
    <Container className="max-w-4xl space-y-6">
      {isMe && (
        <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3 text-sm">
          <span className="text-muted-foreground">This is how other members see your profile.</span>
          <Link href="/profile" className={buttonVariants({ variant: "outline", size: "sm" })}>
            Privacy settings
          </Link>
        </div>
      )}

      <section className="surface flex flex-col items-center gap-6 p-6 sm:flex-row sm:p-8">
        {showStats ? (
          <ScoreGauge value={Number(stats?.life_score)} size={180} stroke={12} />
        ) : (
          <div className="grid size-[180px] place-items-center rounded-full border border-dashed border-border text-center text-xs text-muted-foreground">
            <div>
              <Lock className="mx-auto mb-1 size-4" aria-hidden />
              Score not shared
            </div>
          </div>
        )}
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <h1 className="text-2xl font-semibold tracking-tight">{profile.display_name || `@${profile.username}`}</h1>
          {profile.display_name && <p className="text-sm text-muted-foreground">@{profile.username}</p>}
          {profile.bio && <p className="mt-3 text-sm text-foreground/85">{profile.bio}</p>}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground sm:justify-start">
            {stats?.current_rank && (
              <span className="inline-flex items-center gap-2">
                <Trophy className="size-4" aria-hidden /> #{stats.current_rank}
                <RankDelta current={stats.current_rank} previous={stats.previous_rank} />
              </span>
            )}
            <span>Member since {fmtDate(profile.created_at, { month: "long", year: "numeric" })}</span>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="surface p-5 sm:p-6">
          <h2 className="font-medium">Category scores</h2>
          {Object.keys(scoreMap).length ? (
            <ul className="mt-4 space-y-2.5">
              {CATEGORIES.filter((c) => scoreMap[c.id] !== undefined).map((c) => (
                <li key={c.id} className="flex items-center gap-3 text-sm">
                  <CategoryIcon id={c.id} className="text-muted-foreground" />
                  <span className="w-32 truncate sm:w-40">{c.shortName}</span>
                  <ScoreBar score={scoreMap[c.id]} className="flex-1" />
                  <span className={cn("tabular w-8 text-right font-medium", toneText[toneForScore(scoreMap[c.id])])}>{fmtScore(scoreMap[c.id])}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <Lock className="size-4" aria-hidden /> Kept private.
            </p>
          )}
        </section>

        <div className="space-y-6">
          <section className="surface p-5 sm:p-6">
            <h2 className="font-medium">Shared goals</h2>
            {goals?.length ? (
              <ul className="mt-4 space-y-4">
                {goals.map((g) => (
                  <li key={g.id} className="text-sm">
                    <div className="flex justify-between">
                      <span>{g.name}</span>
                      <span className="tabular text-muted-foreground">
                        {g.current_score} → {g.target_score} · {goalProgress(g)}%
                      </span>
                    </div>
                    <ScoreBar score={g.current_score} target={g.target_score} className="mt-1.5" />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                <Lock className="size-4" aria-hidden /> No goals shared.
              </p>
            )}
          </section>

          {rankHistory && rankHistory.length > 0 && (
            <section className="surface p-5 sm:p-6">
              <h2 className="font-medium">Rank history</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {rankHistory.map((h, i) => (
                  <li key={i} className="flex items-center justify-between">
                    <span className="text-muted-foreground">{timeAgo(h.created_at)}</span>
                    <span className="flex items-center gap-2">
                      <span className="tabular">
                        {h.previous_rank ? `#${h.previous_rank} → ` : ""}#{h.rank}
                      </span>
                      <RankDelta current={h.rank} previous={h.previous_rank} />
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="surface p-5 sm:p-6">
            <h2 className="font-medium">Recent posts</h2>
            {posts?.length ? (
              <ul className="mt-3 space-y-2.5">
                {posts.map((p) => (
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
              <p className="mt-3 text-sm text-muted-foreground">No posts yet.</p>
            )}
          </section>
        </div>
      </div>

      {stats?.life_score != null && isMe && !stats.current_rank && (
        <p className="text-center text-xs text-muted-foreground">
          Your score ({fmtPct(stats.life_score)}%) is only visible to others when you&apos;re ranked on the leaderboard.
        </p>
      )}
    </Container>
  );
}
