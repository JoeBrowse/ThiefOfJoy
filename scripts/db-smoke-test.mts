/**
 * End-to-end smoke test of the database layer (scoring, leaderboard, RLS)
 * against a running Supabase stack. Creates throwaway users.
 *
 *   npm run db:start && npm run db:test
 *
 * Runs against the LOCAL Supabase stack only (it creates and deletes users).
 */
import { execSync } from "node:child_process";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { CATEGORIES } from "../src/lib/content/categories.ts";

const status = JSON.parse(execSync("npx supabase status -o json", { stdio: ["ignore", "pipe", "ignore"] }).toString());
const url: string = status.API_URL;
const key: string = status.PUBLISHABLE_KEY ?? status.ANON_KEY;
if (!/^http:\/\/(127\.0\.0\.1|localhost)/.test(url)) {
  console.error(`Refusing to run against ${url}: local stack only.`);
  process.exit(1);
}
let failures = 0;
const check = (cond: unknown, msg: string) => {
  console.log(`${cond ? "✓" : "✗"} ${msg}`);
  if (!cond) failures++;
};

async function newUser(username: string) {
  const sb = createClient(url, key, { auth: { persistSession: false } });
  const email = `${username}-${Date.now()}@example.test`;
  const { data, error } = await sb.auth.signUp({ email, password: "password123", options: { data: { username } } });
  if (error) throw error;
  return { sb, id: data.user!.id, username };
}

async function fullAssessment(sb: SupabaseClient, scoreFor: (catIndex: number, qIndex: number) => number | null) {
  const { data: session, error } = await sb.from("assessment_sessions").insert({ kind: "full" }).select().single();
  if (error) throw error;
  const rows = CATEGORIES.flatMap((c, ci) =>
    c.questions.map((q, qi) => ({ session_id: session.id, question_id: q.id, score: scoreFor(ci, qi) })),
  );
  const { error: e2 } = await sb.from("question_answers").upsert(rows);
  if (e2) throw e2;
  const { data, error: e3 } = await sb.rpc("submit_assessment", { p_session: session.id });
  if (e3) throw e3;
  return data as { life_score: number; is_complete: boolean; rank: number | null };
}

const suffix = Math.random().toString(36).slice(2, 7);
const a = await newUser(`alice_${suffix}`);
const b = await newUser(`bob_${suffix}`);

// Alice: every question 7, except one skipped per category -> 70.0%
const ra = await fullAssessment(a.sb, (_c, q) => (q === 0 ? null : 7));
check(Number(ra.life_score) === 70 && ra.is_complete, `alice life score 70.0 complete (got ${ra.life_score})`);

// Bob: category i gets score (i % 10) + 1 on every question
const rb = await fullAssessment(b.sb, (c) => (c % 10) + 1);
const expected = Math.round((CATEGORIES.map((_, i) => (i % 10) + 1).reduce((s, x) => s + x, 0) / 15) * 10 * 10) / 10;
check(Number(rb.life_score) === expected, `bob life score ${expected} (got ${rb.life_score})`);

// Category equal weighting check: categories have different question counts
const { data: cs } = await b.sb.from("category_scores").select("category_id, score").eq("user_id", b.id);
check(cs?.length === 15, "bob has 15 category scores");

// Leaderboard: alice 70 > bob ~
const { data: board } = await a.sb.from("user_stats").select("user_id, life_score, current_rank, previous_rank").not("current_rank", "is", null).order("current_rank");
const ar = board?.find((r) => r.user_id === a.id);
const br = board?.find((r) => r.user_id === b.id);
check(ar && br && ar.current_rank < br.current_rank, `alice ranked above bob (${ar?.current_rank} vs ${br?.current_rank})`);

// Bob boosts a category massively via quick update -> overtakes alice?
for (const c of CATEGORIES.slice(0, 15)) {
  await b.sb.rpc("quick_update_category", { p_category: c.id, p_score: 9, p_note: "feeling good" });
}
const { data: board2 } = await a.sb.from("user_stats").select("user_id, life_score, current_rank, previous_rank").not("current_rank", "is", null);
const ar2 = board2!.find((r) => r.user_id === a.id)!;
const br2 = board2!.find((r) => r.user_id === b.id)!;
check(Number(br2.life_score) === 90, `bob now 90.0 (got ${br2.life_score})`);
check(br2.current_rank < ar2.current_rank, "bob overtook alice");
check(ar2.previous_rank !== null && ar2.current_rank > ar2.previous_rank, `alice shows downward movement (${ar2.previous_rank} -> ${ar2.current_rank})`);
check(br2.previous_rank !== null && br2.current_rank < br2.previous_rank, `bob shows upward movement (${br2.previous_rank} -> ${br2.current_rank})`);

// RLS: alice cannot read bob's category scores (private by default)
const { data: peek } = await a.sb.from("category_scores").select("*").eq("user_id", b.id);
check(peek?.length === 0, "alice cannot see bob's private category scores");
const { data: peekAns } = await a.sb.from("question_answers").select("*").eq("user_id", b.id);
check(peekAns?.length === 0, "alice cannot see bob's answers");
// RLS: alice cannot write category scores directly
const { error: writeErr } = await a.sb.from("category_scores").update({ score: 10 }).eq("user_id", a.id);
check(!!writeErr, "direct category score writes are blocked");
const { error: adminErr } = await a.sb.from("profiles").update({ is_admin: true }).eq("id", a.id);
check(!!adminErr, "users cannot make themselves admin");

