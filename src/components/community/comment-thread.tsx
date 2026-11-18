"use client";

import Link from "next/link";
import { useState } from "react";
import { MessageSquareReply, Minus, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteComment } from "@/app/actions/community";
import { displayName, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Markdown } from "@/components/markdown";
import { ConfirmButton } from "@/components/confirm-button";
import { VoteButtons } from "./vote-buttons";
import { ReportDialog } from "./report-dialog";
import { CommentForm } from "./comment-form";

export type CommentNode = {
  id: string;
  body: string;
  score: number;
  created_at: string;
  author_id: string | null;
  is_deleted: boolean;
  is_removed: boolean;
  author: { username: string | null; display_name: string | null } | null;
  myVote: number;
  children: CommentNode[];
};

const MAX_INDENT = 6;

export function CommentThread({
  nodes,
  postId,
  userId,
  isAdmin,
  opId,
  depth = 0,
}: {
  nodes: CommentNode[];
  postId: string;
  userId: string;
  isAdmin: boolean;
  opId: string | null;
  depth?: number;
}) {
  return (
    <ul className={cn("space-y-1", depth > 0 && depth <= MAX_INDENT && "ml-3 border-l border-border pl-3 sm:ml-4 sm:pl-4")}>
      {nodes.map((n) => (
        <CommentItem key={n.id} node={n} postId={postId} userId={userId} isAdmin={isAdmin} opId={opId} depth={depth} />
      ))}
    </ul>
  );
}

function CommentItem({ node, postId, userId, isAdmin, opId, depth }: { node: CommentNode; postId: string; userId: string; isAdmin: boolean; opId: string | null; depth: number }) {
  const [replying, setReplying] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const gone = node.is_deleted || node.is_removed;
  const mine = node.author_id === userId;
  const count = countDescendants(node);

  return (
    <li id={`c-${node.id}`} className="pt-2">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Expand thread" : "Collapse thread"}
          className="grid size-5 place-items-center rounded hover:bg-foreground/10"
        >
          {collapsed ? <Plus className="size-3" /> : <Minus className="size-3" />}
        </button>
        {gone || !node.author?.username ? (
          <span>[deleted]</span>
        ) : (
          <Link href={`/u/${node.author.username}`} className="font-medium text-foreground/85 hover:text-foreground">
            {displayName(node.author)}
          </Link>
        )}
        {node.author_id && node.author_id === opId && !gone && <span className="rounded bg-primary/15 px-1.5 text-[10px] font-semibold text-primary">OP</span>}
        <span aria-hidden>·</span>
        <time dateTime={node.created_at}>{timeAgo(node.created_at)}</time>
        {collapsed && count > 0 && <span>({count} more)</span>}
      </div>

      {!collapsed && (
        <div className="pl-7">
          <div className={cn("mt-1", gone && "text-sm text-muted-foreground italic")}>{gone ? node.body : <Markdown className="text-sm">{node.body}</Markdown>}</div>
          <div className="mt-1 flex flex-wrap items-center gap-1">
            <VoteButtons kind="comment" id={node.id} userId={userId} score={node.score} myVote={node.myVote} orientation="horizontal" disabled={gone} />
            {!gone && (
              <Button variant="ghost" size="xs" className="text-muted-foreground" onClick={() => setReplying((r) => !r)}>
                <MessageSquareReply /> Reply
              </Button>
            )}
            {!gone && !mine && <ReportDialog commentId={node.id} />}
            {!gone && (mine || isAdmin) && (
              <ConfirmButton
                size="xs"
                variant="ghost"
                className="text-muted-foreground"
                title={mine ? "Delete your comment?" : "Remove this comment?"}
                description={mine ? "Your comment will be replaced with [deleted]. Replies stay visible." : "The comment will be replaced with [removed by moderator]."}
                confirmLabel={mine ? "Delete" : "Remove"}
                onConfirm={async () => {
                  const res = await deleteComment(node.id, postId);
                  if (res?.error) toast.error(res.error);
                  else toast.success(mine ? "Comment deleted" : "Comment removed");
                }}
              >
                <Trash2 /> {mine ? "Delete" : "Remove"}
              </ConfirmButton>
            )}
          </div>
          {replying && (
            <div className="mt-2 mb-3">
              <CommentForm postId={postId} parentId={node.id} autoFocus onDone={() => setReplying(false)} placeholder={`Reply to ${displayName(node.author)}`} />
            </div>
          )}
          {node.children.length > 0 && (
            <CommentThread nodes={node.children} postId={postId} userId={userId} isAdmin={isAdmin} opId={opId} depth={depth + 1} />
          )}
        </div>
      )}
    </li>
  );
}

function countDescendants(n: CommentNode): number {
  return n.children.reduce((sum, c) => sum + 1 + countDescendants(c), 0);
}
