"use client";

import { useActionState, useState } from "react";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { completeOnboarding } from "@/app/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormMessage } from "@/components/form-message";
import { LogoMark } from "@/components/logo";
import { USERNAME_HINT } from "@/lib/validation";
import { cn } from "@/lib/utils";

const EXAMPLES = [
  {
    who: "Very muscular, lean and athletic",
    area: "Physical Health",
    score: 6,
    why: "Wants to push further and isn't satisfied yet.",
  },
  {
    who: "Doesn't exercise much, carries extra weight",
    area: "Physical Health",
    score: 9,
    why: "Feels healthy, comfortable and happy with their lifestyle.",
  },
  { who: "Earns £100,000", area: "Financial Position", score: 5, why: "Has bigger expectations and goals." },
  { who: "Earns £30,000", area: "Financial Position", score: 9, why: "Feels secure, comfortable and content." },
];

export function WelcomeFlow({ needsUsername }: { needsUsername: boolean }) {
  const [step, setStep] = useState(0);
  const [state, action, pending] = useActionState(completeOnboarding, undefined);
  const steps = 3;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pt-8 pb-16 sm:pt-16">
      <div className="flex gap-1.5" aria-hidden>
        {Array.from({ length: steps }).map((_, i) => (
          <div key={i} className={cn("h-1 flex-1 rounded-full", i <= step ? "bg-primary" : "bg-foreground/10")} />
        ))}
      </div>

      {step === 0 && (
        <section key="0" className="mt-12 animate-rise">
          <LogoMark className="size-10" />
          <h1 className="mt-6 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">Welcome to Thief of Joy.</h1>
          <p className="mt-4 text-lg text-muted-foreground text-pretty">
            You&apos;re about to score how satisfied you are across 15 areas of life. Together they make your{" "}
            <span className="text-foreground">Life Score</span>, a single percentage you can track, update and improve over time.
          </p>
          <ul className="mt-8 space-y-3 text-sm">
            {[
              "One category at a time, about 6 questions each",
              "Every question is scored 1–10. Skip anything that doesn't apply",
              "Your answers save automatically, so you can stop and come back",
              "Your individual answers and notes are always private",
            ].map((t) => (
              <li key={t} className="flex gap-3">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                <span className="text-foreground/90">{t}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {step === 1 && (
        <section key="1" className="mt-12 animate-rise">
          <p className="eyebrow">The most important rule</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Score where you are in life, not where society thinks you should be.
          </h1>
          <p className="mt-4 text-muted-foreground">
            Each score is how satisfied <em>you</em> are with that part of your life, measured against your own expectations,
            needs and circumstances. Nothing is judged on income, weight, job title or relationship status.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {EXAMPLES.map((e) => (
              <div key={e.who} className="surface p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs text-muted-foreground">{e.area}</div>
                    <div className="mt-0.5 text-sm font-medium">{e.who}</div>
                  </div>
                  <div className="tabular text-2xl font-semibold text-primary">{e.score}</div>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{e.why}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm text-foreground/90">
            10 means you&apos;re genuinely satisfied. It doesn&apos;t mean you&apos;re perfect.
          </p>
        </section>
      )}

      {step === 2 && (
        <section key="2" className="mt-12 animate-rise">
          <p className="eyebrow">Ready when you are</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Your score. Your standards. Your life.</h1>
          <p className="mt-4 text-muted-foreground">
            Be honest rather than generous or harsh. There are no right answers, and nobody sees your individual responses.
            It takes around 10–15 minutes.
          </p>
          <form action={action} className="mt-8 space-y-4">
            {needsUsername && (
              <div className="space-y-1.5">
                <Label htmlFor="username">Choose a username</Label>
                <div className="relative">
                  <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">@</span>
                  <Input id="username" name="username" required minLength={3} maxLength={20} className="pl-7" autoFocus />
                </div>
                <p className="text-xs text-muted-foreground">{USERNAME_HINT}</p>
              </div>
            )}
            <FormMessage>{state?.error}</FormMessage>
            <Button type="submit" size="lg" disabled={pending}>
              {pending && <Loader2 className="animate-spin" />} Start my assessment <ArrowRight />
            </Button>
          </form>
        </section>
      )}

      {step < 2 ? (
        <div className="mt-12 flex items-center justify-between">
          <Button variant="ghost" onClick={() => setStep((s) => s - 1)} disabled={step === 0}>
            <ArrowLeft /> Back
          </Button>
          <Button size="lg" onClick={() => setStep((s) => s + 1)}>
            Continue <ArrowRight />
          </Button>
        </div>
      ) : (
        <div className="mt-8">
          <Button variant="ghost" onClick={() => setStep(1)}>
            <ArrowLeft /> Back
          </Button>
        </div>
      )}
    </div>
  );
}
