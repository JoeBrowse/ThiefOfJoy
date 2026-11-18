-- Thief of Joy: scoring engine, leaderboard and triggers.
--
-- SCORING (transparent and documented in README):
--   1. Each answered question is scored 1-10 (skips are ignored).
--   2. Category base score = average of answered questions in that category.
--      Goals the user explicitly links with "counts towards category" are
--      blended in, each weighted as one extra question.
--   3. Life Score % = average of category scores (each category weighted
--      equally) / 10 * 100, rounded to one decimal place.
--   4. A Life Score is "complete" only when all 15 categories are scored.
--      Incomplete scores are calculated from scored categories only, never by
--      treating a missing category as zero, and are excluded from the
--      leaderboard.
--
-- LEADERBOARD TIE-BREAK: rank by life_score desc, then by who reached that
-- exact score first (score_reached_at asc), then by username.

-- ---------------------------------------------------------------------------
-- Generic helpers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger sessions_updated_at before update on public.assessment_sessions
  for each row execute function public.set_updated_at();
create trigger answers_updated_at before update on public.question_answers
  for each row execute function public.set_updated_at();
create trigger notes_updated_at before update on public.session_category_notes
  for each row execute function public.set_updated_at();
create trigger goals_updated_at before update on public.custom_goals
  for each row execute function public.set_updated_at();
create trigger posts_updated_at before update on public.posts
  for each row execute function public.set_updated_at();
create trigger comments_updated_at before update on public.comments
  for each row execute function public.set_updated_at();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

