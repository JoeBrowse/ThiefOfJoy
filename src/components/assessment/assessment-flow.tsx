"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertTriangle, ArrowLeft, ArrowRight, Check, CheckCircle2, Cloud, Loader2, Pencil, SkipForward, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { CATEGORY_BY_ID, type Category } from "@/lib/content/categories";
import { MANTRAS } from "@/lib/copy";
import { categoryAverage, fmtPct, fmtScore, lifeScore, toneForPct, toneForScore, toneText } from "@/lib/scoring";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScorePicker } from "@/components/score-picker";
import { CategoryBadge } from "@/components/category-icon";

export type Answers = Record<string, number | null>;

type Props = {
  mode: "full" | "category";
  categoryIds: string[];
  initialSessionId: string | null;
  initialAnswers: Answers;
  initialNotes: Record<string, string>;
  initialCategoryIndex?: number;
  lastAnswers: Record<string, number>;
};

type SaveState = "idle" | "saving" | "saved" | "error";

export function AssessmentFlow({
  mode,
  categoryIds,
  initialSessionId,
  initialAnswers,
  initialNotes,
  initialCategoryIndex = 0,
  lastAnswers,
}: Props) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const categories = useMemo(() => categoryIds.map((id) => CATEGORY_BY_ID[id]).filter(Boolean) as Category[], [categoryIds]);

  const [sessionId, setSessionId] = useState<string | null>(initialSessionId);
  const sessionPromise = useRef<Promise<string> | null>(null);
  const [answers, setAnswers] = useState<Answers>(initialAnswers);
  const [notes, setNotes] = useState<Record<string, string>>(initialNotes);
  const [catIndex, setCatIndex] = useState(Math.min(initialCategoryIndex, categories.length - 1));
  const [qIndex, setQIndex] = useState(() => firstUnanswered(categories[Math.min(initialCategoryIndex, categories.length - 1)], initialAnswers));
  const [phase, setPhase] = useState<"questions" | "review">("questions");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [submitting, setSubmitting] = useState(false);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const category = categories[catIndex];
  const isWrap = qIndex >= category.questions.length;
  const question = isWrap ? null : category.questions[qIndex];

  // ---- persistence -------------------------------------------------------
  const ensureSession = useCallback(async (): Promise<string> => {
    if (sessionId) return sessionId;
    if (!sessionPromise.current) {
      sessionPromise.current = (async () => {
        const { data, error } = await supabase
          .from("assessment_sessions")
          .insert({ kind: mode, category_id: mode === "category" ? categoryIds[0] : null })
          .select("id")
          .single();
        if (error || !data) {
          sessionPromise.current = null;
          throw error ?? new Error("Could not start assessment");
        }
        setSessionId(data.id);
        return data.id;
      })();
    }
    return sessionPromise.current;
  }, [sessionId, supabase, mode, categoryIds]);

  const saveAnswer = useCallback(
    async (questionId: string, score: number | null) => {
      setAnswers((a) => ({ ...a, [questionId]: score }));
      setSaveState("saving");
      try {
        const sid = await ensureSession();
        const { error } = await supabase
          .from("question_answers")
          .upsert({ session_id: sid, question_id: questionId, score }, { onConflict: "session_id,question_id" });
        if (error) throw error;
        setSaveState("saved");
      } catch (e) {
        setSaveState("error");
        toast.error("Couldn't save that answer. Check your connection and try again.", {
          description: e instanceof Error ? e.message : undefined,
        });
      }
    },
    [ensureSession, supabase],
  );

  const saveNote = useCallback(
    async (categoryId: string, note: string) => {
      const trimmed = note.trim();
      if ((initialNotes[categoryId] ?? "") === trimmed && !sessionId) return;
      setSaveState("saving");
      try {
        const sid = await ensureSession();
        const { error } = trimmed
          ? await supabase
              .from("session_category_notes")
              .upsert({ session_id: sid, category_id: categoryId, note: trimmed }, { onConflict: "session_id,category_id" })
          : await supabase.from("session_category_notes").delete().eq("session_id", sid).eq("category_id", categoryId);
        if (error) throw error;
        setSaveState("saved");
      } catch {
        setSaveState("error");
        toast.error("Couldn't save your reflection.");
      }
    },
    [ensureSession, supabase, initialNotes, sessionId],
  );

  const saveStep = useCallback(
    async (step: number) => {
      if (!sessionId || mode !== "full") return;
      await supabase.from("assessment_sessions").update({ current_step: step }).eq("id", sessionId);
    },
    [sessionId, supabase, mode],
  );

  // ---- navigation --------------------------------------------------------
  const goTo = useCallback(
    (c: number, q: number | "first-unanswered" | "wrap") => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
      const cat = categories[c];
      setCatIndex(c);
      setQIndex(q === "wrap" ? cat.questions.length : q === "first-unanswered" ? firstUnanswered(cat, answers) : q);
      setPhase("questions");
      if (c !== catIndex) void saveStep(c);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [categories, answers, catIndex, saveStep],
  );

  const next = useCallback(() => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    if (!isWrap) return setQIndex((q) => q + 1);
    if (catIndex < categories.length - 1) return goTo(catIndex + 1, "first-unanswered");
    setPhase("review");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [isWrap, catIndex, categories.length, goTo]);

  const prev = useCallback(() => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    if (phase === "review") return goTo(categories.length - 1, "wrap");
    if (qIndex > 0) return setQIndex((q) => q - 1);
    if (catIndex > 0) goTo(catIndex - 1, "wrap");
  }, [phase, qIndex, catIndex, categories.length, goTo]);

  const choose = useCallback(
    (score: number | null) => {
      if (!question) return;
      void saveAnswer(question.id, score);
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
      advanceTimer.current = setTimeout(() => setQIndex((q) => q + 1), score === null ? 120 : 320);
    },
    [question, saveAnswer],
  );

  // keyboard shortcuts: 1-9, 0 = 10, S = skip, arrows/enter to move
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement;
      if (t.closest("textarea, input, [contenteditable]") || e.metaKey || e.ctrlKey || e.altKey) return;
      if (phase !== "questions") return;
      if (question && /^[0-9]$/.test(e.key)) {
        e.preventDefault();
        choose(e.key === "0" ? 10 : Number(e.key));
      } else if (question && e.key.toLowerCase() === "s") {
        e.preventDefault();
        choose(null);
      } else if (t.getAttribute("role") === "radio") {
        return; // the score picker handles its own arrow keys
      } else if (e.key === "ArrowRight" && (isWrap || question!.id in answers)) {
        e.preventDefault();
        next();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        prev();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, question, isWrap, answers, choose, next, prev]);

  useEffect(() => () => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
  }, []);

  // ---- derived -----------------------------------------------------------
  const summary = useMemo(
    () =>
      categories.map((c) => {
        const scores = c.questions.map((q) => answers[q.id]);
        const answered = scores.filter((s) => typeof s === "number").length;
        const skipped = scores.filter((s) => s === null).length;
        return { category: c, avg: categoryAverage(scores), answered, skipped, total: c.questions.length };
      }),
    [categories, answers],
  );
  const scoredCount = summary.filter((s) => s.avg !== null).length;
  const preview = lifeScore(summary.map((s) => s.avg));
  const incomplete = summary.filter((s) => s.avg === null);

  async function submit() {
    if (!sessionId || scoredCount === 0) {
      toast.error("Answer at least one question first.");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.rpc("submit_assessment", { p_session: sessionId });
    if (error) {
      setSubmitting(false);
      toast.error("Couldn't submit your assessment", { description: error.message });
      return;
    }
    if (mode === "full") {
      router.push("/assessment/result");
    } else {
      toast.success(`${categories[0].name} updated`, { description: "Your Life Score has been recalculated." });
      router.push(`/categories/${categories[0].id}`);
    }
    router.refresh();
  }

  // ---- render ------------------------------------------------------------
  return (
    <div className="mx-auto w-full max-w-2xl px-4 pt-4 pb-16 sm:pt-8">
      {/* top bar */}
      <div className="flex items-center gap-3">
        <Link
          href={mode === "full" ? "/dashboard" : `/categories/${categories[0].id}`}
          className="inline-flex items-center gap-1.5 rounded-md text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <X className="size-4" aria-hidden /> {mode === "full" ? "Save & exit" : "Cancel"}
        </Link>
        <div className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground" aria-live="polite">
          {saveState === "saving" && (
            <>
              <Loader2 className="size-3.5 animate-spin" aria-hidden /> Saving
            </>
          )}
          {saveState === "saved" && (
            <>
              <Cloud className="size-3.5" aria-hidden /> Saved
            </>
          )}
          {saveState === "error" && <span className="text-destructive">Not saved</span>}
        </div>
      </div>

      {mode === "full" && (
        <div className="mt-5">
          <div className="flex gap-1" aria-hidden>
            {summary.map((s, i) => (
              <button
                key={s.category.id}
                type="button"
                tabIndex={-1}
                onClick={() => goTo(i, "first-unanswered")}
                title={s.category.name}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-colors",
                  phase === "questions" && i === catIndex
                    ? "bg-primary"
                    : s.answered + s.skipped === s.total
                      ? "bg-primary/45"
                      : s.answered + s.skipped > 0
                        ? "bg-primary/20"
                        : "bg-foreground/10",
                )}
              />
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {phase === "review" ? "Review" : `Category ${catIndex + 1} of ${categories.length}`} ·{" "}
            {summary.reduce((n, s) => n + s.answered + s.skipped, 0)} of {summary.reduce((n, s) => n + s.total, 0)} questions
          </p>
        </div>
      )}

      {phase === "questions" ? (
        <div key={`${category.id}-${qIndex}`} className="mt-8 animate-rise">
          {/* category header */}
          <div className="flex items-start gap-3">
            <CategoryBadge id={category.id} />
            <div className="min-w-0">
              <h1 className="text-lg font-semibold tracking-tight">{category.name}</h1>
              <p className="text-sm text-muted-foreground">{category.tagline}</p>
            </div>
          </div>
          {qIndex === 0 && !isWrap && (
            <p className="mt-4 rounded-xl border border-border bg-foreground/[0.02] px-4 py-3 text-sm text-muted-foreground">
              {category.description}
            </p>
          )}

          {/* within-category progress */}
          <div className="mt-6 flex items-center gap-1.5" role="group" aria-label="Questions in this category">
            {category.questions.map((q, i) => {
              const v = answers[q.id];
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setQIndex(i)}
                  aria-label={`Question ${i + 1}${typeof v === "number" ? `, answered ${v}` : v === null ? ", skipped" : ""}`}
                  aria-current={i === qIndex ? "step" : undefined}
                  className={cn(
                    "h-2 rounded-full transition-all outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                    i === qIndex ? "w-6 bg-primary" : "w-2",
                    i !== qIndex && (typeof v === "number" ? "bg-foreground/50" : v === null ? "bg-foreground/20" : "bg-foreground/10"),
                  )}
                />
              );
            })}
            <button
              type="button"
              onClick={() => setQIndex(category.questions.length)}
              aria-label="Category summary"
              className={cn("ml-1 grid size-4 place-items-center rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50", isWrap ? "text-primary" : "text-muted-foreground")}
            >
              <Check className="size-3" />
            </button>
            <span className="ml-auto text-xs text-muted-foreground tabular">
              {isWrap ? "Summary" : `Question ${qIndex + 1} of ${category.questions.length}`}
            </span>
          </div>

          {question ? (
            <section className="surface mt-4 p-5 sm:p-7" aria-labelledby={`q-${question.id}`}>
              <h2 id={`q-${question.id}`} className="text-xl leading-snug font-medium tracking-tight text-balance sm:text-2xl">
                {question.prompt}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{question.guidance}</p>

              <div className="mt-7">
                <ScorePicker
                  label={question.prompt}
                  value={answers[question.id] ?? null}
                  onChange={(n) => choose(n)}
                  low={question.low}
                  high={question.high}
                />
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => choose(null)} className={cn(answers[question.id] === null && "text-primary")}>
                  <SkipForward /> {answers[question.id] === null ? "Skipped" : "Skip this question"}
                </Button>
                {lastAnswers[question.id] !== undefined && (
                  <span className="text-xs text-muted-foreground">Last time you said {lastAnswers[question.id]}</span>
                )}
                <span className="ml-auto hidden text-[11px] text-muted-foreground sm:inline">Keys 1–9, 0 = 10, S = skip</span>
              </div>
            </section>
          ) : (
            <CategoryWrap
              category={category}
              avg={summary[catIndex].avg}
              answered={summary[catIndex].answered}
              skipped={summary[catIndex].skipped}
              total={category.questions.length}
              note={notes[category.id] ?? ""}
              onNoteChange={(v) => setNotes((n) => ({ ...n, [category.id]: v }))}
              onNoteBlur={(v) => saveNote(category.id, v)}
            />
          )}

          <div className="mt-6 flex items-center justify-between">
            <Button variant="ghost" onClick={prev} disabled={catIndex === 0 && qIndex === 0}>
              <ArrowLeft /> Back
            </Button>
            <Button onClick={next} variant={isWrap ? "default" : "outline"} disabled={!isWrap && !(question!.id in answers)}>
              {isWrap
                ? catIndex < categories.length - 1
                  ? `Next: ${categories[catIndex + 1].shortName}`
                  : "Review answers"
                : "Next"}
              <ArrowRight />
            </Button>
          </div>

          <p className="mt-10 text-center text-xs text-muted-foreground">{MANTRAS[catIndex % MANTRAS.length]}</p>
        </div>
      ) : (
        <div className="mt-8 animate-rise">
          <h1 className="text-2xl font-semibold tracking-tight">Review your answers</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Each category is the average of the questions you answered. Every category counts equally towards your Life
            Score, however many questions it has.
          </p>

          <div className="surface mt-6 flex items-center justify-between gap-4 p-5">
            <div>
              <div className="eyebrow">Estimated Life Score</div>
              <div className={cn("tabular mt-1 text-4xl font-semibold tracking-tight", toneText[toneForPct(preview)])}>
                {preview === null ? "—" : `${fmtPct(preview)}%`}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                Based on {scoredCount} of {categories.length} {categories.length === 1 ? "category" : "categories"}
              </div>
            </div>
            <Button size="lg" onClick={submit} disabled={submitting || scoredCount === 0}>
              {submitting ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
              {mode === "full" ? "Reveal my score" : "Save update"}
            </Button>
          </div>

          {mode === "full" && incomplete.length > 0 && (
            <div className="mt-4 flex gap-3 rounded-xl border border-score-mid/30 bg-score-mid/10 p-4 text-sm">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-score-mid" aria-hidden />
              <div>
                <p className="font-medium text-foreground">
                  {incomplete.length} {incomplete.length === 1 ? "category has" : "categories have"} no answers yet
                </p>
                <p className="mt-1 text-muted-foreground">
                  Missing categories are never counted as zero. Your score will be calculated from the {scoredCount} categories you
                  answered and marked <span className="text-foreground">incomplete</span>. Incomplete scores don&apos;t appear on the
                  leaderboard, so friends&apos; scores stay comparable. We recommend finishing them first.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {incomplete.map((s) => (
                    <Button
                      key={s.category.id}
                      variant="outline"
                      size="sm"
                      onClick={() => goTo(categories.indexOf(s.category), 0)}
                    >
                      {s.category.shortName}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <ul className="mt-6 divide-y divide-border overflow-hidden rounded-2xl border border-border">
            {summary.map((s, i) => (
              <li key={s.category.id}>
                <button
                  type="button"
                  onClick={() => goTo(i, 0)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors outline-none hover:bg-foreground/[0.03] focus-visible:bg-foreground/[0.05]"
                >
                  <CategoryBadge id={s.category.id} className="size-8" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{s.category.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {s.answered} answered{s.skipped ? ` · ${s.skipped} skipped` : ""}
                      {s.answered + s.skipped < s.total ? ` · ${s.total - s.answered - s.skipped} unanswered` : ""}
                    </div>
                  </div>
                  {s.avg === null ? (
                    <span className="rounded-full bg-score-mid/12 px-2 py-0.5 text-[11px] font-medium text-score-mid">Incomplete</span>
                  ) : (
                    <span className={cn("tabular text-sm font-semibold", toneText[toneForScore(s.avg)])}>{fmtScore(s.avg)}</span>
                  )}
                  <Pencil className="size-3.5 text-muted-foreground" aria-hidden />
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-6 flex items-center justify-between">
            <Button variant="ghost" onClick={prev}>
              <ArrowLeft /> Back
            </Button>
            <Button onClick={submit} disabled={submitting || scoredCount === 0}>
              {submitting && <Loader2 className="animate-spin" />} {mode === "full" ? "Reveal my score" : "Save update"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function CategoryWrap({
  category,
  avg,
  answered,
  skipped,
  total,
  note,
  onNoteChange,
  onNoteBlur,
}: {
  category: Category;
  avg: number | null;
  answered: number;
  skipped: number;
  total: number;
  note: string;
  onNoteChange: (v: string) => void;
  onNoteBlur: (v: string) => void;
}) {
  return (
    <section className="surface mt-4 p-5 sm:p-7" aria-label={`${category.name} summary`}>
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="eyebrow">{category.shortName} score</div>
          <div className={cn("tabular mt-1 text-5xl font-semibold tracking-tight", avg !== null && toneText[toneForScore(avg)])}>
            {avg === null ? "—" : fmtScore(avg)}
            <span className="text-xl text-muted-foreground"> / 10</span>
          </div>
        </div>
        <div className="text-right text-xs text-muted-foreground">
          {answered} of {total} answered
          {skipped > 0 && <div>{skipped} skipped (not counted)</div>}
        </div>
      </div>
      {avg === null && (
        <p className="mt-3 text-sm text-score-mid">
          No answers yet. This category will be marked incomplete rather than scored as zero.
        </p>
      )}
      <div className="mt-6 space-y-2">
        <label htmlFor={`note-${category.id}`} className="text-sm font-medium">
          Reflection <span className="font-normal text-muted-foreground">(optional, private)</span>
        </label>
        <Textarea
          id={`note-${category.id}`}
          value={note}
          maxLength={2000}
          onChange={(e) => onNoteChange(e.target.value)}
          onBlur={(e) => onNoteBlur(e.target.value)}
          placeholder="Anything behind these scores? What would move them up?"
          className="min-h-24"
        />
      </div>
    </section>
  );
}

function firstUnanswered(category: Category | undefined, answers: Answers) {
  if (!category) return 0;
  const i = category.questions.findIndex((q) => !(q.id in answers));
  return i === -1 ? category.questions.length : i;
}
