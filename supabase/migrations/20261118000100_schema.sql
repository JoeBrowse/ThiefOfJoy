-- Thief of Joy: core schema
-- Every score in this database is SUBJECTIVE: a user's satisfaction (1-10)
-- relative to their own standards. Nothing here stores or derives scores
-- from objective metrics such as income, weight or job title.

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique check (username ~ '^[a-z0-9_]{3,20}$'),
  display_name text check (char_length(display_name) <= 50),
  bio text check (char_length(bio) <= 280),
  show_on_leaderboard boolean not null default true,
  public_category_scores boolean not null default false,
  public_goals boolean not null default false,
  onboarded_at timestamptz,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.profiles.show_on_leaderboard is 'User opts in/out of appearing on the leaderboard.';
comment on column public.profiles.public_category_scores is 'If true, other signed-in users can see this user''s 15 category scores on their profile.';
comment on column public.profiles.public_goals is 'If true, goals the user marked as shareable are visible on their profile.';

-- ---------------------------------------------------------------------------
-- Assessment content (mirrors src/lib/content/categories.ts)
-- ---------------------------------------------------------------------------
create table public.life_categories (
  id text primary key,
  position int not null unique,
  name text not null,
  short_name text not null
);

create table public.assessment_questions (
  id text primary key,
  category_id text not null references public.life_categories (id),
  position int not null,
  prompt text not null,
  is_active boolean not null default true
);
create index on public.assessment_questions (category_id);

-- ---------------------------------------------------------------------------
-- Assessment sessions & answers
-- kind = 'full'      -> guided assessment across all 15 categories
-- kind = 'category'  -> re-answering the questions of a single category
-- ---------------------------------------------------------------------------
create table public.assessment_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('full', 'category')),
  category_id text references public.life_categories (id),
  status text not null default 'in_progress' check (status in ('in_progress', 'completed', 'abandoned')),
  current_step int not null default 0,
  started_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  check (kind = 'full' or category_id is not null)
);
create index on public.assessment_sessions (user_id, status);

create table public.question_answers (
  session_id uuid not null references public.assessment_sessions (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  question_id text not null references public.assessment_questions (id),
  score smallint check (score between 1 and 10), -- null = explicitly skipped
  updated_at timestamptz not null default now(),
  primary key (session_id, question_id)
);
create index on public.question_answers (user_id);

create table public.session_category_notes (
  session_id uuid not null references public.assessment_sessions (id) on delete cascade,
  category_id text not null references public.life_categories (id),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  note text not null check (char_length(note) <= 2000),
  updated_at timestamptz not null default now(),
  primary key (session_id, category_id)
);

-- ---------------------------------------------------------------------------
-- Scores (written only by SECURITY DEFINER functions, never directly)
-- ---------------------------------------------------------------------------
create table public.category_scores (
  user_id uuid not null references public.profiles (id) on delete cascade,
  category_id text not null references public.life_categories (id),
  -- average of answered questions (or a manual adjustment)
  base_score numeric(4, 2) not null check (base_score between 1 and 10),
  -- effective score: base score blended with any goals the user linked to
  -- this category with "counts towards category" switched on
  score numeric(4, 2) not null check (score between 1 and 10),
  previous_score numeric(4, 2),
  answered_count int not null default 0,
  source text not null check (source in ('assessment', 'manual')),
  last_session_id uuid references public.assessment_sessions (id) on delete set null,
  updated_at timestamptz not null default now(),
  primary key (user_id, category_id)
);

create table public.category_score_history (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  category_id text not null references public.life_categories (id),
  previous_score numeric(4, 2),
  new_score numeric(4, 2) not null,
  source text not null check (source in ('assessment', 'manual', 'goal')),
  session_id uuid references public.assessment_sessions (id) on delete set null,
  note text check (char_length(note) <= 2000),
  created_at timestamptz not null default now()
);
create index on public.category_score_history (user_id, created_at desc);

create table public.user_stats (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  life_score numeric(4, 1) check (life_score between 0 and 100), -- percentage, 1 dp
  previous_life_score numeric(4, 1),
  categories_scored int not null default 0,
  is_complete boolean not null default false,
  score_updated_at timestamptz,
  score_reached_at timestamptz, -- when the current score value was first reached (tie-break)
  current_rank int,
  previous_rank int,
  rank_changed_at timestamptz
);
create index on public.user_stats (current_rank);

create table public.life_score_history (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  life_score numeric(4, 1) not null,
  previous_life_score numeric(4, 1),
  categories_scored int not null,
  is_complete boolean not null,
  source text not null,
  category_id text references public.life_categories (id),
  created_at timestamptz not null default now()
);
create index on public.life_score_history (user_id, created_at);

create table public.leaderboard_history (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  rank int,
  previous_rank int,
  life_score numeric(4, 1),
  created_at timestamptz not null default now()
);
create index on public.leaderboard_history (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Custom goals / variables
-- ---------------------------------------------------------------------------
create table public.custom_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  description text check (char_length(description) <= 1000),
  start_score smallint not null check (start_score between 1 and 10),
  current_score smallint not null default 1 check (current_score between 1 and 10), -- set from start_score by trigger
  target_score smallint not null check (target_score between 1 and 10),
  target_date date,
  category_id text references public.life_categories (id),
  counts_toward_category boolean not null default false,
  is_public boolean not null default false,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (not counts_toward_category or category_id is not null)
);
create index on public.custom_goals (user_id);

create table public.custom_goal_updates (
  id bigint generated always as identity primary key,
  goal_id uuid not null references public.custom_goals (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  previous_score smallint,
  new_score smallint not null check (new_score between 1 and 10),
  note text check (char_length(note) <= 1000),
  created_at timestamptz not null default now()
);
create index on public.custom_goal_updates (goal_id, created_at);

-- ---------------------------------------------------------------------------
-- Community
-- ---------------------------------------------------------------------------
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid default auth.uid() references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) between 3 and 200),
  body text not null default '' check (char_length(body) <= 20000),
  category_id text references public.life_categories (id),
  custom_category text check (char_length(custom_category) between 2 and 40),
  score int not null default 0,
  comment_count int not null default 0,
  last_activity_at timestamptz not null default now(),
  is_removed boolean not null default false,
  removed_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  edited_at timestamptz,
  search tsvector generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(body, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(custom_category, '')), 'C')
  ) stored,
  -- exactly one of: a core category, or "Other" with a custom name
  check ((category_id is null) <> (custom_category is null))
);
create index on public.posts (created_at desc);
create index on public.posts (score desc);
create index on public.posts (last_activity_at desc);
create index on public.posts (category_id);
create index on public.posts using gin (search);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  parent_id uuid references public.comments (id) on delete cascade,
  author_id uuid default auth.uid() references public.profiles (id) on delete set null,
  body text not null check (char_length(body) between 1 and 10000),
  score int not null default 0,
  depth int not null default 0,
  is_deleted boolean not null default false,
  is_removed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  edited_at timestamptz
);
create index on public.comments (post_id, created_at);
create index on public.comments (parent_id);

create table public.post_votes (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  value smallint not null check (value in (-1, 1)),
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table public.comment_votes (
  comment_id uuid not null references public.comments (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  value smallint not null check (value in (-1, 1)),
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid default auth.uid() references public.profiles (id) on delete set null,
  post_id uuid references public.posts (id) on delete cascade,
  comment_id uuid references public.comments (id) on delete cascade,
  reason text not null check (char_length(reason) between 3 and 500),
  status text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  resolved_by uuid references public.profiles (id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  check ((post_id is null) <> (comment_id is null))
);
create index on public.reports (status, created_at desc);
