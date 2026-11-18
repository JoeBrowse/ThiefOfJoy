import { isSupabaseConfigured } from "@/lib/env";
import { Logo } from "@/components/logo";

export const metadata = { title: "Setup required" };

export default function SetupPage() {
  return (
    <main className="mx-auto max-w-xl px-4 py-20">
      <Logo />
      <h1 className="mt-10 text-2xl font-semibold">{isSupabaseConfigured ? "You're all set" : "Connect Supabase to continue"}</h1>
      <p className="mt-3 text-muted-foreground">
        Set <code className="rounded bg-foreground/10 px-1">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
        <code className="rounded bg-foreground/10 px-1">NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> in{" "}
        <code className="rounded bg-foreground/10 px-1">.env.local</code> (or your Vercel project settings), then restart. See the
        README for step-by-step instructions.
      </p>
    </main>
  );
}
