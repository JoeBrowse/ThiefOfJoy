import Link from "next/link";
import { ArrowRight, LineChart, ShieldCheck, Trophy, MessagesSquare, Target } from "lucide-react";
import { Logo } from "@/components/logo";
import { ScoreGauge } from "@/components/score-gauge";
import { buttonVariants } from "@/components/ui/button";
import { CATEGORIES } from "@/lib/content/categories";
import { CategoryIcon } from "@/components/category-icon";
import { cn } from "@/lib/utils";

export default function Landing() {
  return (
    <div className="flex min-h-full flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5">
        <Logo />
        <div className="flex items-center gap-2">
          <Link href="/login" className={buttonVariants({ variant: "ghost" })}>
            Sign in
          </Link>
          <Link href="/signup" className={buttonVariants()}>
            Get started
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-10 pb-20 md:grid-cols-[1.1fr_1fr] md:pt-20">
          <div className="animate-rise">
            <p className="eyebrow mb-5">Comparison is the thief of joy. So set your own bar.</p>
            <h1 className="text-4xl leading-[1.05] font-semibold tracking-tight text-balance sm:text-6xl">
              Your score. <br className="hidden sm:block" />
              Your standards. <br />
              <span className="text-primary">Your life.</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg text-muted-foreground text-pretty">
              Rate how satisfied you are across 15 areas of life, from home and health to freedom and the future.
              Get a single Life Score, track it over time, and work on what matters to you.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/signup" className={buttonVariants({ size: "lg" })}>
                Take the assessment <ArrowRight />
              </Link>
              <Link href="/login" className={buttonVariants({ size: "lg", variant: "outline" })}>
                I have an account
              </Link>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">Takes about 10–15 minutes. Free, private pilot.</p>
          </div>

          <div className="surface relative mx-auto w-full max-w-md p-6 sm:p-8" aria-label="Example dashboard (illustration)">
            <div className="flex items-center justify-between">
              <span className="eyebrow">Example</span>
              <span className="rounded-full bg-up/12 px-2 py-0.5 text-xs font-medium text-up">+3.4 this month</span>
            </div>
            <div className="mt-2 flex justify-center">
              <ScoreGauge value={73.7} size={240} sublabel="Your current life satisfaction" />
            </div>
            <div className="mt-2 space-y-2.5">
              {[
                ["Relationships and Family", 8.5],
                ["Physical Health", 7.0],
                ["Financial Position", 6.0],
              ].map(([name, s]) => (
                <div key={name as string} className="flex items-center gap-3 text-sm">
                  <span className="flex-1 truncate text-muted-foreground">{name}</span>
                  <div className="h-1.5 w-24 overflow-hidden rounded-full bg-foreground/10">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${Number(s) * 10}%` }} />
                  </div>
                  <span className="tabular w-8 text-right">{Number(s).toFixed(1)}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-border bg-card/40">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 md:grid-cols-2">
            <div>
              <p className="eyebrow mb-3">The one rule</p>
              <h2 className="text-3xl font-semibold tracking-tight text-balance">
                Score where you are in life, not where society thinks you should be.
              </h2>
            </div>
            <div className="space-y-4 text-muted-foreground">
              <p>
                Someone earning £30,000 might score their finances 9/10 because they feel secure and content.
                Someone earning £100,000 might score 5/10 because of their own ambitions. Both are right.
              </p>
              <p>
                Nothing here uses your salary, weight, job title or relationship status. You are the only authority on
                your score.{" "}
                <span className="text-foreground">10 means you&apos;re genuinely satisfied. It doesn&apos;t mean you&apos;re perfect.</span>
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16">
          <p className="eyebrow mb-3">15 areas of life</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {CATEGORIES.map((c) => (
              <div key={c.id} className="flex items-center gap-2.5 rounded-xl border border-border px-3 py-2.5 text-sm">
                <CategoryIcon id={c.id} className="text-primary" />
                <span className="truncate">{c.name}</span>
              </div>
            ))}
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: LineChart, title: "Track over time", body: "Update any category whenever life changes. Every change is saved to your history." },
              { icon: Target, title: "Personal goals", body: "Track anything else: fitness, discipline, saving, confidence. Effort and progress count, not just outcomes." },
              { icon: Trophy, title: "Friendly leaderboard", body: "Opt in to see how your satisfaction moves against friends. Overtakes included." },
              { icon: MessagesSquare, title: "Community", body: "Threaded discussions for every area of life. Share what's working." },
            ].map((f) => (
              <div key={f.title}>
                <f.icon className="size-5 text-primary" aria-hidden />
                <h3 className="mt-3 font-medium">{f.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{f.body}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span className="inline-flex items-center gap-2">
            <ShieldCheck className="size-4" aria-hidden /> Your answers and notes are private by default.
          </span>
          <span className={cn("text-xs")}>Progress is personal.</span>
        </div>
      </footer>
    </div>
  );
}
