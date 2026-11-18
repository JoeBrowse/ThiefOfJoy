import Link from "next/link";
import { EyeOff, Info, Trophy } from "lucide-react";
import { requireOnboarded } from "@/lib/auth";
import { getStats } from "@/lib/data";
import { fmtPct, toneForPct, toneText } from "@/lib/scoring";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Container, EmptyState, PageHeader } from "@/components/page-header";
import { Delta, RankDelta } from "@/components/delta";
import { InviteButton } from "@/components/invite-button";
import { buttonVariants } from "@/components/ui/button";

export const metadata = { title: "Leaderboard" };

export default async function LeaderboardPage() {
  const { supabase, userId, profile } = await requireOnboarded();
  const [mine, { data: rows }] = await Promise.all([
    getStats(supabase, userId),
    supabase
      .from("user_stats")
      .select("user_id, life_score, previous_life_score, current_rank, previous_rank, rank_changed_at, score_updated_at, profiles!user_stats_user_id_fkey(username, display_name)")
      .not("current_rank", "is", null)
      .order("current_rank", { ascending: true })
      .limit(200),
  ]);
  const board = rows ?? [];

  let notRankedReason: string | null = null;
  if (!mine?.current_rank) {
    if (!profile.show_on_leaderboard) notRankedReason = "You've hidden yourself from the leaderboard.";
    else if (mine?.life_score == null) notRankedReason = "Complete your assessment to join the leaderboard.";
    else if (!mine.is_complete) notRankedReason = `Score all 15 categories to join (you've scored ${mine.categories_scored}). This keeps everyone's scores comparable.`;
  }

  return (
    <Container className="max-w-4xl">
      <PageHeader
        title="Leaderboard"
        description="Ranked by Life Score: how satisfied each person is by their own standards. It's a bit of fun, not a measure of worth."
        actions={<InviteButton />}
      />

      {notRankedReason ? (
        <div className="surface mt-6 flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3 text-sm">
            {profile.show_on_leaderboard ? <Info className="mt-0.5 size-4 text-primary" aria-hidden /> : <EyeOff className="mt-0.5 size-4 text-muted-foreground" aria-hidden />}
            <span>{notRankedReason}</span>
          </div>
          <Link href={profile.show_on_leaderboard ? "/assessment" : "/profile"} className={buttonVariants({ variant: "outline", size: "sm" })}>
            {profile.show_on_leaderboard ? "Continue assessment" : "Privacy settings"}
          </Link>
        </div>
      ) : (
        mine?.current_rank && (
          <div className="surface mt-6 flex items-center gap-4 p-5">
            <div className="tabular text-3xl font-semibold">#{mine.current_rank}</div>
            <div className="flex-1 text-sm">
              <div className="font-medium">Your position</div>
              <div className="text-muted-foreground">
                {mine.previous_rank ? `Previously #${mine.previous_rank}` : "Your first ranking"}
                {mine.rank_changed_at ? ` · moved ${timeAgo(mine.rank_changed_at)}` : ""}
              </div>
            </div>
            <RankDelta current={mine.current_rank} previous={mine.previous_rank} />
          </div>
        )
      )}

      {board.length === 0 ? (
        <EmptyState className="mt-6" icon={<Trophy className="size-6" />} title="Nobody's ranked yet" action={<InviteButton variant="default" />}>
          Complete your assessment and invite friends to get the competition started.
        </EmptyState>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card">
          <table className="w-full text-sm">
            <caption className="sr-only">Leaderboard ranked by Life Score</caption>
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th scope="col" className="w-14 py-3 pl-4 font-medium sm:pl-5">Rank</th>
                <th scope="col" className="py-3 font-medium">Member</th>
                <th scope="col" className="py-3 text-right font-medium">Life Score</th>
                <th scope="col" className="hidden py-3 text-right font-medium sm:table-cell">Score change</th>
                <th scope="col" className="py-3 pr-4 text-right font-medium sm:pr-5">Movement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {board.map((r) => {
                const p = r.profiles;
                const me = r.user_id === userId;
                const change = r.previous_life_score != null ? Number(r.life_score) - Number(r.previous_life_score) : null;
                return (
                  <tr key={r.user_id} className={cn("transition-colors hover:bg-foreground/[0.02]", me && "bg-primary/[0.06]")}>
                    <td className="py-3.5 pl-4 sm:pl-5">
                      <span
                        className={cn(
                          "tabular grid size-8 place-items-center rounded-lg text-sm font-semibold",
                          r.current_rank === 1 ? "bg-score-mid/15 text-score-mid" : r.current_rank! <= 3 ? "bg-foreground/[0.07]" : "text-muted-foreground",
                        )}
                      >
                        {r.current_rank}
                      </span>
                    </td>
                    <td className="py-3.5">
                      <Link href={`/u/${p?.username}`} className="group block min-w-0">
                        <span className="block truncate font-medium group-hover:text-primary">
                          {p?.display_name || `@${p?.username}`}
                          {me && <span className="ml-1.5 text-xs font-normal text-primary">You</span>}
                        </span>
                        {p?.display_name && <span className="block truncate text-xs text-muted-foreground">@{p.username}</span>}
                      </Link>
                    </td>
                    <td className={cn("tabular py-3.5 text-right text-base font-semibold", toneText[toneForPct(Number(r.life_score))])}>
                      {fmtPct(r.life_score)}%
                    </td>
                    <td className="hidden py-3.5 text-right sm:table-cell">
                      {change === null ? <span className="text-xs text-muted-foreground">—</span> : <Delta value={change} />}
                    </td>
                    <td className="py-3.5 pr-4 text-right sm:pr-5">
                      <div className="flex flex-col items-end gap-0.5">
                        <RankDelta current={r.current_rank} previous={r.previous_rank} />
                        {r.previous_rank && r.previous_rank !== r.current_rank && (
                          <span className="text-[11px] text-muted-foreground">was #{r.previous_rank}</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-6 space-y-1.5 text-xs text-muted-foreground">
        <p>
          <span className="text-foreground/80">How ranking works:</span> only members who have scored all 15 categories and chose to appear
          are ranked. Movement arrows reflect actual changes in position: green when you overtake someone, red when you&apos;re overtaken.
        </p>
        <p>
          <span className="text-foreground/80">Ties:</span> if two people have exactly the same Life Score, whoever reached that score first
          ranks higher.
        </p>
      </div>
    </Container>
  );
}
