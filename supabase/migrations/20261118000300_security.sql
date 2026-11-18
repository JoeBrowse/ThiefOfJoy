-- Thief of Joy: privileges & Row Level Security.
-- Principle: deny by default. Each role gets only what the app needs, and
-- scores can only change through the SECURITY DEFINER functions.

-- ---------------------------------------------------------------------------
-- Reset Supabase's default broad grants on our tables and functions
-- ---------------------------------------------------------------------------
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke execute on all functions in schema public from public, anon, authenticated;

alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;

-- Enable RLS everywhere
alter table public.profiles enable row level security;
alter table public.life_categories enable row level security;
alter table public.assessment_questions enable row level security;
alter table public.assessment_sessions enable row level security;
alter table public.question_answers enable row level security;
alter table public.session_category_notes enable row level security;
alter table public.category_scores enable row level security;
alter table public.category_score_history enable row level security;
alter table public.user_stats enable row level security;
alter table public.life_score_history enable row level security;
alter table public.leaderboard_history enable row level security;
alter table public.custom_goals enable row level security;
alter table public.custom_goal_updates enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.post_votes enable row level security;
alter table public.comment_votes enable row level security;
alter table public.reports enable row level security;

-- ---------------------------------------------------------------------------
-- Content: readable by everyone
-- ---------------------------------------------------------------------------
grant select on public.life_categories, public.assessment_questions to anon, authenticated;
create policy "content readable" on public.life_categories for select using (true);
create policy "questions readable" on public.assessment_questions for select using (true);

-- ---------------------------------------------------------------------------
-- Profiles: public info readable by signed-in users; own row editable
-- (is_admin is deliberately not updatable by users)
-- ---------------------------------------------------------------------------
grant select on public.profiles to authenticated;
grant update (username, display_name, bio, show_on_leaderboard, public_category_scores, public_goals, onboarded_at)
  on public.profiles to authenticated;

create policy "profiles readable by members" on public.profiles
  for select to authenticated using (true);
create policy "update own profile" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- ---------------------------------------------------------------------------
-- Assessments: entirely private to the owner
-- ---------------------------------------------------------------------------
grant select on public.assessment_sessions to authenticated;
grant insert (kind, category_id) on public.assessment_sessions to authenticated;
grant update (current_step, status) on public.assessment_sessions to authenticated;

create policy "own sessions select" on public.assessment_sessions
  for select to authenticated using (user_id = auth.uid());
create policy "own sessions insert" on public.assessment_sessions
  for insert to authenticated
  with check (user_id = auth.uid() and status = 'in_progress');
create policy "own sessions update" on public.assessment_sessions
  for update to authenticated
  using (user_id = auth.uid() and status = 'in_progress')
  with check (user_id = auth.uid() and status in ('in_progress', 'abandoned'));

grant select, delete on public.question_answers to authenticated;
grant insert (session_id, question_id, score) on public.question_answers to authenticated;
grant update (session_id, question_id, score) on public.question_answers to authenticated;

create policy "own answers select" on public.question_answers
  for select to authenticated using (user_id = auth.uid());
create policy "own answers insert" on public.question_answers
  for insert to authenticated with check (
    user_id = auth.uid() and exists (
      select 1 from public.assessment_sessions s
       where s.id = session_id and s.user_id = auth.uid() and s.status = 'in_progress'));
create policy "own answers update" on public.question_answers
  for update to authenticated
  using (user_id = auth.uid() and exists (
      select 1 from public.assessment_sessions s
       where s.id = session_id and s.status = 'in_progress'))
  with check (user_id = auth.uid());
create policy "own answers delete" on public.question_answers
  for delete to authenticated using (user_id = auth.uid() and exists (
      select 1 from public.assessment_sessions s
       where s.id = session_id and s.status = 'in_progress'));

grant select, delete on public.session_category_notes to authenticated;
grant insert (session_id, category_id, note) on public.session_category_notes to authenticated;
grant update (session_id, category_id, note) on public.session_category_notes to authenticated;

create policy "own notes select" on public.session_category_notes
  for select to authenticated using (user_id = auth.uid());
create policy "own notes insert" on public.session_category_notes
  for insert to authenticated with check (
    user_id = auth.uid() and exists (
      select 1 from public.assessment_sessions s
       where s.id = session_id and s.user_id = auth.uid() and s.status = 'in_progress'));
create policy "own notes update" on public.session_category_notes
  for update to authenticated
  using (user_id = auth.uid() and exists (
      select 1 from public.assessment_sessions s
       where s.id = session_id and s.status = 'in_progress'))
  with check (user_id = auth.uid());
create policy "own notes delete" on public.session_category_notes
  for delete to authenticated using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Scores: read-only to clients. Category scores visible to others only if
