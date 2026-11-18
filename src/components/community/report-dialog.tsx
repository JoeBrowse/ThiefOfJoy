"use client";

import { useState, useTransition } from "react";
import { Flag, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { reportContent } from "@/app/actions/community";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function ReportDialog({ postId, commentId }: { postId?: string; commentId?: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, start] = useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost" size="xs" className="text-muted-foreground" />}>
        <Flag /> Report
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report {postId ? "post" : "comment"}</DialogTitle>
          <DialogDescription>Let the moderators know what&apos;s wrong. Reports are only visible to admins.</DialogDescription>
        </DialogHeader>
        <Textarea value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} placeholder="e.g. Spam, harassment, personal information…" aria-label="Reason" />
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            disabled={pending || reason.trim().length < 3}
            onClick={() =>
              start(async () => {
                const res = await reportContent({ postId, commentId }, reason);
                if (res.error) return void toast.error(res.error);
                toast.success("Thanks, the moderators will take a look.");
                setReason("");
                setOpen(false);
              })
            }
          >
            {pending && <Loader2 className="animate-spin" />} Send report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
