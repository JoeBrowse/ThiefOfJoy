"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { CATEGORY_BY_ID } from "@/lib/content/categories";
import type { ActionState } from "./profile";

const PostSchema = z.object({
  title: z.string().trim().min(3, "Title needs at least 3 characters").max(200, "Keep the title under 200 characters"),
  body: z.string().trim().max(20000, "Post is too long"),
  category: z.string().min(1, "Choose a category"),
  custom_category: z.string().trim().optional(),
});

export async function createPost(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = PostSchema.safeParse({
    title: formData.get("title") ?? "",
    body: formData.get("body") ?? "",
    category: formData.get("category") ?? "",
    custom_category: formData.get("custom_category") ?? undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const { title, body, category, custom_category } = parsed.data;

  let categoryId: string | null = null;
  let custom: string | null = null;
  if (category === "other") {
    if (!custom_category || custom_category.length < 2 || custom_category.length > 40)
      return { error: "Name your category (2–40 characters)" };
    custom = custom_category;
  } else if (CATEGORY_BY_ID[category]) {
    categoryId = category;
  } else {
    return { error: "Choose a category" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .insert({ title, body, category_id: categoryId, custom_category: custom })
    .select("id")
    .single();
  if (error) return { error: error.message };
  revalidatePath("/community");
  redirect(`/community/${data.id}`);
}

export async function deletePost(postId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("posts").delete().eq("id", postId);
  if (error) return { error: error.message };
  revalidatePath("/community");
  redirect("/community");
}

export async function createComment(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const postId = String(formData.get("post_id") ?? "");
  const parentId = (formData.get("parent_id") as string) || null;
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return { error: "Write something first" };
  if (body.length > 10000) return { error: "Comment is too long" };
  const supabase = await createClient();
  const { error } = await supabase.from("comments").insert({ post_id: postId, parent_id: parentId, body });
  if (error) return { error: error.message };
  revalidatePath(`/community/${postId}`);
  return { ok: true };
}

export async function deleteComment(commentId: string, postId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("delete_comment", { p_comment: commentId });
  if (error) return { error: error.message };
  revalidatePath(`/community/${postId}`);
  return { ok: true };
}

export async function reportContent(target: { postId?: string; commentId?: string }, reason: string) {
  const r = reason.trim();
  if (r.length < 3) return { error: "Tell us briefly what's wrong (at least 3 characters)" };
  if (r.length > 500) return { error: "Keep it under 500 characters" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("reports")
    .insert({ post_id: target.postId ?? null, comment_id: target.commentId ?? null, reason: r });
  if (error) return { error: error.message };
  return { ok: true };
}

// ---- moderation (enforced again in the database) ---------------------------
export async function moderateRemovePost(postId: string, reason?: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("moderate_remove_post", { p_post: postId, p_reason: reason });
  if (error) return { error: error.message };
  revalidatePath("/admin");
  revalidatePath("/community");
  return { ok: true };
}

export async function moderateRestorePost(postId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("moderate_restore_post", { p_post: postId });
  if (error) return { error: error.message };
  revalidatePath("/admin");
  revalidatePath("/community");
  return { ok: true };
}

export async function resolveReport(reportId: string, status: "resolved" | "dismissed") {
  const supabase = await createClient();
  const { error } = await supabase.rpc("resolve_report", { p_report: reportId, p_status: status });
  if (error) return { error: error.message };
  revalidatePath("/admin");
  return { ok: true };
}
