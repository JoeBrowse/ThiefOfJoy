"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { logGoalUpdate } from "@/app/actions/goals";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FormMessage } from "@/components/form-message";
import { ScorePicker } from "@/components/score-picker";

export function GoalUpdateForm({ goalId, current }: { goalId: string; current: number }) {
  const [state, action, pending] = useActionState(logGoalUpdate, undefined);
  const [score, setScore] = useState<number | null>(current);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) {
      toast.success("Progress logged");
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form ref={formRef} action={action} className="space-y-4">
      <input type="hidden" name="goal_id" value={goalId} />
      <div className="space-y-2">
        <Label>How satisfied are you with your progress now?</Label>
        <ScorePicker label="New score" value={score} onChange={setScore} size="sm" />
        <input type="hidden" name="new_score" value={score ?? ""} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="goal-note">
          Note <span className="font-normal text-muted-foreground">(optional, private)</span>
        </Label>
        <Textarea id="goal-note" name="note" maxLength={1000} placeholder="What changed? e.g. Went to the gym 4 times this week" />
      </div>
      <FormMessage>{state?.error}</FormMessage>
      <Button type="submit" disabled={pending || score === null}>
        {pending && <Loader2 className="animate-spin" />} Log update
      </Button>
    </form>
  );
}
