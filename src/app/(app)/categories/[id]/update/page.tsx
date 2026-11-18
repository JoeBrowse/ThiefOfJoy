import { notFound } from "next/navigation";
import { AssessmentFlow } from "@/components/assessment/assessment-flow";
import { requireOnboarded } from "@/lib/auth";
import { getCategory } from "@/lib/content/categories";
import { loadAssessmentState } from "@/lib/data";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const c = getCategory((await params).id);
  return { title: c ? `Update ${c.name}` : "Update" };
}

export default async function UpdateCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const category = getCategory(id);
  if (!category) notFound();
  const { supabase, userId } = await requireOnboarded();
  const { session, answers, notes, lastAnswers } = await loadAssessmentState(supabase, userId, "category", id);

  return (
    <AssessmentFlow
      mode="category"
      categoryIds={[id]}
      initialSessionId={session?.id ?? null}
      initialAnswers={answers}
      initialNotes={notes}
      lastAnswers={lastAnswers}
    />
  );
}
