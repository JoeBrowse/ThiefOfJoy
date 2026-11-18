"use client";

import { Trash2, ShieldOff, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { deletePost, moderateRemovePost, moderateRestorePost } from "@/app/actions/community";
import { Button } from "@/components/ui/button";
import { ConfirmButton } from "@/components/confirm-button";
import { ReportDialog } from "./report-dialog";

export function PostActions({ postId, mine, isAdmin, isRemoved }: { postId: string; mine: boolean; isAdmin: boolean; isRemoved: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      {!mine && <ReportDialog postId={postId} />}
      {mine && (
        <ConfirmButton
          size="xs"
          variant="ghost"
          className="text-muted-foreground"
          title="Delete this thread?"
          description="This permanently deletes your post and all of its comments. This can't be undone."
          onConfirm={async () => {
            const res = await deletePost(postId);
            if (res?.error) toast.error(res.error);
          }}
        >
          <Trash2 /> Delete
        </ConfirmButton>
      )}
      {isAdmin && !mine && !isRemoved && (
        <ConfirmButton
          size="xs"
          variant="ghost"
          className="text-muted-foreground"
          title="Remove this thread?"
          description="The post will be hidden from everyone except its author and admins. You can restore it later."
          confirmLabel="Remove"
          onConfirm={async () => {
            const res = await moderateRemovePost(postId);
            if (res?.error) toast.error(res.error);
            else toast.success("Post removed");
          }}
        >
          <ShieldOff /> Remove
        </ConfirmButton>
      )}
      {isAdmin && isRemoved && (
        <Button
          size="xs"
          variant="ghost"
          onClick={async () => {
            const res = await moderateRestorePost(postId);
            if (res?.error) toast.error(res.error);
            else toast.success("Post restored");
          }}
        >
          <ShieldCheck /> Restore
        </Button>
      )}
    </div>
  );
}
