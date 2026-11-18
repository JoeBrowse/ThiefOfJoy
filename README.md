# Thief of Joy

**Your score. Your standards. Your life.**

Thief of Joy is a web app for scoring, tracking and improving how satisfied you are across 15 areas of life. The scores combine into a single **Life Score** out of 100. You can track it over time, set personal goals, compare with friends on an opt-in leaderboard, and talk it through in a Reddit-style community.

> Comparison is the thief of joy, so every score here is measured against **your own** expectations, not society's. Nothing is calculated from income, weight, job title or relationship status. The user is the only authority on their score.

Stack: **Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · shadcn/ui (Base UI) · Supabase (Postgres, Auth, RLS) · Vercel**.

---

## Contents

- [Features](#features)
- [Run it locally](#run-it-locally)
- [Set up Supabase (production)](#set-up-supabase-production)
- [Deploy with GitHub + Vercel](#deploy-with-github--vercel)
- [Environment variables](#environment-variables)
- [How scoring works](#how-scoring-works)
- [Leaderboard rules](#leaderboard-rules)
- [Privacy model](#privacy-model)
- [Project structure](#project-structure)
- [Editing questions and categories](#editing-questions-and-categories)
- [Moderation and admins](#moderation-and-admins)
- [Decisions and assumptions](#decisions-and-assumptions)
- [What's next](#whats-next)

---

## Features

| Area | What works |
| --- | --- |
| **Accounts** | Email/password sign-up with a unique username, email confirmation (if enabled), password reset, log out, and permanent account deletion. |
| **Onboarding** | A three-step welcome that explains the subjective-scoring philosophy with examples. |
| **Assessment** | 15 categories and 93 questions (4–8 per category). One question at a time, a 1–10 picker with anchors, skip any question, autosave after every answer, and resume later. Progress shows across all categories and within the current one. You can jump back to any answer, add a private reflection per category, and review everything before submitting. Keyboard shortcuts: `1`–`9`, `0` = 10, `S` = skip, `←`/`→`. |
| **Score reveal** | Animated gauge, strongest and weakest areas, incomplete-category warning, and the prompt *"Is there anything else you'd like to track?"* |
| **Dashboard** | Life Score gauge (current, previous, change, rank, last updated), history chart, all 15 category cards with trend and sorting, goals, and a recent-changes feed. |
| **Updating** | Per category: **re-answer its questions** or make a **quick update** (a 1.0–10.0 slider with a Life Score preview), each with an optional private note. The Life Score and leaderboard recalculate immediately, and every change is saved to history. |
| **Goals** | Custom variables with a name, description, start and target scores (1–10), target date, optional category, an optional "counts towards category" setting, and a shareable setting. Log updates with notes, view a progress chart, archive or delete. |
| **Leaderboard** | Rank, username, Life Score, score change, and movement arrows based on actual rank changes (green ↑ when you overtake, red ↓ when you're overtaken). Includes rank history and documented tie-breaking. |
| **Profiles** | Public profile showing only what the user chooses: score and rank, category scores, shareable goals, posts. |
| **Community** | Threads with Markdown, tagged with one of the 15 categories or "Other" plus a custom name. Unlimited nested replies (collapsible), up/down votes, sorting (newest, most popular, most active), category filter, full-text search, report, delete own content, and admin moderation. |
| **Quality** | Loading skeletons, empty states, error boundary, toasts, confirmation dialogs, validation, keyboard navigation, screen-reader labels, reduced-motion support, and a mobile-first layout with a bottom tab bar. |

---

## Run it locally

Requirements: **Node 20.9+**, and **Docker** for the local Supabase stack.

```bash
git clone <your-repo-url> thief-of-joy && cd thief-of-joy
npm install
npm run db:start          # local Postgres + Auth via the Supabase CLI; applies every migration
cp .env.example .env.local
```

Put the local values into `.env.local`. `npx supabase status` prints them:

```
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<the "Publishable" key from supabase status>
```

```bash
npm run dev               # http://localhost:3000
```

Locally, email confirmation is off (`supabase/config.toml`), so sign-up logs you straight in.

Useful scripts:

| Script | Does |
| --- | --- |
| `npm run check` | Lint, typecheck and production build |
| `npm run db:test` | Database smoke test against the **local** stack: scoring maths, equal category weighting, overtaking indicators, goal blending, RLS privacy, community and account deletion (32 checks) |
| `npm run db:reset` | Rebuild the local database from migrations |
| `npm run db:types` | Regenerate `src/lib/supabase/database.types.ts` after schema changes |
| `npm run db:generate-seed` | Regenerate the questions migration after editing `categories.ts` |

> **Note:** if your shell already exports `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY`, those values override `.env.local`. Unset them first.

---

## Set up Supabase (production)

The free tier is plenty for a pilot.

1. **Create a project** at [supabase.com](https://supabase.com/dashboard). Pick a region near your friends and save the database password.
2. **Apply the database schema.** Either:
   - **CLI (recommended):**
     ```bash
     npx supabase login
     npx supabase link --project-ref <your-project-ref>
     npx supabase db push
     ```
   - **or the SQL Editor:** paste each file in `supabase/migrations/` and run them **in filename order**.
3. **Configure Auth** (Dashboard → Authentication → URL Configuration):
   - **Site URL:** your production URL, e.g. `https://thief-of-joy.vercel.app`
   - **Redirect URLs:** add `https://thief-of-joy.vercel.app/**` and `http://localhost:3000/**`. For Vercel preview deployments, also add `https://*-<your-vercel-team>.vercel.app/**`.
4. **Email confirmation** (Authentication → Sign In / Providers → Email):
   - Supabase's built-in email sender is rate-limited to a handful of emails per hour. That's fine for testing, but tight if several friends sign up at once.
   - For a small trusted pilot, the simplest option is to **turn off "Confirm email"**.
   - To keep confirmation on, set up a custom SMTP provider (Authentication → Emails → SMTP), e.g. [Resend](https://resend.com) (free tier).
5. **Copy your keys** (Project Settings → API Keys): the project URL and the **publishable** key (or the legacy `anon` key). You never need the service-role key.
6. **Make yourself an admin** after you sign up (SQL Editor):
   ```sql
   update public.profiles set is_admin = true where username = 'your_username';
   ```

---

## Deploy with GitHub + Vercel

1. Push this repo to GitHub.
2. In [Vercel](https://vercel.com/new), **Import** the repository. The framework (Next.js) is detected automatically, so you don't need any build settings.
3. Add the [environment variables](#environment-variables) for Production and Preview.
4. **Deploy**, then put the production URL into Supabase's Site URL and Redirect URLs (step 3 above).
5. Share `https://<your-app>/signup` with friends. There's also an **Invite friends** button in the app.

After that, every push to `main` redeploys production, and every pull request gets its own preview URL. GitHub Actions (`.github/workflows/ci.yml`) runs lint, typecheck and build, then starts a throwaway Supabase stack, applies all migrations and runs the scoring/RLS test suite.

**Changing the database later:** add a new file to `supabase/migrations/` (never edit one that has already been applied), test it with `npm run db:reset && npm run db:test`, then run `npx supabase db push` against production.

---

## Environment variables

| Name | Required | Where to find it |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase → Project Settings → Data API |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | ✅ | Supabase → Project Settings → API Keys (publishable). `NEXT_PUBLIC_SUPABASE_ANON_KEY` is accepted as a fallback. |
| `NEXT_PUBLIC_SITE_URL` | optional | Your public URL. Auto-detected on Vercel. |

There are no other secrets. Both values are public by design, and every table is protected by Row Level Security. If the variables are missing, the app shows a `/setup` page instead of crashing.

---

## How scoring works

The database is the source of truth: see `supabase/migrations/*_functions.sql`. `src/lib/scoring.ts` mirrors the same rules for live previews.

1. **Question scores:** each answered question is 1–10. Skipped questions are ignored.
2. **Category score:** the average of that category's answered questions, e.g. Physical Health 7, 8, 6, 9, 7 → **7.4**.
3. **Life Score:** the average of the category scores, **each category weighted equally** regardless of how many questions it has, then converted to a percentage:

   `Life Score % = (average of category scores ÷ 10) × 100`, rounded to one decimal.

   Example: the 15 scores from the spec average 7.37 → **73.7%**.
4. **Incomplete categories:** a category with no answers is **never counted as zero**. The Life Score is calculated from the scored categories, marked **incomplete** in the UI with an explanation, and excluded from the leaderboard. The review screen encourages finishing first.
5. **Updates:** re-answering a category replaces its score with the new average. A quick update sets it directly (1.0–10.0). If you skip a whole category in a retake, its previous score is kept.
6. **Goals:** goals do **not** affect the Life Score by default. If you link a goal to a category **and** switch on "Count towards this category's score", it counts as **one extra question** in that category:
   `category = (base average × answered questions + Σ linked goal scores) ÷ (answered questions + linked goals)`.

Every change writes to `category_score_history` and `life_score_history`, which feed the charts and the History page.

---

## Leaderboard rules

- **Eligibility:** you have a username, you've scored **all 15 categories**, and "Appear on the leaderboard" is on (the default; you can opt out at any time).
- **Order:** Life Score, highest first.
- **Tie-break:** if two people have exactly the same Life Score, **whoever reached that score first ranks higher**, then alphabetical by username. Every rank is unique.
- **Movement indicators** compare your current rank with your rank **before your last movement**:
  - **↑ N places (green):** you moved up, i.e. overtook someone.
  - **↓ N places (red):** you were overtaken, or your score dropped.
  - **New:** first time ranked.

  These are based on actual position changes, not score changes. They stay visible until your position changes again.
- Every movement is stored in `leaderboard_history`, and recent rank history appears on profiles.

---

## Privacy model

| Data | Who can see it |
| --- | --- |
| Individual question answers, reflections, goal update notes, score history | **Only you**, always |
| Life Score, rank, movement | Signed-in members, **only if you're on the leaderboard** |
| 15 category scores | Only you, unless you enable *Show category scores on my profile* |
| Goals | Only you, unless the goal is marked *Shareable* **and** you enable *Show shareable goals* |
| Username, display name, bio, posts and comments | Signed-in members |
| Email address | Only you (never stored in public tables) |

This is enforced in Postgres with Row Level Security, not just hidden in the UI. Users can't write scores directly (only through `SECURITY DEFINER` functions), can't make themselves admin, and can't tamper with vote counts. `npm run db:test` checks these rules.

**Deleting your account** removes your profile, scores, history, goals, votes and posts. Your comments on other people's threads are anonymised to `[deleted]` so conversations stay readable.

---

## Project structure

```
src/
  app/
    page.tsx                  Landing page
    (auth)/                   login, signup, forgot/reset password
    auth/callback, signout    Email-link + session routes
    (app)/                    Signed-in app (shared nav layout)
      welcome/                Onboarding & philosophy
      assessment/             Guided assessment + result reveal
      dashboard/  history/
      categories/[id]/        Category detail, /update re-answers questions
      goals/  leaderboard/  u/[username]/
      community/              List, new, [id] thread
      profile/  admin/
    actions/                  Server actions (profile, goals, community)
  components/                 Gauge, score picker, charts, nav, community, goals…
    ui/                       shadcn/ui components
  lib/
    content/categories.ts     ← the 15 categories & 93 questions (single source of truth)
    scoring.ts  supabase/  auth.ts  data.ts
  proxy.ts                    Session refresh + route protection (Next 16 "proxy", formerly middleware)
supabase/
  migrations/                 Schema, scoring functions, RLS, question content
  config.toml                 Local stack config
scripts/                      Seed generator, DB smoke test
```

---

## Editing questions and categories

Edit `src/lib/content/categories.ts`, then:

```bash
npm run db:generate-seed      # writes a new supabase/migrations/<timestamp>_sync_content.sql
npm run db:reset && npm run db:test
npx supabase db push          # apply to production
```

Never rename an existing question `id`, because historical answers reference it. Removed questions are marked inactive, never deleted. CI fails if the TS file and the latest content migration drift apart.

---

## Moderation and admins

- Any member can **report** a post or comment, and **delete** their own posts (hard delete) and comments (soft delete: replaced with `[deleted]` so replies keep their context).
- Admins (`profiles.is_admin = true`, set via SQL) get a **Moderation** page at `/admin`, available from the account menu. From there they can view open reports, remove posts (hidden but restorable) or comments, and resolve or dismiss reports. Admins can also remove content inline on threads.
- All of this is enforced in the database (`moderate_remove_post`, `delete_comment`, `resolve_report`).

---

## Decisions and assumptions

- **Name:** the product is *Thief of Joy* ("comparison is the thief of joy"). The metric is the *Life Score*.
- **Next.js 16 with Cache Components off:** every page is personal, session-based data, so plain dynamic rendering is simpler and avoids caching anyone's private data.
- **Questions live in TypeScript and are mirrored to the database** so the UI is type-safe and fast, while answers keep real foreign keys.
- **Scores are computed in Postgres**, not the browser, so leaderboard scores can't be faked from the client.
- **Leaderboard requires all 15 categories** so scores are comparable, as the brief recommends for the pilot.
- **Unique ranks with an earliest-to-reach tie-break** rather than shared ranks, so overtaking is always clear.
- **The leaderboard and profiles are members-only** (sign-in required). Only the landing page is public.
- **Quick updates** use a 0.1-step slider; question answers are whole numbers.
- **Goal scores are whole numbers 1–10.** "Target reached" is shown automatically once current ≥ target.
- **Markdown** for posts and comments, rendered safely (no raw HTML, no images).
- **No seed or demo data** is shipped. Every number you see is real.
- **No paid services:** Supabase free tier plus Vercel Hobby.

---

## What's next

Ideas for after the pilot, roughly in priority order:

- Editing posts and comments after publishing (delete works today).
- Notifications (email or in-app) when someone replies or overtakes you.
- Friend groups or private leaderboards, rather than one global board.
- Reminders to check in monthly, and streaks.
- Category-level comparisons with friends (opt-in), and richer insights (biggest movers, correlations).
- Rate limiting and spam protection for the community as it grows.
- Image uploads in posts (Supabase Storage).
- Playwright end-to-end tests in CI (the user journey was verified with Playwright during development).
