import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

type SB = SupabaseClient<Database>;

export async function getStats(supabase: SB, userId: string) {
  const { data } = await supabase.from("user_stats").select("*").eq("user_id", userId).maybeSingle();
  return data;
}

export async function getCategoryScores(supabase: SB, userId: string) {
  const { data } = await supabase.from("category_scores").select("*").eq("user_id", userId);
  return Object.fromEntries((data ?? []).map((r) => [r.category_id, r]));
}

export async function getLifeScoreHistory(supabase: SB, userId: string) {
  const { data } = await supabase
    .from("life_score_history")
    .select("life_score, is_complete, created_at, source, category_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(500);
  return data ?? [];
}

export async function getRecentChanges(supabase: SB, userId: string, limit = 10) {
  const { data } = await supabase
    .from("category_score_history")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

/** Loads everything the assessment flow needs to resume a session. */
export async function loadAssessmentState(supabase: SB, userId: string, kind: "full" | "category", categoryId?: string) {
  let q = supabase
    .from("assessment_sessions")
    .select("id, current_step")
    .eq("user_id", userId)
    .eq("status", "in_progress")
    .eq("kind", kind)
    .order("updated_at", { ascending: false })
    .limit(1);
  if (categoryId) q = q.eq("category_id", categoryId);
  const { data: sessions } = await q;
  const session = sessions?.[0] ?? null;

  const answers: Record<string, number | null> = {};
  const notes: Record<string, string> = {};
  if (session) {
    const [{ data: a }, { data: n }] = await Promise.all([
      supabase.from("question_answers").select("question_id, score").eq("session_id", session.id),
      supabase.from("session_category_notes").select("category_id, note").eq("session_id", session.id),
    ]);
    a?.forEach((r) => (answers[r.question_id] = r.score));
    n?.forEach((r) => (notes[r.category_id] = r.note));
  }

  // most recent submitted answer per question, shown as "last time you said…"
  const { data: past } = await supabase
    .from("question_answers")
    .select("question_id, score, assessment_sessions!inner(status, completed_at)")
    .eq("user_id", userId)
    .eq("assessment_sessions.status", "completed")
    .not("score", "is", null)
    .order("updated_at", { ascending: false })
    .limit(2000);
  const lastAnswers: Record<string, number> = {};
  past?.forEach((r) => {
    if (!(r.question_id in lastAnswers) && r.score !== null) lastAnswers[r.question_id] = r.score;
  });

  return { session, answers, notes, lastAnswers };
}
