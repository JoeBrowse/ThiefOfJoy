"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { normaliseUsername, validateUsername } from "@/lib/validation";

export type ActionState = { error?: string; ok?: boolean } | undefined;

async function currentUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub as string | undefined;
  if (!userId) redirect("/login");
  return { supabase, userId };
}

export async function completeOnboarding(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, userId } = await currentUser();
  const update: { onboarded_at: string; username?: string } = { onboarded_at: new Date().toISOString() };

  const raw = formData.get("username");
  if (typeof raw === "string") {
    const username = normaliseUsername(raw);
    const err = validateUsername(username);
    if (err) return { error: err };
    const { data: available } = await supabase.rpc("username_available", { p_username: username });
    if (!available) return { error: `@${username} is taken. Try another.` };
    update.username = username;
  }

  const { error } = await supabase.from("profiles").update(update).eq("id", userId);
  if (error) return { error: error.code === "23505" ? "That username was just taken. Try another." : error.message };
  redirect("/assessment");
}

export async function updateProfile(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, userId } = await currentUser();
  const username = normaliseUsername(String(formData.get("username") ?? ""));
  const err = validateUsername(username);
  if (err) return { error: err };
  const { data: available } = await supabase.rpc("username_available", { p_username: username });
  if (!available) return { error: `@${username} is taken.` };

  const displayName = String(formData.get("display_name") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  if (displayName.length > 50) return { error: "Display name must be 50 characters or fewer." };
  if (bio.length > 280) return { error: "Bio must be 280 characters or fewer." };

  const { error } = await supabase
    .from("profiles")
    .update({
      username,
      display_name: displayName || null,
      bio: bio || null,
      show_on_leaderboard: formData.get("show_on_leaderboard") === "on",
      public_category_scores: formData.get("public_category_scores") === "on",
      public_goals: formData.get("public_goals") === "on",
    })
    .eq("id", userId);
  if (error) return { error: error.code === "23505" ? "That username is taken." : error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}
