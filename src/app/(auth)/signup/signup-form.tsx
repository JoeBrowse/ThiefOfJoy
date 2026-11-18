"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MailCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormMessage } from "@/components/form-message";
import { USERNAME_HINT, normaliseUsername, validateUsername } from "@/lib/validation";

export function SignupForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email")).trim();
    const password = String(form.get("password"));
    const username = normaliseUsername(String(form.get("username")));
    const usernameError = validateUsername(username);
    if (usernameError) return setError(usernameError);
    if (password.length < 8) return setError("Use at least 8 characters for your password.");

    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { data: available, error: rpcError } = await supabase.rpc("username_available", { p_username: username });
    if (rpcError) {
      setLoading(false);
      return setError("Couldn't reach the server. Please try again.");
    }
    if (!available) {
      setLoading(false);
      return setError(`@${username} is taken. Try another username.`);
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/welcome`,
      },
    });
    setLoading(false);
    if (error) return setError(error.message);
    if (!data.session) {
      // Email confirmation is switched on in Supabase
      setSentTo(email);
      return;
    }
    router.replace("/welcome");
    router.refresh();
  }

  if (sentTo) {
    return (
      <div className="text-center">
        <MailCheck className="mx-auto size-10 text-primary" aria-hidden />
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">Check your inbox</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We sent a confirmation link to <span className="text-foreground">{sentTo}</span>. Click it to start your
          assessment.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">Score where you are in life, on your own terms.</p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="username">Username</Label>
          <div className="relative">
            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">@</span>
            <Input id="username" name="username" autoComplete="username" required minLength={3} maxLength={20} className="pl-7" autoFocus />
          </div>
          <p className="text-xs text-muted-foreground">{USERNAME_HINT} Shown on the leaderboard and in the community.</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} />
          <p className="text-xs text-muted-foreground">At least 8 characters.</p>
        </div>
        <FormMessage>{error}</FormMessage>
        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading && <Loader2 className="animate-spin" />} Create account
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="text-foreground underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
