import { AssessmentFlow } from "@/components/assessment/assessment-flow";
import { requireOnboarded } from "@/lib/auth";
import { CATEGORIES } from "@/lib/content/categories";
import { loadAssessmentState } from "@/lib/data";

export const metadata = { title: "Assessment" };

export default async function AssessmentPage() {
  const { supabase, userId } = await requireOnboarded();
  const { session, answers, notes, lastAnswers } = await loadAssessmentState(supabase, userId, "full");

  return (
    <AssessmentFlow
      mode="full"
      categoryIds={CATEGORIES.map((c) => c.id)}
      initialSessionId={session?.id ?? null}
      initialAnswers={answers}
      initialNotes={notes}
      initialCategoryIndex={session?.current_step ?? 0}
      lastAnswers={lastAnswers}
    />
  );
}
