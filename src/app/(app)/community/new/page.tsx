import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireOnboarded } from "@/lib/auth";
import { getCategory } from "@/lib/content/categories";
import { Container, PageHeader } from "@/components/page-header";
import { PostForm } from "@/components/community/post-form";

export const metadata = { title: "New thread" };

export default async function NewPostPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  await requireOnboarded();
  const c = getCategory((await searchParams).category);
  return (
    <Container className="max-w-2xl">
      <Link href="/community" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden /> Community
      </Link>
      <PageHeader className="mt-4" title="Start a thread" />
      <div className="surface mt-6 p-5 sm:p-7">
        <PostForm defaultCategory={c?.id} />
      </div>
    </Container>
  );
}
