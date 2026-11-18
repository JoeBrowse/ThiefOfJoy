import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireOnboarded } from "@/lib/auth";
import { getCategory } from "@/lib/content/categories";
import { Container, PageHeader } from "@/components/page-header";
import { GoalForm } from "@/components/goals/goal-form";

export const metadata = { title: "New goal" };

export default async function NewGoalPage({ searchParams }: { searchParams: Promise<{ name?: string; category?: string }> }) {
  await requireOnboarded();
  const sp = await searchParams;
  return (
    <Container className="max-w-2xl">
      <Link href="/goals" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden /> Goals
      </Link>
      <PageHeader className="mt-4" title="New personal goal" description="Track anything else in your life you'd like to improve. Progress is personal." />
      <div className="surface mt-6 p-5 sm:p-7">
        <GoalForm mode="create" initial={{ name: sp.name?.slice(0, 80), category_id: getCategory(sp.category) ? sp.category : null }} />
      </div>
    </Container>
  );
}
