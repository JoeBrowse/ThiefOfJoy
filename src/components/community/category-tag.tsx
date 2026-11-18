import Link from "next/link";
import { getCategory } from "@/lib/content/categories";
import { CategoryIcon } from "@/components/category-icon";
import { cn } from "@/lib/utils";

export function CategoryTag({ categoryId, custom, className }: { categoryId: string | null; custom: string | null; className?: string }) {
  const c = getCategory(categoryId);
  const href = c ? `/community?category=${c.id}` : "/community?category=other";
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-foreground/[0.06] px-2 py-0.5 text-[11px] font-medium text-foreground/80 transition-colors hover:bg-foreground/10",
        className,
      )}
    >
      <CategoryIcon id={categoryId} className="size-3" />
      {c ? c.shortName : custom}
    </Link>
  );
}
