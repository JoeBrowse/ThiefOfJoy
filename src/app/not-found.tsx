import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { LogoMark } from "@/components/logo";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <LogoMark className="size-10" />
      <h1 className="mt-6 text-2xl font-semibold">Page not found</h1>
      <p className="mt-2 text-sm text-muted-foreground">That page doesn&apos;t exist, or you don&apos;t have access to it.</p>
      <Link href="/dashboard" className={buttonVariants({ className: "mt-6" })}>
        Back to dashboard
      </Link>
    </div>
  );
}
