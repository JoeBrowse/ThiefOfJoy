"use client";

import { useState } from "react";
import { ArrowBigDown, ArrowBigUp } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Props = {
  kind: "post" | "comment";
  id: string;
  userId: string;
  score: number;
  myVote: number; // -1, 0, 1
  orientation?: "vertical" | "horizontal";
  disabled?: boolean;
};

/** Optimistic up/down voting. Clicking your current vote again removes it. */
export function VoteButtons({ kind, id, userId, score, myVote, orientation = "vertical", disabled }: Props) {
  const [vote, setVote] = useState(myVote);
  const [base] = useState(score - myVote);
  const [busy, setBusy] = useState(false);

  async function cast(value: 1 | -1) {
    if (busy || disabled) return;
    const next = vote === value ? 0 : value;
    const prev = vote;
    setVote(next);
    setBusy(true);
    const supabase = createClient();
    const { error } =
      next === 0
        ? kind === "post"
          ? await supabase.from("post_votes").delete().eq("post_id", id).eq("user_id", userId)
          : await supabase.from("comment_votes").delete().eq("comment_id", id).eq("user_id", userId)
        : kind === "post"
          ? await supabase.from("post_votes").upsert({ post_id: id, user_id: userId, value: next }, { onConflict: "post_id,user_id" })
          : await supabase.from("comment_votes").upsert({ comment_id: id, user_id: userId, value: next }, { onConflict: "comment_id,user_id" });
    setBusy(false);
    if (error) {
      setVote(prev);
      toast.error("Couldn't save your vote");
    }
  }

  const total = base + vote;
  return (
    <div className={cn("flex items-center", orientation === "vertical" ? "flex-col gap-0.5" : "gap-1")}>
      <button
        type="button"
        onClick={() => cast(1)}
        aria-label="Upvote"
        aria-pressed={vote === 1}
        disabled={disabled}
        className={cn("rounded-md p-1 text-muted-foreground outline-none transition-colors hover:bg-up/10 hover:text-up focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-40", vote === 1 && "text-up")}
      >
        <ArrowBigUp className={cn("size-5", vote === 1 && "fill-current")} />
      </button>
      <span className={cn("tabular min-w-5 text-center text-sm font-medium", vote === 1 && "text-up", vote === -1 && "text-down")} aria-label={`Score ${total}`}>
        {total}
      </span>
      <button
        type="button"
        onClick={() => cast(-1)}
        aria-label="Downvote"
        aria-pressed={vote === -1}
        disabled={disabled}
        className={cn("rounded-md p-1 text-muted-foreground outline-none transition-colors hover:bg-down/10 hover:text-down focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-40", vote === -1 && "text-down")}
      >
        <ArrowBigDown className={cn("size-5", vote === -1 && "fill-current")} />
      </button>
    </div>
  );
}
