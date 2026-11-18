import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { requireOnboarded } from "@/lib/auth";
import { getCategoryScores } from "@/lib/data";
import { CATEGORIES } from "@/lib/content/categories";
import { fmtScore, toneForScore, toneText } from "@/lib/scoring";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Container, PageHeader } from "@/components/page-header";
import { CategoryBadge } from "@/components/category-icon";
import { ScoreBar } from "@/components/score-bar";
import { Delta } from "@/components/delta";

export const metadata = { title: "Categories" };

export default async function CategoriesPage() {
  const { supabase, userId } = await requireOnboarded();
  const scores = await getCategoryScores(supabase, userId);

  return (
    <Container>
      <PageHeader
        title="Categories"
        description="The 15 areas that make up your Life Score. Open one to see its history, update it, or join related discussions."
      />
      <ul className="mt-6 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
        {CATEGORIES.map((c) => {
          const s = scores[c.id];
          const trend = s && s.previous_score != null ? Number(s.score) - Number(s.previous_score) : null;
          return (
            <li key={c.id}>
              <Link href={`/categories/${c.id}`} className="flex items-center gap-4 px-4 py-4 transition-colors hover:bg-foreground/[0.03] sm:px-5">
                <CategoryBadge id={c.id} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="truncate font-medium">{c.name}</span>
                    <span className="hidden text-xs text-muted-foreground sm:inline">{c.questions.length} questions</span>
                  </div>
                  <div className="truncate text-sm text-muted-foreground">{c.tagline}</div>
                  <ScoreBar score={s ? Number(s.score) : null} className="mt-2 max-w-sm" />
                </div>
                <div className="text-right">
                  <div className={cn("tabular text-xl font-semibold", s ? toneText[toneForScore(Number(s.score))] : "text-muted-foreground")}>
                    {s ? fmtScore(s.score) : "—"}
                  </div>
                  <div className="text-xs text-muted-foreground">{s ? (trend ? <Delta value={trend} /> : timeAgo(s.updated_at)) : "Not scored"}</div>
                </div>
                <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
              </Link>
            </li>
          );
        })}
      </ul>
    </Container>
  );
}
