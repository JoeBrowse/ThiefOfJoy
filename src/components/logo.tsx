import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-7", className)} aria-hidden="true">
      <circle cx="16" cy="16" r="12" fill="none" stroke="currentColor" strokeOpacity="0.15" strokeWidth="3.5" strokeLinecap="round" strokeDasharray="56.5 75.4" transform="rotate(135 16 16)" />
      <circle cx="16" cy="16" r="12" fill="none" stroke="var(--primary)" strokeWidth="3.5" strokeLinecap="round" strokeDasharray="40 75.4" transform="rotate(135 16 16)" />
      <circle cx="16" cy="16" r="2.5" fill="var(--primary)" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-semibold tracking-tight", className)}>
      <LogoMark />
      <span>Thief of Joy</span>
    </span>
  );
}
