import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { requireOnboarded } from "@/lib/auth";
import { displayName, fmtDate, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Container } from "@/components/page-header";
import { Markdown } from "@/components/markdown";
import { VoteButtons } from "@/components/community/vote-buttons";
import { CategoryTag } from "@/components/community/category-tag";
import { PostActions } from "@/components/community/post-actions";
import { CommentForm } from "@/components/community/comment-form";
import { CommentThread, type CommentNode } from "@/components/community/comment-thread";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { supabase } = await requireOnboarded();
  const { data } = await supabase.from("posts").select("title").eq("id", (await params).id).maybeSingle();
  return { title: data?.title ?? "Thread" };
}

export default async function PostPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ sort?: string }> }) {
  const { id } = await params;
  const sort = (await searchParams).sort === "new" ? "new" : "top";
  const { supabase, userId, profile } = await requireOnboarded();
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const { data: post } = await supabase
    .from("posts")
    .select("*, profiles!posts_author_id_fkey(username, display_name)")
    .eq("id", id)
    .maybeSingle();
  if (!post) notFound();

  const [{ data: comments }, { data: myPostVote }] = await Promise.all([
    supabase
      .from("comments")
      .select("id, parent_id, body, score, created_at, author_id, is_deleted, is_removed, profiles!comments_author_id_fkey(username, display_name)")
      .eq("post_id", id)
      .order("created_at", { ascending: true })
      .limit(1000),
    supabase.from("post_votes").select("value").eq("post_id", id).eq("user_id", userId).maybeSingle(),
  ]);
  const commentIds = (comments ?? []).map((c) => c.id);
  const { data: myCommentVotes } = commentIds.length
    ? await supabase.from("comment_votes").select("comment_id, value").eq("user_id", userId).in("comment_id", commentIds)
    : { data: [] };
  const voteMap = Object.fromEntries((myCommentVotes ?? []).map((v) => [v.comment_id, v.value]));

  // Build the reply tree
  const nodes = new Map<string, CommentNode & { parent_id: string | null }>();
  (comments ?? []).forEach((c) =>
    nodes.set(c.id, {
      id: c.id,
      parent_id: c.parent_id,
      body: c.body,
      score: c.score,
      created_at: c.created_at,
      author_id: c.author_id,
      is_deleted: c.is_deleted,
      is_removed: c.is_removed,
      author: c.profiles,
      myVote: voteMap[c.id] ?? 0,
      children: [],
    }),
  );
  const roots: CommentNode[] = [];
  nodes.forEach((n) => {
    const parent = n.parent_id ? nodes.get(n.parent_id) : null;
    if (parent) parent.children.push(n);
    else roots.push(n);
  });
  const cmp =
    sort === "new"
      ? (a: CommentNode, b: CommentNode) => b.created_at.localeCompare(a.created_at)
      : (a: CommentNode, b: CommentNode) => b.score - a.score || a.created_at.localeCompare(b.created_at);
  const sortTree = (list: CommentNode[]) => {
    list.sort(cmp);
    list.forEach((n) => sortTree(n.children));
  };
  sortTree(roots);

  const mine = post.author_id === userId;

  return (
    <Container className="max-w-3xl">
      <Link href="/community" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden /> Community
      </Link>

      <article className="surface mt-4 flex gap-3 p-4 sm:gap-4 sm:p-6">
        <VoteButtons kind="post" id={post.id} userId={userId} score={post.score} myVote={myPostVote?.value ?? 0} />
        <div className="min-w-0 flex-1">
          {post.is_removed && (
            <div className="mb-3 flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
              <ShieldAlert className="size-4" aria-hidden /> Removed by a moderator{post.removed_reason ? `: ${post.removed_reason}` : ""}. Only you and admins can see it.
            </div>
          )}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            <CategoryTag categoryId={post.category_id} custom={post.custom_category} />
            {post.profiles?.username ? (
              <Link href={`/u/${post.profiles.username}`} className="hover:text-foreground">
                {displayName(post.profiles)}
              </Link>
            ) : (
              <span>[deleted]</span>
            )}
            <span aria-hidden>·</span>
            <time dateTime={post.created_at} title={fmtDate(post.created_at)}>
              {timeAgo(post.created_at)}
            </time>
          </div>
          <h1 className="mt-2 text-xl font-semibold tracking-tight text-balance sm:text-2xl">{post.title}</h1>
          {post.body && <Markdown className="mt-4">{post.body}</Markdown>}
          <div className="mt-4">
            <PostActions postId={post.id} mine={mine} isAdmin={profile.is_admin} isRemoved={post.is_removed} />
          </div>
        </div>
      </article>

      <section className="mt-6" aria-label="Comments">
        {!post.is_removed && (
          <div className="surface p-4 sm:p-5">
            <CommentForm postId={post.id} />
          </div>
        )}

        <div className="mt-6 flex items-center justify-between">
          <h2 className="text-sm font-medium">
            {post.comment_count} {post.comment_count === 1 ? "comment" : "comments"}
          </h2>
          <div className="flex gap-1 text-xs" role="group" aria-label="Sort comments">
            {(["top", "new"] as const).map((s) => (
              <Link
                key={s}
                href={s === "top" ? `/community/${id}` : `/community/${id}?sort=new`}
                scroll={false}
                aria-current={sort === s ? "true" : undefined}
                className={cn("rounded-md px-2.5 py-1 text-muted-foreground", sort === s && "bg-foreground/[0.08] text-foreground")}
              >
                {s === "top" ? "Top" : "Newest"}
              </Link>
            ))}
          </div>
        </div>

        {roots.length ? (
          <div className="mt-2">
            <CommentThread nodes={roots} postId={post.id} userId={userId} isAdmin={profile.is_admin} opId={post.author_id} />
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">No comments yet. Start the conversation.</p>
        )}
      </section>
    </Container>
  );
}
