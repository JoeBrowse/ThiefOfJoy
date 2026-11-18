"use client";

import { useActionState, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateProfile } from "@/app/actions/profile";
import { USERNAME_HINT } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { FormMessage } from "@/components/form-message";

type Profile = {
  username: string | null;
  display_name: string | null;
  bio: string | null;
  show_on_leaderboard: boolean;
  public_category_scores: boolean;
  public_goals: boolean;
};

export function ProfileForm({ profile }: { profile: Profile }) {
  const [state, action, pending] = useActionState(updateProfile, undefined);
  const [toggles, setToggles] = useState({
    show_on_leaderboard: profile.show_on_leaderboard,
    public_category_scores: profile.public_category_scores,
    public_goals: profile.public_goals,
  });

  useEffect(() => {
    if (state?.ok) toast.success("Settings saved");
  }, [state]);

  return (
    <form action={action} className="space-y-8">
      <section className="surface space-y-5 p-5 sm:p-6">
        <h2 className="font-medium">Profile</h2>
        <div className="space-y-1.5">
          <Label htmlFor="username">Username</Label>
          <div className="relative">
            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">@</span>
            <Input id="username" name="username" defaultValue={profile.username ?? ""} required minLength={3} maxLength={20} className="pl-7" />
          </div>
          <p className="text-xs text-muted-foreground">{USERNAME_HINT}</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="display_name">
            Display name <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Input id="display_name" name="display_name" defaultValue={profile.display_name ?? ""} maxLength={50} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="bio">
            Bio <span className="font-normal text-muted-foreground">(optional, public)</span>
          </Label>
          <Textarea id="bio" name="bio" defaultValue={profile.bio ?? ""} maxLength={280} placeholder="A line about you" />
        </div>
      </section>

      <section className="surface space-y-5 p-5 sm:p-6">
        <div>
          <h2 className="font-medium">Privacy</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Your individual answers, reflections and goal notes are always private. These settings control what other members can see.
          </p>
        </div>
        {(
          [
            ["show_on_leaderboard", "Appear on the leaderboard", "Shows your username, Life Score and rank movement to other members. Turning this off also hides your score from your profile."],
            ["public_category_scores", "Show category scores on my profile", "Lets members see your 15 category scores (never your individual answers or notes)."],
            ["public_goals", "Show shareable goals on my profile", "Only goals you've marked as shareable appear. Update notes stay private."],
          ] as const
        ).map(([key, title, body]) => (
          <div key={key} className="flex items-start justify-between gap-4">
            <div>
              <label htmlFor={key} className="text-sm font-medium">
                {title}
              </label>
              <p className="mt-0.5 text-xs text-muted-foreground">{body}</p>
            </div>
            <Switch id={key} checked={toggles[key]} onCheckedChange={(v) => setToggles((t) => ({ ...t, [key]: Boolean(v) }))} />
            {toggles[key] && <input type="hidden" name={key} value="on" />}
          </div>
        ))}
      </section>

      <FormMessage>{state?.error}</FormMessage>
      <Button type="submit" size="lg" disabled={pending}>
        {pending && <Loader2 className="animate-spin" />} Save settings
      </Button>
    </form>
  );
}
