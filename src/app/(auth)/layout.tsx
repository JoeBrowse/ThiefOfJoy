import Link from "next/link";
import { Logo } from "@/components/logo";
import { MANTRAS } from "@/lib/copy";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col">
      <header className="mx-auto w-full max-w-6xl px-4 py-5">
        <Link href="/" className="inline-block rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
          <Logo />
        </Link>
      </header>
      <main className="flex flex-1 items-start justify-center px-4 pt-8 pb-16 sm:pt-16">
        <div className="w-full max-w-sm animate-rise">{children}</div>
      </main>
      <footer className="pb-8 text-center text-xs text-muted-foreground">{MANTRAS[0]}</footer>
    </div>
  );
}
