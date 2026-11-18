"use client";

import { useState } from "react";
import { Archive, ArchiveRestore, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteGoal, setGoalStatus } from "@/app/actions/goals";
import { Button } from "@/components/ui/button";
import { ConfirmButton } from "@/components/confirm-button";
import { GoalForm } from "./goal-form";

type Goal = Parameters<typeof GoalForm>[0]["initial"] & { id: string; status: string };

export function GoalActions({ goal }: { goal: Goal }) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <div className="surface p-5 sm:p-7">
        <h2 className="mb-5 font-medium">Edit goal</h2>
        <GoalForm mode="edit" initial={goal} onDone={() => setEditing(false)} />
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
        <Pencil /> Edit
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={async () => {
          const next = goal.status === "archived" ? "active" : "archived";
          const res = await setGoalStatus(goal.id, next);
          if (res?.error) toast.error(res.error);
          else toast.success(next === "archived" ? "Goal archived" : "Goal restored");
        }}
      >
        {goal.status === "archived" ? (
          <>
            <ArchiveRestore /> Restore
          </>
        ) : (
          <>
            <Archive /> Archive
          </>
        )}
      </Button>
      <ConfirmButton
        size="sm"
        variant="ghost"
        title="Delete this goal?"
        description="This permanently deletes the goal and its full update history. This can't be undone."
        onConfirm={async () => {
          const res = await deleteGoal(goal.id);
          if (res?.error) toast.error(res.error);
        }}
      >
        <Trash2 /> Delete
      </ConfirmButton>
    </div>
  );
}
