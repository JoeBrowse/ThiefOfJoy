import Link from "next/link";
import { History } from "lucide-react";
import { requireOnboarded } from "@/lib/auth";
import { getCategory } from "@/lib/content/categories";
import { fmtDate, timeAgo } from "@/lib/format";
import { fmtPct, fmtScore } from "@/lib/scoring";
import { Container, EmptyState, PageHeader } from "@/components/page-header";
import { CategoryBadge } from "@/components/category-icon";
import { Delta } from "@/components/delta";

export const metadata = { title: "History" };

export default async function HistoryPage() {
  const { supabase, userId } = await requireOnboarded();
  const [{ data: changes }, { data: life }] = await Promise.all([
    supabase.from("category_score_history").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(300),
    supabase.from("life_score_history").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(300),
  ]);

  // Merge into one feed, newest first
  type Item =
    | { kind: "category"; at: string; row: NonNullable<typeof changes>[number] }
    | { kind: "life"; at: string; row: NonNullable<typeof life>[number] };
  const items: Item[] = [
    ...(changes ?? []).map((row) => ({ kind: "category" as const, at: row.created_at, row })),
    ...(life ?? []).map((row) => ({ kind: "life" as const, at: row.created_at, row })),
  ].sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : a.kind === "life" ? -1 : 1));

  return (
    <Container className="max-w-3xl">
      <PageHeader title="History" description="Every change to your scores, with any notes you added. Only you can see this." />
      {items.length === 0 ? (
        <EmptyState className="mt-6" icon={<History className="size-6" />} title="No changes yet">
          Complete your assessment to start your history.
        </EmptyState>
      ) : (
        <ol className="mt-6 space-y-2">
          {items.map((it) =>
            it.kind === "life" ? (
              <li key={`l-${it.row.id}`} className="flex items-center justify-between gap-3 rounded-xl bg-primary/[0.07] px-4 py-3 text-sm ring-1 ring-primary/15">
                <div>
                  <span className="font-medium">Life Score {fmtPct(it.row.life_score)}%</span>
                  {!it.row.is_complete && <span className="ml-2 text-xs text-score-mid">incomplete ({it.row.categories_scored}/15)</span>}
                  <div className="text-xs text-muted-foreground">{fmtDate(it.at, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
                </div>
                {it.row.previous_life_score != null && <Delta value={Number(it.row.life_score) - Number(it.row.previous_life_score)} suffix=" pts" />}
              </li>
            ) : (
              <li key={`c-${it.row.id}`} className="flex items-start gap-3 rounded-xl px-4 py-3 text-sm">
                <CategoryBadge id={it.row.category_id} className="size-8" />
                <div className="min-w-0 flex-1">
                  <Link href={`/categories/${it.row.category_id}`} className="font-medium hover:text-primary">
                    {getCategory(it.row.category_id)?.name}
                  </Link>
                  <div className="text-xs text-muted-foreground">
                    {it.row.source === "manual" ? "Quick update" : it.row.source === "goal" ? "Linked goal changed" : "Assessment"} · {timeAgo(it.at)}
                  </div>
                  {it.row.note && <p className="mt-1.5 text-foreground/85">“{it.row.note}”</p>}
                </div>
                <div className="tabular shrink-0 text-right">
                  <div>
                    <span className="text-muted-foreground">{it.row.previous_score != null ? `${fmtScore(it.row.previous_score)} → ` : ""}</span>
                    {fmtScore(it.row.new_score)}
                  </div>
                  {it.row.previous_score != null && <Delta value={Number(it.row.new_score) - Number(it.row.previous_score)} hideZero />}
                </div>
              </li>
            ),
          )}
        </ol>
      )}
    </Container>
  );
}