-- ---------------------------------------------------------------------------
-- New user -> profile + stats row
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  wanted text := lower(nullif(trim(new.raw_user_meta_data ->> 'username'), ''));
begin
  if wanted is not null
     and (wanted !~ '^[a-z0-9_]{3,20}$'
          or exists (select 1 from public.profiles where username = wanted)) then
    wanted := null; -- user will be asked to choose one during onboarding
  end if;

  insert into public.profiles (id, username) values (new.id, wanted);
  insert into public.user_stats (user_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.username_available(p_username text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select lower(p_username) ~ '^[a-z0-9_]{3,20}$'
     and not exists (
       select 1 from public.profiles
       where username = lower(p_username)
         and id is distinct from auth.uid()
     );
$$;

-- ---------------------------------------------------------------------------
-- Leaderboard
-- ---------------------------------------------------------------------------
create or replace function public.refresh_leaderboard()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- serialise concurrent refreshes
  perform pg_advisory_xact_lock(hashtext('thief_of_joy_leaderboard'));

  -- users who are no longer eligible drop off the board
  with dropped as (
    update public.user_stats s
       set previous_rank = s.current_rank,
           current_rank = null,
           rank_changed_at = now()
     where s.current_rank is not null
       and not exists (
         select 1 from public.profiles p
          where p.id = s.user_id
            and p.show_on_leaderboard
            and p.username is not null
            and s.is_complete
            and s.life_score is not null
       )
    returning s.user_id, s.previous_rank, s.life_score
  )
  insert into public.leaderboard_history (user_id, rank, previous_rank, life_score)
  select user_id, null, previous_rank, life_score from dropped;

  -- rank everyone who is eligible; only rows whose rank actually changes are
  -- touched, so previous_rank always means "rank before the last movement"
  with ranked as (
    select s.user_id,
           row_number() over (
             order by s.life_score desc, s.score_reached_at asc nulls last, p.username asc
           )::int as rnk
      from public.user_stats s
      join public.profiles p on p.id = s.user_id
     where s.is_complete
       and s.life_score is not null
       and p.show_on_leaderboard
       and p.username is not null
  ),
  changed as (
    update public.user_stats s
       set previous_rank = s.current_rank,
           current_rank = r.rnk,
           rank_changed_at = now()
      from ranked r
     where s.user_id = r.user_id
       and s.current_rank is distinct from r.rnk
    returning s.user_id, s.current_rank, s.previous_rank, s.life_score
  )
  insert into public.leaderboard_history (user_id, rank, previous_rank, life_score)
  select user_id, current_rank, previous_rank, life_score from changed;
end;
$$;

-- ---------------------------------------------------------------------------
-- Life Score
-- ---------------------------------------------------------------------------
create or replace function public._recalculate_life_score(
  p_user uuid,
  p_source text,
  p_category text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_avg numeric;
  v_count int;
  v_total int;
  v_new numeric(4, 1);
  v_old public.user_stats%rowtype;
  v_complete boolean;
begin
  select count(*) into v_total from public.life_categories;

  select avg(cs.score), count(*)
    into v_avg, v_count
    from public.category_scores cs
    join public.life_categories lc on lc.id = cs.category_id
   where cs.user_id = p_user;

  v_complete := v_count >= v_total;
  v_new := case when v_count > 0 then round(v_avg * 10, 1) else null end;

  insert into public.user_stats (user_id) values (p_user) on conflict (user_id) do nothing;
  select * into v_old from public.user_stats where user_id = p_user for update;

  update public.user_stats
     set life_score = v_new,
         previous_life_score = case when v_old.life_score is distinct from v_new
                                    then v_old.life_score else previous_life_score end,
         score_reached_at = case when v_old.life_score is distinct from v_new
                                 then now() else score_reached_at end,
         categories_scored = v_count,
         is_complete = v_complete,
         score_updated_at = now()
   where user_id = p_user;

  if v_new is not null and (v_old.life_score is distinct from v_new
                            or v_old.is_complete is distinct from v_complete) then
    insert into public.life_score_history
      (user_id, life_score, previous_life_score, categories_scored, is_complete, source, category_id)
    values (p_user, v_new, v_old.life_score, v_count, v_complete, p_source, p_category);
  end if;

  perform public.refresh_leaderboard();
end;
$$;

-- Applies a new base score to a category, blends in linked goals, logs history.
create or replace function public._apply_category_score(
  p_user uuid,
  p_category text,
  p_base numeric,
  p_answered int,
  p_source text,
  p_session uuid,
  p_note text
)
returns numeric
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_goal_sum numeric;
  v_goal_count int;
  v_weight int := greatest(coalesce(p_answered, 1), 1);
  v_effective numeric(4, 2);
  v_old numeric(4, 2);
begin
  select coalesce(sum(current_score), 0), count(*)
    into v_goal_sum, v_goal_count
    from public.custom_goals
   where user_id = p_user
     and category_id = p_category
     and counts_toward_category
     and status = 'active';

  v_effective := round((p_base * v_weight + v_goal_sum) / (v_weight + v_goal_count), 2);

  select score into v_old from public.category_scores
   where user_id = p_user and category_id = p_category;

  insert into public.category_scores
    (user_id, category_id, base_score, score, previous_score, answered_count, source, last_session_id, updated_at)
  values
    (p_user, p_category, round(p_base, 2), v_effective, v_old, v_weight, p_source, p_session, now())
  on conflict (user_id, category_id) do update
    set base_score = excluded.base_score,
        score = excluded.score,
        previous_score = v_old,
        answered_count = excluded.answered_count,
        source = excluded.source,
        last_session_id = coalesce(excluded.last_session_id, public.category_scores.last_session_id),
        updated_at = now();

  insert into public.category_score_history
    (user_id, category_id, previous_score, new_score, source, session_id, note)
  values (p_user, p_category, v_old, v_effective, p_source, p_session, nullif(trim(p_note), ''));

  return v_effective;
end;
$$;

-- Re-blends a category after a linked goal changes (base score unchanged).
create or replace function public._refresh_goal_blend(p_user uuid, p_category text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row public.category_scores%rowtype;
  v_goal_sum numeric;
  v_goal_count int;
  v_effective numeric(4, 2);
begin
  select * into v_row from public.category_scores
   where user_id = p_user and category_id = p_category;
  if not found then
    return false; -- category not scored yet; goal will be blended in once it is
  end if;

  select coalesce(sum(current_score), 0), count(*)
    into v_goal_sum, v_goal_count
    from public.custom_goals
   where user_id = p_user and category_id = p_category
     and counts_toward_category and status = 'active';

  v_effective := round(
    (v_row.base_score * greatest(v_row.answered_count, 1) + v_goal_sum)
    / (greatest(v_row.answered_count, 1) + v_goal_count), 2);

  if v_effective = v_row.score then
    return false;
  end if;

  update public.category_scores
     set score = v_effective, previous_score = v_row.score, updated_at = now()
   where user_id = p_user and category_id = p_category;

  insert into public.category_score_history
    (user_id, category_id, previous_score, new_score, source, note)
  values (p_user, p_category, v_row.score, v_effective, 'goal', 'Linked goal updated');

  return true;
end;
$$;

-- ---------------------------------------------------------------------------
-- Public RPCs (called by the app as the signed-in user)
-- ---------------------------------------------------------------------------

-- Scores every category answered in a session, then recalculates the Life Score.
create or replace function public.submit_assessment(p_session uuid)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_session public.assessment_sessions%rowtype;
  v_cat record;
  v_scored int := 0;
  v_stats public.user_stats%rowtype;
begin
  if v_user is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;

  select * into v_session from public.assessment_sessions
   where id = p_session and user_id = v_user for update;
  if not found then
    raise exception 'Assessment not found' using errcode = 'P0002';
  end if;
  if v_session.status <> 'in_progress' then
    raise exception 'This assessment has already been submitted' using errcode = '22023';
  end if;

  for v_cat in
    select q.category_id,
           avg(a.score)::numeric as base,
           count(a.score)::int as answered
      from public.question_answers a
      join public.assessment_questions q on q.id = a.question_id
     where a.session_id = p_session
       and a.score is not null
       and (v_session.kind = 'full' or q.category_id = v_session.category_id)
     group by q.category_id
  loop
    perform public._apply_category_score(
      v_user, v_cat.category_id, v_cat.base, v_cat.answered, 'assessment', p_session,
      (select note from public.session_category_notes n
        where n.session_id = p_session and n.category_id = v_cat.category_id)
    );
    v_scored := v_scored + 1;
  end loop;

  if v_scored = 0 then
    raise exception 'Answer at least one question before submitting' using errcode = '22023';
  end if;

  update public.assessment_sessions
     set status = 'completed', completed_at = now()
   where id = p_session;

  -- any other in-progress sessions of the same scope are now stale
  update public.assessment_sessions
     set status = 'abandoned'
   where user_id = v_user and status = 'in_progress' and id <> p_session
     and kind = v_session.kind
     and category_id is not distinct from v_session.category_id;

  perform public._recalculate_life_score(
    v_user,
    case when v_session.kind = 'full' then 'assessment' else 'category_assessment' end,
    v_session.category_id
  );

  select * into v_stats from public.user_stats where user_id = v_user;
  return json_build_object(
    'life_score', v_stats.life_score,
    'previous_life_score', v_stats.previous_life_score,
    'is_complete', v_stats.is_complete,
    'categories_scored', v_stats.categories_scored,
    'rank', v_stats.current_rank,
    'previous_rank', v_stats.previous_rank
  );
end;
$$;

-- Quick update: directly set a category score (1.0-10.0) without re-answering.
create or replace function public.quick_update_category(
  p_category text,
  p_score numeric,
  p_note text default null
)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_answered int;
  v_effective numeric;
  v_stats public.user_stats%rowtype;
begin
  if v_user is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;
  if not exists (select 1 from public.life_categories where id = p_category) then
    raise exception 'Unknown category' using errcode = '22023';
  end if;
  if p_score is null or p_score < 1 or p_score > 10 then
    raise exception 'Score must be between 1 and 10' using errcode = '22023';
  end if;
  if char_length(coalesce(p_note, '')) > 2000 then
    raise exception 'Note is too long' using errcode = '22023';
  end if;

  select answered_count into v_answered from public.category_scores
   where user_id = v_user and category_id = p_category;

  v_effective := public._apply_category_score(
    v_user, p_category, round(p_score, 1), coalesce(v_answered, 1), 'manual', null, p_note);

  perform public._recalculate_life_score(v_user, 'manual', p_category);

  select * into v_stats from public.user_stats where user_id = v_user;
  return json_build_object(
    'category_score', v_effective,
    'life_score', v_stats.life_score,
    'previous_life_score', v_stats.previous_life_score,
    'is_complete', v_stats.is_complete,
    'rank', v_stats.current_rank
  );
end;
$$;

-- Permanently deletes the signed-in user's account and all their data.
-- Posts are deleted; comments on other people's threads are anonymised so
-- conversations stay readable.
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;
  update public.comments
     set body = '[deleted]', is_deleted = true, author_id = null
   where author_id = v_user;
  delete from auth.users where id = v_user;
  perform public.refresh_leaderboard();
end;
$$;

-- ---------------------------------------------------------------------------
-- Goals
-- ---------------------------------------------------------------------------
create or replace function public.goal_before_insert()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.current_score := new.start_score;
  return new;
end;
$$;

create trigger goal_before_insert before insert on public.custom_goals
  for each row execute function public.goal_before_insert();

-- Logging an update moves the goal's current score.
create or replace function public.goal_update_before_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_goal public.custom_goals%rowtype;
begin
  select * into v_goal from public.custom_goals where id = new.goal_id for update;
  if not found or v_goal.user_id <> new.user_id then
    raise exception 'Goal not found' using errcode = 'P0002';
  end if;
  new.previous_score := v_goal.current_score;
  update public.custom_goals set current_score = new.new_score where id = new.goal_id;
  return new;
end;
$$;

create trigger goal_update_before_insert before insert on public.custom_goal_updates
  for each row execute function public.goal_update_before_insert();

-- When a goal that counts towards a category changes, re-blend that category.
create or replace function public.goal_after_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid;
  v_changed boolean := false;
  v_cat text;
begin
  v_user := coalesce(new.user_id, old.user_id);

  for v_cat in
    select distinct c from unnest(array[
      case when tg_op <> 'INSERT' and old.counts_toward_category then old.category_id end,
      case when tg_op <> 'DELETE' and new.counts_toward_category then new.category_id end
    ]) as c where c is not null
  loop
    if public._refresh_goal_blend(v_user, v_cat) then
      v_changed := true;
    end if;
  end loop;

  if v_changed then
    perform public._recalculate_life_score(v_user, 'goal', null);
  end if;
  return null;
end;
$$;

create trigger goal_after_change
  after insert or update or delete on public.custom_goals
  for each row execute function public.goal_after_change();

-- ---------------------------------------------------------------------------
-- Profiles: leaderboard visibility changes re-rank immediately
-- ---------------------------------------------------------------------------
create or replace function public.profile_after_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.show_on_leaderboard is distinct from old.show_on_leaderboard
     or new.username is distinct from old.username then
    perform public.refresh_leaderboard();
  end if;
  return null;
end;
$$;

create trigger profile_after_update
  after update on public.profiles
  for each row execute function public.profile_after_update();

-- ---------------------------------------------------------------------------
-- Community: comment depth, counters and vote tallies
-- ---------------------------------------------------------------------------
create or replace function public.comment_before_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_parent public.comments%rowtype;
begin
  if new.parent_id is not null then
    select * into v_parent from public.comments where id = new.parent_id;
    if not found or v_parent.post_id <> new.post_id then
      raise exception 'Parent comment not found on this post' using errcode = '22023';
    end if;
    new.depth := v_parent.depth + 1;
  else
    new.depth := 0;
  end if;
  if exists (select 1 from public.posts where id = new.post_id and is_removed) then
    raise exception 'This post has been removed' using errcode = '22023';
  end if;
  return new;
end;
$$;

create trigger comment_before_insert before insert on public.comments
  for each row execute function public.comment_before_insert();

create or replace function public.comment_after_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.posts
     set comment_count = comment_count + 1, last_activity_at = now()
   where id = new.post_id;
  return null;
end;
$$;

create trigger comment_after_insert after insert on public.comments
  for each row execute function public.comment_after_insert();

create or replace function public.post_vote_tally()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.posts
     set score = score + coalesce(case when tg_op <> 'DELETE' then new.value end, 0)
                       - coalesce(case when tg_op <> 'INSERT' then old.value end, 0)
   where id = coalesce(new.post_id, old.post_id);
  return null;
end;
$$;

create trigger post_vote_tally after insert or update or delete on public.post_votes
  for each row execute function public.post_vote_tally();

create or replace function public.comment_vote_tally()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.comments
     set score = score + coalesce(case when tg_op <> 'DELETE' then new.value end, 0)
                       - coalesce(case when tg_op <> 'INSERT' then old.value end, 0)
   where id = coalesce(new.comment_id, old.comment_id);
  return null;
end;
$$;

create trigger comment_vote_tally after insert or update or delete on public.comment_votes
  for each row execute function public.comment_vote_tally();

-- Soft-deletes a comment (author or admin) so replies keep their context.
create or replace function public.delete_comment(p_comment uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_comment public.comments%rowtype;
begin
  select * into v_comment from public.comments where id = p_comment;
  if not found then
    raise exception 'Comment not found' using errcode = 'P0002';
  end if;
  if v_comment.author_id = auth.uid() then
    update public.comments
       set body = '[deleted]', is_deleted = true, author_id = null
     where id = p_comment;
  elsif public.is_admin() then
    update public.comments
       set body = '[removed by moderator]', is_removed = true
     where id = p_comment;
    update public.reports set status = 'resolved', resolved_by = auth.uid(), resolved_at = now()
     where comment_id = p_comment and status = 'open';
  else
    raise exception 'You can only delete your own comments' using errcode = '42501';
  end if;
end;
$$;

-- Admin: remove a post from public view.
create or replace function public.moderate_remove_post(p_post uuid, p_reason text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Admins only' using errcode = '42501';
  end if;
  update public.posts set is_removed = true, removed_reason = p_reason where id = p_post;
  update public.reports set status = 'resolved', resolved_by = auth.uid(), resolved_at = now()
   where post_id = p_post and status = 'open';
end;
$$;

create or replace function public.moderate_restore_post(p_post uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Admins only' using errcode = '42501';
  end if;
  update public.posts set is_removed = false, removed_reason = null where id = p_post;
end;
$$;

create or replace function public.resolve_report(p_report uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Admins only' using errcode = '42501';
  end if;
  if p_status not in ('resolved', 'dismissed', 'open') then
    raise exception 'Invalid status' using errcode = '22023';
  end if;
  update public.reports
     set status = p_status,
         resolved_by = case when p_status = 'open' then null else auth.uid() end,
         resolved_at = case when p_status = 'open' then null else now() end
   where id = p_report;
end;
$$;
