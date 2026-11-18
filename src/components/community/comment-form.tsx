"use client";

import { useActionState, useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { createComment } from "@/app/actions/community";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FormMessage } from "@/components/form-message";

export function CommentForm({
  postId,
  parentId,
  onDone,
  autoFocus,
  placeholder = "Add to the discussion",
}: {
  postId: string;
  parentId?: string;
  onDone?: () => void;
  autoFocus?: boolean;
  placeholder?: string;
}) {
  const [state, action, pending] = useActionState(createComment, undefined);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) {
      ref.current?.reset();
      onDone?.();
    }
  }, [state, onDone]);

  return (
    <form ref={ref} action={action} className="space-y-2">
      <input type="hidden" name="post_id" value={postId} />
      {parentId && <input type="hidden" name="parent_id" value={parentId} />}
      <Textarea name="body" required maxLength={10000} placeholder={placeholder} autoFocus={autoFocus} className="min-h-20" aria-label={parentId ? "Reply" : "Comment"} />
      <FormMessage>{state?.error}</FormMessage>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending && <Loader2 className="animate-spin" />} {parentId ? "Reply" : "Comment"}
        </Button>
        {onDone && parentId && (
          <Button type="button" size="sm" variant="ghost" onClick={onDone}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
