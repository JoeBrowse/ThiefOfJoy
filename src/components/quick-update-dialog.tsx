"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, SlidersHorizontal } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { fmtPct, fmtScore, lifeScore, scoreAnchor, toneForScore, toneText } from "@/lib/scoring";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type Props = {
  categoryId: string;
  categoryName: string;
  current: number | null;
  /** all current category scores, used to preview the Life Score impact */
  allScores: Record<string, number>;
  currentLifeScore: number | null;
  variant?: "default" | "outline";
};

/** Adjust a category score directly (1.0–10.0) without re-answering every question. */
export function QuickUpdateDialog({ categoryId, categoryName, current, allScores, currentLifeScore, variant = "outline" }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(current ?? 5);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const preview = lifeScore(Object.values({ ...allScores, [categoryId]: value }));
  const delta = preview !== null && currentLifeScore !== null ? preview - currentLifeScore : null;

  async function save() {
    setSaving(true);
    const { data, error } = await createClient().rpc("quick_update_category", {
      p_category: categoryId,
      p_score: value,
      p_note: note.trim() || undefined,
    });
    setSaving(false);
    if (error) {
      toast.error("Couldn't update score", { description: error.message });
      return;
    }
    const res = data as { life_score: number | null } | null;
    toast.success(`${categoryName} updated to ${fmtScore(value)}`, {
      description: res?.life_score != null ? `Your Life Score is now ${fmtPct(res.life_score)}%` : undefined,
    });
    setOpen(false);
    setNote("");
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (o) setValue(current ?? 5); }}>
      <DialogTrigger render={<Button variant={variant} />}>
        <SlidersHorizontal /> Quick update
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update {categoryName}</DialogTitle>
          <DialogDescription>
            How satisfied are you with this area right now, overall? Adjust the score without re-answering every question.
          </DialogDescription>
        </DialogHeader>
        <div className="py-2">
          <div className="flex items-end justify-between">
            <div className={cn("tabular text-5xl font-semibold tracking-tight", toneText[toneForScore(value)])}>
              {fmtScore(value)}
              <span className="text-lg text-muted-foreground"> / 10</span>
            </div>
            <div className="pb-1.5 text-right text-xs text-muted-foreground">
              {current != null && <div>Was {fmtScore(current)}</div>}
              <div className="text-foreground/80">{scoreAnchor(Math.round(value))}</div>
            </div>
          </div>
          <Slider
            className="mt-6"
            min={1}
            max={10}
            step={0.1}
            value={[value]}
            onValueChange={(v) => setValue(Math.round((Array.isArray(v) ? v[0] : v) * 10) / 10)}
            aria-label={`${categoryName} score`}
          />
          <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
            <span>1 · Completely dissatisfied</span>
            <span>10 · Completely satisfied</span>
          </div>
          {preview !== null && (
            <p className="mt-4 rounded-lg bg-foreground/[0.04] px-3 py-2 text-xs text-muted-foreground">
              Life Score preview: <span className="tabular text-foreground">{fmtPct(preview)}%</span>
              {delta !== null && Math.abs(delta) >= 0.05 && (
                <span className={cn("tabular ml-1", delta > 0 ? "text-up" : "text-down")}>
                  ({delta > 0 ? "+" : ""}
                  {delta.toFixed(1)})
                </span>
              )}
            </p>
          )}
          <div className="mt-4 space-y-1.5">
            <Label htmlFor="qu-note">
              What changed? <span className="font-normal text-muted-foreground">(optional, private)</span>
            </Label>
            <Textarea id="qu-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={2000} placeholder="e.g. Started running three times a week" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving && <Loader2 className="animate-spin" />} Save score
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
