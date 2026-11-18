import { AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function FormMessage({ type = "error", children, className }: { type?: "error" | "success"; children: React.ReactNode; className?: string }) {
  if (!children) return null;
  const Icon = type === "error" ? AlertCircle : CheckCircle2;
  return (
    <div
      role={type === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2 rounded-lg border px-3 py-2.5 text-sm",
        type === "error" ? "border-destructive/30 bg-destructive/10 text-destructive" : "border-up/30 bg-up/10 text-up",
        className,
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div>{children}</div>
    </div>
  );
}
