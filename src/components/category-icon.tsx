import {
  Home,
  Briefcase,
  Wallet,
  HeartPulse,
  Brain,
  Users,
  Clock,
  GraduationCap,
  MapPin,
  Feather,
  ShieldCheck,
  Sparkles,
  Compass,
  Trees,
  TrendingUp,
  Hash,
  type LucideIcon,
} from "lucide-react";
import { getCategory } from "@/lib/content/categories";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  Home,
  Briefcase,
  Wallet,
  HeartPulse,
  Brain,
  Users,
  Clock,
  GraduationCap,
  MapPin,
  Feather,
  ShieldCheck,
  Sparkles,
  Compass,
  Trees,
  TrendingUp,
};

export function CategoryIcon({ id, className }: { id: string | null | undefined; className?: string }) {
  const Icon = ICONS[getCategory(id)?.icon ?? ""] ?? Hash;
  return <Icon className={cn("size-4", className)} aria-hidden />;
}

export function CategoryBadge({ id, className }: { id: string | null | undefined; className?: string }) {
  return (
    <span className={cn("grid size-9 shrink-0 place-items-center rounded-xl bg-foreground/[0.05] text-foreground/80 ring-1 ring-foreground/[0.06]", className)}>
      <CategoryIcon id={id} />
    </span>
  );
}
