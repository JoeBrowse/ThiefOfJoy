"use client";

import { useActionState, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createGoal, updateGoal } from "@/app/actions/goals";
import { CATEGORIES } from "@/lib/content/categories";
import { GOAL_EXAMPLES } from "@/lib/goals";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { NativeSelect } from "@/components/ui/native-select";
import { FormMessage } from "@/components/form-message";
import { ScorePicker } from "@/components/score-picker";

type GoalValues = {
  id?: string;
  name?: string;
  description?: string | null;
  start_score?: number;
  target_score?: number;
  target_date?: string | null;
  category_id?: string | null;
  counts_toward_category?: boolean;
  is_public?: boolean;
};

export function GoalForm({ initial = {}, mode, onDone }: { initial?: GoalValues; mode: "create" | "edit"; onDone?: () => void }) {
  const [state, action, pending] = useActionState(mode === "create" ? createGoal : updateGoal, undefined);
  const [name, setName] = useState(initial.name ?? "");
  const [start, setStart] = useState<number | null>(initial.start_score ?? null);
  const [target, setTarget] = useState<number | null>(initial.target_score ?? null);
  const [category, setCategory] = useState(initial.category_id ?? "");
  const [counts, setCounts] = useState(initial.counts_toward_category ?? false);
  const [isPublic, setIsPublic] = useState(initial.is_public ?? false);

  useEffect(() => {
    if (state?.ok) {
      toast.success("Goal saved");
      onDone?.();
    }
  }, [state, onDone]);

  return (
    <form action={action} className="space-y-6">
      {initial.id && <input type="hidden" name="id" value={initial.id} />}

      <div className="space-y-1.5">
        <Label htmlFor="name">What do you want to track or work towards?</Label>
        <Input
          id="name"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={80}
          required
          placeholder="e.g. Fitness"
          autoFocus={mode === "create" && !initial.name}
        />
        {mode === "create" && (
          <div className="flex flex-wrap gap-1.5 pt-1.5">
            {GOAL_EXAMPLES.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setName(g)}
                className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
              >
                {g}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">
          Description <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={initial.description ?? ""}
          maxLength={1000}
          placeholder="What does success feel like? e.g. “I want to feel healthier, fitter and more comfortable with my body.”"
        />
      </div>

      <div className="rounded-xl border border-border bg-foreground/[0.02] p-4 text-sm text-muted-foreground">
        Goals use the same <span className="text-foreground">1–10 satisfaction</span> scale: how satisfied are you with where you are
        and the progress you&apos;re making? Effort and consistency count, so your score can rise before the outcome does.
      </div>

      {mode === "create" && (
        <div className="space-y-2">
          <Label>Where are you now?</Label>
          <ScorePicker label="Starting score" value={start} onChange={setStart} size="sm" />
          <input type="hidden" name="start_score" value={start ?? ""} />
        </div>
      )}

      <div className="space-y-2">
        <Label>Where do you want to be?</Label>
        <ScorePicker label="Target score" value={target} onChange={setTarget} size="sm" />
        <input type="hidden" name="target_score" value={target ?? ""} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="target_date">
            Target date <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Input id="target_date" name="target_date" type="date" defaultValue={initial.target_date ?? ""} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="category_id">
            Life category <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <NativeSelect
            id="category_id"
            name="category_id"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              if (!e.target.value) setCounts(false);
            }}
          >
            <option value="">None</option>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </NativeSelect>
        </div>
      </div>

      <div className="space-y-4 rounded-xl border border-border p-4">
        <ToggleRow
          id="counts_toward_category"
          checked={counts}
          onChange={setCounts}
          disabled={!category}
          title="Count towards this category's score"
          body={
            category
              ? "Off by default. When on, this goal counts as one extra question in that category, so it can affect your Life Score."
              : "Pick a category first. Goals never affect your Life Score unless you link them."
          }
        />
        <ToggleRow
          id="is_public"
          checked={isPublic}
          onChange={setIsPublic}
          title="Shareable"
          body="Show this goal (name, scores and progress) on your public profile, if you've turned on goals in privacy settings. Update notes always stay private."
        />
      </div>

      <FormMessage>{state?.error}</FormMessage>
      <div className="flex gap-2">
        <Button type="submit" size="lg" disabled={pending}>
          {pending && <Loader2 className="animate-spin" />} {mode === "create" ? "Create goal" : "Save changes"}
        </Button>
        {onDone && (
          <Button type="button" variant="ghost" size="lg" onClick={onDone}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

function ToggleRow({
  id,
  checked,
  onChange,
  title,
  body,
  disabled,
}: {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  title: string;
  body: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <label htmlFor={id} className="text-sm font-medium">
          {title}
        </label>
        <p className="mt-0.5 text-xs text-muted-foreground">{body}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={(v) => onChange(Boolean(v))} disabled={disabled} />
      {checked && !disabled && <input type="hidden" name={id} value="on" />}
    </div>
  );
}