// Goals: linked goal blends into category
const { data: goal, error: gErr } = await a.sb.from("custom_goals").insert({
  name: "Running", start_score: 3, target_score: 8, category_id: "physical-health", counts_toward_category: true,
}).select().single();
check(!gErr, `goal created ${gErr?.message ?? ""}`);
const { data: ph } = await a.sb.from("category_scores").select("score, base_score, answered_count").eq("user_id", a.id).eq("category_id", "physical-health").single();
// base 7 over 7 answered + goal 3 => (49+3)/8 = 6.5
check(Number(ph?.score) === 6.5, `linked goal blended into physical health (got ${ph?.score})`);
const { error: uErr } = await a.sb.from("custom_goal_updates").insert({ goal_id: goal!.id, new_score: 7, note: "ran 5k" });
check(!uErr, `goal update logged ${uErr?.message ?? ""}`);
const { data: ph2 } = await a.sb.from("category_scores").select("score").eq("user_id", a.id).eq("category_id", "physical-health").single();
check(Number(ph2?.score) === 7, `goal update re-blended category (got ${ph2?.score})`);
const { data: g2 } = await a.sb.from("custom_goals").select("current_score").eq("id", goal!.id).single();
check(g2?.current_score === 7, "goal current score moved to 7");
// unlinked goal does not affect score
await a.sb.from("custom_goals").insert({ name: "Chess", start_score: 1, target_score: 9 });
const { data: st } = await a.sb.from("user_stats").select("life_score").eq("user_id", a.id).single();
check(Number(st?.life_score) === 70, `unlinked goal leaves life score alone (got ${st?.life_score})`);
// bob cannot see alice's private goals
const { data: peekGoals } = await b.sb.from("custom_goals").select("*").eq("user_id", a.id);
check(peekGoals?.length === 0, "goals private by default");

// Community
const { data: post, error: pErr } = await a.sb.from("posts").insert({ title: "Hello friends", body: "First post", category_id: "physical-health" }).select().single();
check(!pErr, `post created ${pErr?.message ?? ""}`);
const { error: badPost } = await a.sb.from("posts").insert({ title: "No category", body: "x" });
check(!!badPost, "post without category rejected");
const { data: other } = await a.sb.from("posts").insert({ title: "Custom tag", body: "x", custom_category: "Pets" }).select().single();
check(!!other, "post with custom 'Other' category");
const { data: c1 } = await b.sb.from("comments").insert({ post_id: post!.id, body: "Welcome!" }).select().single();
const { data: c2 } = await a.sb.from("comments").insert({ post_id: post!.id, parent_id: c1!.id, body: "Thanks" }).select().single();
check(c2?.depth === 1, "nested reply depth 1");
await b.sb.from("post_votes").upsert({ post_id: post!.id, user_id: b.id, value: 1 });
await a.sb.from("post_votes").upsert({ post_id: post!.id, user_id: a.id, value: 1 });
await a.sb.from("post_votes").upsert({ post_id: post!.id, user_id: a.id, value: -1 });
const { data: p2 } = await a.sb.from("posts").select("score, comment_count").eq("id", post!.id).single();
check(p2?.score === 0 && p2?.comment_count === 2, `vote tally 0 and 2 comments (got ${p2?.score}, ${p2?.comment_count})`);
const { error: delErr } = await b.sb.rpc("delete_comment", { p_comment: c2!.id });
check(!!delErr, "cannot delete someone else's comment");
const { error: delOk } = await b.sb.rpc("delete_comment", { p_comment: c1!.id });
check(!delOk, "can delete own comment");
const { error: fakeScore } = await a.sb.from("posts").update({ score: 999 }).eq("id", post!.id);
check(!!fakeScore, "cannot edit post score directly");
const { data: search } = await a.sb.from("posts").select("id").textSearch("search", "friends", { type: "websearch", config: "english" });
check(search?.some((s) => s.id === post!.id), "full-text search finds post");
const { error: repErr } = await b.sb.from("reports").insert({ post_id: post!.id, reason: "testing report" });
check(!repErr, `report created ${repErr?.message ?? ""}`);

// Privacy: hide from leaderboard
await b.sb.from("profiles").update({ show_on_leaderboard: false }).eq("id", b.id);
const { data: board3 } = await a.sb.from("user_stats").select("user_id, current_rank").not("current_rank", "is", null);
check(!board3?.some((r) => r.user_id === b.id), "bob hidden from leaderboard");

// Account deletion
const { error: delAcc } = await b.sb.rpc("delete_my_account");
check(!delAcc, `bob deleted account ${delAcc?.message ?? ""}`);
const { data: gone } = await a.sb.from("profiles").select("id").eq("id", b.id);
check(gone?.length === 0, "bob's profile gone");

// cleanup alice
await a.sb.rpc("delete_my_account");

console.log(failures ? `\n${failures} FAILED` : "\nAll checks passed");
process.exit(failures ? 1 : 0);