-- the owner turned on public_category_scores. History is always private.
-- ---------------------------------------------------------------------------
grant select on public.category_scores, public.category_score_history,
  public.user_stats, public.life_score_history, public.leaderboard_history to authenticated;

create policy "category scores visible" on public.category_scores
  for select to authenticated using (
    user_id = auth.uid() or exists (
      select 1 from public.profiles p
       where p.id = user_id and p.public_category_scores));

create policy "own category history" on public.category_score_history
  for select to authenticated using (user_id = auth.uid());

-- Other users only see stats for people currently ranked on the leaderboard
create policy "stats visible" on public.user_stats
  for select to authenticated using (user_id = auth.uid() or current_rank is not null);

create policy "own life score history" on public.life_score_history
  for select to authenticated using (user_id = auth.uid());

create policy "rank history visible" on public.leaderboard_history
  for select to authenticated using (
    user_id = auth.uid() or exists (
      select 1 from public.user_stats s
       where s.user_id = leaderboard_history.user_id and s.current_rank is not null));

-- ---------------------------------------------------------------------------
-- Goals: private unless the goal is shareable AND the owner shows goals
-- ---------------------------------------------------------------------------
grant select, delete on public.custom_goals to authenticated;
grant insert (name, description, start_score, target_score, target_date, category_id, counts_toward_category, is_public)
  on public.custom_goals to authenticated;
grant update (name, description, target_score, target_date, category_id, counts_toward_category, is_public, status)
  on public.custom_goals to authenticated;

create policy "goals visible" on public.custom_goals
  for select to authenticated using (
    user_id = auth.uid() or (is_public and exists (
      select 1 from public.profiles p where p.id = user_id and p.public_goals)));
create policy "own goals insert" on public.custom_goals
  for insert to authenticated with check (user_id = auth.uid());
create policy "own goals update" on public.custom_goals
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own goals delete" on public.custom_goals
  for delete to authenticated using (user_id = auth.uid());

grant select on public.custom_goal_updates to authenticated;
grant insert (goal_id, new_score, note) on public.custom_goal_updates to authenticated;

-- Update notes are always private
create policy "own goal updates select" on public.custom_goal_updates
  for select to authenticated using (user_id = auth.uid());
create policy "own goal updates insert" on public.custom_goal_updates
  for insert to authenticated with check (
    user_id = auth.uid() and exists (
      select 1 from public.custom_goals g where g.id = goal_id and g.user_id = auth.uid()));

-- ---------------------------------------------------------------------------
-- Community
-- ---------------------------------------------------------------------------
grant select, delete on public.posts to authenticated;
grant insert (title, body, category_id, custom_category) on public.posts to authenticated;
grant update (title, body, category_id, custom_category, edited_at) on public.posts to authenticated;

create policy "posts readable" on public.posts
  for select to authenticated using (not is_removed or author_id = auth.uid() or public.is_admin());
create policy "own posts insert" on public.posts
  for insert to authenticated with check (author_id = auth.uid());
create policy "own posts update" on public.posts
  for update to authenticated using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy "own posts delete" on public.posts
  for delete to authenticated using (author_id = auth.uid() or public.is_admin());

grant select on public.comments to authenticated;
grant insert (post_id, parent_id, body) on public.comments to authenticated;
grant update (body, edited_at) on public.comments to authenticated;

create policy "comments readable" on public.comments
  for select to authenticated using (true);
create policy "own comments insert" on public.comments
  for insert to authenticated with check (author_id = auth.uid());
create policy "own comments update" on public.comments
  for update to authenticated
  using (author_id = auth.uid() and not is_deleted and not is_removed)
  with check (author_id = auth.uid());

grant select, insert, update, delete on public.post_votes, public.comment_votes to authenticated;

create policy "own post votes" on public.post_votes
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own comment votes" on public.comment_votes
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

grant select on public.reports to authenticated;
grant insert (post_id, comment_id, reason) on public.reports to authenticated;

create policy "reports insert" on public.reports
  for insert to authenticated with check (reporter_id = auth.uid());
create policy "reports visible" on public.reports
  for select to authenticated using (reporter_id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------------
-- Functions callable by the app
-- ---------------------------------------------------------------------------
grant execute on function public.username_available(text) to anon, authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.submit_assessment(uuid) to authenticated;
grant execute on function public.quick_update_category(text, numeric, text) to authenticated;
grant execute on function public.delete_my_account() to authenticated;
grant execute on function public.delete_comment(uuid) to authenticated;
grant execute on function public.moderate_remove_post(uuid, text) to authenticated;
grant execute on function public.moderate_restore_post(uuid) to authenticated;
grant execute on function public.resolve_report(uuid, text) to authenticated;
-- Internal helpers (_apply_category_score, _recalculate_life_score,
-- _refresh_goal_blend, refresh_leaderboard, trigger functions) are NOT granted.
