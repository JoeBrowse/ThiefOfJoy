import Link from "next/link";
import { MessageSquare, MessagesSquare, Plus, Search, X } from "lucide-react";
import { requireOnboarded } from "@/lib/auth";
import { CATEGORIES, getCategory } from "@/lib/content/categories";
import { displayName, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Container, EmptyState, PageHeader } from "@/components/page-header";
import { VoteButtons } from "@/components/community/vote-buttons";
import { CategoryTag } from "@/components/community/category-tag";
import { CategoryIcon } from "@/components/category-icon";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const metadata = { title: "Community" };

const SORTS = {
  new: { label: "Newest", column: "created_at" },
  top: { label: "Most popular", column: "score" },
  active: { label: "Most active", column: "last_activity_at" },
} as const;
type SortKey = keyof typeof SORTS;

type SP = { sort?: string; category?: string; q?: string };

function href(sp: SP, patch: Partial<SP>) {
  const merged = { ...sp, ...patch };
  const params = new URLSearchParams();
  Object.entries(merged).forEach(([k, v]) => v && params.set(k, v));
  const s = params.toString();
  return `/community${s ? `?${s}` : ""}`;
}

export default async function CommunityPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const sort: SortKey = sp.sort && sp.sort in SORTS ? (sp.sort as SortKey) : "active";
  const category = sp.category === "other" ? "other" : getCategory(sp.category)?.id;
  const q = sp.q?.trim().slice(0, 100);
  const { supabase, userId } = await requireOnboarded();

  let query = supabase
    .from("posts")
    .select("id, title, body, category_id, custom_category, score, comment_count, created_at, last_activity_at, author_id, profiles!posts_author_id_fkey(username, display_name)")
    .eq("is_removed", false)
    .order(SORTS[sort].column, { ascending: false })
    .order("created_at", { ascending: false })
    .limit(50);
  if (category === "other") query = query.is("category_id", null);
  else if (category) query = query.eq("category_id", category);
  if (q) query = query.textSearch("search", q, { type: "websearch", config: "english" });
  const { data: posts, error } = await query;

  const ids = (posts ?? []).map((p) => p.id);
  const { data: myVotes } = ids.length
    ? await supabase.from("post_votes").select("post_id, value").eq("user_id", userId).in("post_id", ids)
    : { data: [] };
  const voteMap = Object.fromEntries((myVotes ?? []).map((v) => [v.post_id, v.value]));

  return (
    <Container>
      <PageHeader
        title="Community"
        description="Talk about what's working, what isn't and what you're trying next, across every area of life."
        actions={
          <Link href={category && category !== "other" ? `/community/new?category=${category}` : "/community/new"} className={buttonVariants()}>
            <Plus /> New thread
          </Link>
        }
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-[220px_1fr]">
        {/* Category filter */}
        <nav aria-label="Filter by category" className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0">
          <FilterLink active={!category} href={href(sp, { category: undefined })}>
            <MessagesSquare className="size-4" aria-hidden /> All topics
          </FilterLink>
          {CATEGORIES.map((c) => (
            <FilterLink key={c.id} active={category === c.id} href={href(sp, { category: c.id })}>
              <CategoryIcon id={c.id} /> {c.shortName}
            </FilterLink>
          ))}
          <FilterLink active={category === "other"} href={href(sp, { category: "other" })}>
            <CategoryIcon id={null} /> Other
          </FilterLink>
        </nav>

        <div className="min-w-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <form action="/community" className="relative w-full sm:max-w-xs" role="search">
              {category && <input type="hidden" name="category" value={category} />}
              {sort !== "active" && <input type="hidden" name="sort" value={sort} />}
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input name="q" defaultValue={q} placeholder="Search discussions" className="pl-9" aria-label="Search discussions" />
            </form>
            <div className="flex items-center gap-1 rounded-lg border border-border p-0.5 text-xs" role="group" aria-label="Sort">
              {(Object.keys(SORTS) as SortKey[]).map((s) => (
                <Link
                  key={s}
                  href={href(sp, { sort: s === "active" ? undefined : s })}
                  aria-current={sort === s ? "true" : undefined}
                  className={cn("rounded-md px-2.5 py-1.5 text-muted-foreground", sort === s && "bg-foreground/[0.08] text-foreground")}
                >
                  {SORTS[s].label}
                </Link>
              ))}
            </div>
          </div>

          {(q || category) && (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              {posts?.length ?? 0} result{posts?.length === 1 ? "" : "s"}
              {q && <> for “{q}”</>}
              {category && <> in {category === "other" ? "Other" : getCategory(category)?.name}</>}
              <Link href="/community" className="inline-flex items-center gap-1 text-foreground hover:underline">
                <X className="size-3.5" aria-hidden /> Clear
              </Link>
            </div>
          )}

          {error && <p className="mt-4 text-sm text-destructive">Couldn&apos;t load discussions: {error.message}</p>}

          {!posts?.length ? (
            <EmptyState
              className="mt-4"
              icon={<MessagesSquare className="size-6" />}
              title={q ? "No matching discussions" : "No discussions yet"}
              action={
                <Link href="/community/new" className={buttonVariants()}>
                  Start the first thread
                </Link>
              }
            >
              {q ? "Try a different search." : "Be the first to start a conversation here."}
            </EmptyState>
          ) : (
            <ul className="mt-4 space-y-2">
              {posts.map((p) => (
                <li key={p.id} className="surface flex gap-3 p-3 transition-colors hover:border-foreground/15 sm:p-4">
                  <VoteButtons kind="post" id={p.id} userId={userId} score={p.score} myVote={voteMap[p.id] ?? 0} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                      <CategoryTag categoryId={p.category_id} custom={p.custom_category} />
                      {p.profiles?.username ? (
                        <Link href={`/u/${p.profiles.username}`} className="hover:text-foreground">
                          {displayName(p.profiles)}
                        </Link>
                      ) : (
                        <span>[deleted]</span>
                      )}
                      <span aria-hidden>·</span>
                      <time dateTime={p.created_at}>{timeAgo(p.created_at)}</time>
                    </div>
                    <Link href={`/community/${p.id}`} className="mt-1.5 block">
                      <h2 className="font-medium text-balance hover:text-primary">{p.title}</h2>
                      {p.body && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.body.replace(/[#*_>`~\[\]]/g, "")}</p>}
                    </Link>
                    <Link href={`/community/${p.id}`} className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
                      <MessageSquare className="size-3.5" aria-hidden /> {p.comment_count} {p.comment_count === 1 ? "comment" : "comments"}
                      {p.comment_count > 0 && <span>· active {timeAgo(p.last_activity_at)}</span>}
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Container>
  );
}

function FilterLink({ active, href, children }: { active: boolean; href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-sm whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground lg:py-2",
        active ? "bg-foreground/[0.08] text-foreground" : "border border-border lg:border-transparent",
      )}
    >
      {children}
    </Link>
  );
}
