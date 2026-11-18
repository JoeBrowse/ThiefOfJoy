"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { CATEGORY_BY_ID } from "@/lib/content/categories";
import type { ActionState } from "./profile";

const score = z.coerce.number().int().min(1, "Choose a score from 1 to 10").max(10);

const GoalSchema = z.object({
  name: z.string().trim().min(1, "Give your goal a name").max(80, "Keep the name under 80 characters"),
  description: z.string().trim().max(1000).optional(),
  target_score: score,
  target_date: z.string().optional(),
  category_id: z.string().optional(),
  counts_toward_category: z.boolean(),
  is_public: z.boolean(),
});

function parseGoal(formData: FormData) {
  const parsed = GoalSchema.safeParse({
    name: formData.get("name") ?? "",
    description: formData.get("description") ?? undefined,
    target_score: formData.get("target_score") ?? "",
    target_date: formData.get("target_date") || undefined,
    category_id: formData.get("category_id") || undefined,
    counts_toward_category: formData.get("counts_toward_category") === "on",
    is_public: formData.get("is_public") === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form" } as const;
  const d = parsed.data;
  if (d.category_id && !CATEGORY_BY_ID[d.category_id]) return { error: "Unknown category" } as const;
  return {
    data: {
      name: d.name,
      description: d.description || null,
      target_score: d.target_score,
      target_date: d.target_date || null,
      category_id: d.category_id || null,
      counts_toward_category: Boolean(d.category_id) && d.counts_toward_category,
      is_public: d.is_public,
    },
  } as const;
}

export async function createGoal(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient();
  const parsed = parseGoal(formData);
  if ("error" in parsed) return { error: parsed.error };
  const start = score.safeParse(formData.get("start_score") ?? "");
  if (!start.success) return { error: "Choose a starting score from 1 to 10" };

  const { data, error } = await supabase
    .from("custom_goals")
    .insert({ ...parsed.data, start_score: start.data })
    .select("id")
    .single();
  if (error) return { error: error.message };
  revalidatePath("/goals");
  revalidatePath("/dashboard");
  redirect(`/goals/${data.id}?created=1`);
}

export async function updateGoal(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient();
  const id = String(formData.get("id"));
  const parsed = parseGoal(formData);
  if ("error" in parsed) return { error: parsed.error };
  const { error } = await supabase.from("custom_goals").update(parsed.data).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/goals/${id}`);
  revalidatePath("/goals");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function setGoalStatus(id: string, status: "active" | "archived") {
  const supabase = await createClient();
  const { error } = await supabase.from("custom_goals").update({ status }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/goals/${id}`);
  revalidatePath("/goals");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deleteGoal(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("custom_goals").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/goals");
  revalidatePath("/dashboard");
  redirect("/goals");
}

export async function logGoalUpdate(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient();
  const goalId = String(formData.get("goal_id"));
  const s = score.safeParse(formData.get("new_score") ?? "");
  if (!s.success) return { error: "Choose a score from 1 to 10" };
  const note = String(formData.get("note") ?? "").trim();
  if (note.length > 1000) return { error: "Keep notes under 1000 characters" };
  const { error } = await supabase.from("custom_goal_updates").insert({ goal_id: goalId, new_score: s.data, note: note || null });
  if (error) return { error: error.message };
  revalidatePath(`/goals/${goalId}`);
  revalidatePath("/goals");
  revalidatePath("/dashboard");
  return { ok: true };
}
