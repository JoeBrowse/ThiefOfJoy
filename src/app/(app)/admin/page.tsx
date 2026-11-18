import Link from "next/link";
import { notFound } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { requireOnboarded } from "@/lib/auth";
import { timeAgo } from "@/lib/format";
import { Container, EmptyState, PageHeader } from "@/components/page-header";
import { ReportActions, RestorePostButton } from "./report-actions";

export const metadata = { title: "Moderation" };

export default async function AdminPage() {
  const { supabase, profile } = await requireOnboarded();
  if (!profile.is_admin) notFound();

  const [{ data: reports }, { data: removed }, { count: members }, { count: postCount }] = await Promise.all([
    supabase
      .from("reports")
      .select(
        "id, reason, created_at, post_id, comment_id, reporter:profiles!reports_reporter_id_fkey(username), posts(id, title, body), comments(id, body, post_id)",
      )
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase.from("posts").select("id, title, removed_reason, created_at").eq("is_removed", true).order("updated_at", { ascending: false }).limit(50),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("posts").select("id", { count: "exact", head: true }),
  ]);

  return (
    <Container className="max-w-4xl space-y-8">
      <PageHeader title="Moderation" description={`${members ?? 0} members · ${postCount ?? 0} posts`} />

      <section>
        <h2 className="font-medium">Open reports</h2>
        {!reports?.length ? (
          <EmptyState className="mt-3" icon={<ShieldCheck className="size-6" />} title="All clear">
            No open reports.
          </EmptyState>
        ) : (
          <ul className="mt-3 space-y-3">
            {reports.map((r) => (
              <li key={r.id} className="surface space-y-3 p-4">
                <div className="text-xs text-muted-foreground">
                  {r.post_id ? "Post" : "Comment"} reported by @{r.reporter?.username ?? "deleted"} · {timeAgo(r.created_at)}
                </div>
                <p className="text-sm">
                  <span className="text-muted-foreground">Reason:</span> {r.reason}
                </p>
                <div className="rounded-lg bg-foreground/[0.04] p-3 text-sm">
                  {r.posts ? (
                    <Link href={`/community/${r.posts.id}`} className="font-medium hover:text-primary">
                      {r.posts.title}
                    </Link>
                  ) : r.comments ? (
                    <Link href={`/community/${r.comments.post_id}#c-${r.comments.id}`} className="line-clamp-3 hover:text-primary">
                      {r.comments.body}
                    </Link>
                  ) : (
                    <span className="text-muted-foreground">Content no longer exists</span>
                  )}
                </div>
                <ReportActions reportId={r.id} postId={r.posts?.id ?? null} commentId={r.comments?.id ?? null} commentPostId={r.comments?.post_id ?? null} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-medium">Removed posts</h2>
        {!removed?.length ? (
          <p className="mt-3 text-sm text-muted-foreground">None.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border rounded-2xl border border-border">
            {removed.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <Link href={`/community/${p.id}`} className="truncate hover:text-primary">
                  {p.title}
                </Link>
                <RestorePostButton postId={p.id} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </Container>
  );
}
