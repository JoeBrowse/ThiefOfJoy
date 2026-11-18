"use client";

import { useTransition } from "react";
import { Check, ShieldOff, X, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { deleteComment, moderateRemovePost, moderateRestorePost, resolveReport } from "@/app/actions/community";
import { Button } from "@/components/ui/button";

export function ReportActions({ reportId, postId, commentId, commentPostId }: { reportId: string; postId: string | null; commentId: string | null; commentPostId: string | null }) {
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<{ error?: string } | undefined>, msg: string) =>
    start(async () => {
      const res = await fn();
      if (res?.error) toast.error(res.error);
      else toast.success(msg);
    });

  return (
    <div className="flex flex-wrap gap-1.5">
      {postId && (
        <Button size="sm" variant="destructive" disabled={pending} onClick={() => run(() => moderateRemovePost(postId, "Reported content"), "Post removed")}>
          <ShieldOff /> Remove post
        </Button>
      )}
      {commentId && commentPostId && (
        <Button size="sm" variant="destructive" disabled={pending} onClick={() => run(() => deleteComment(commentId, commentPostId), "Comment removed")}>
          <ShieldOff /> Remove comment
        </Button>
      )}
      <Button size="sm" variant="outline" disabled={pending} onClick={() => run(() => resolveReport(reportId, "resolved"), "Marked resolved")}>
        <Check /> Resolve
      </Button>
      <Button size="sm" variant="ghost" disabled={pending} onClick={() => run(() => resolveReport(reportId, "dismissed"), "Report dismissed")}>
        <X /> Dismiss
      </Button>
    </div>
  );
}

export function RestorePostButton({ postId }: { postId: string }) {
  const [pending, start] = useTransition();
  return (
    <Button
      size="sm"
      variant="outline"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await moderateRestorePost(postId);
          if (res?.error) toast.error(res.error);
          else toast.success("Post restored");
        })
      }
    >
      <ShieldCheck /> Restore
    </Button>
  );
}
