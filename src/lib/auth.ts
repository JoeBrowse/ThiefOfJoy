import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const getSupabase = cache(createClient);

/** Current user id from the verified session (or null). */
export const getUserId = cache(async (): Promise<string | null> => {
  const supabase = await getSupabase();
  const { data } = await supabase.auth.getClaims();
  return (data?.claims?.sub as string | undefined) ?? null;
});

export const getProfile = cache(async () => {
  const userId = await getUserId();
  if (!userId) return null;
  const supabase = await getSupabase();
  const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
  return data;
});

/** Use in protected pages: guarantees a signed-in user with a profile. */
export async function requireProfile() {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  const supabase = await getSupabase();
  return { supabase, profile, userId: profile.id };
}

/** Like requireProfile, but also sends people without a username to onboarding. */
export async function requireOnboarded() {
  const ctx = await requireProfile();
  if (!ctx.profile.username) redirect("/welcome");
  return ctx;
}
