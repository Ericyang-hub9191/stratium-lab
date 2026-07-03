# Base44 Exit Plan

This document is the practical migration plan for moving Stratium Lab off Base44 before the subscription expires.

The goal is not to rebuild everything at once. The goal is to move the app to a simpler long-term stack while keeping the learning experience working:

- Vercel for frontend deployment
- Supabase for auth, database, user progress, feedback, and backend functions
- GitHub as the source of truth
- Cloudflare for DNS and domain management

## 1. Why We Are Leaving Base44

Base44 helped Stratium Lab move quickly, but it now owns too much of the app's foundation:

- Hosting is tied to Base44.
- Auth is tied to Base44.
- Entities/tables are tied to Base44.
- Backend functions are tied to Base44.
- Some AI calls use Base44 managed integrations.
- GitHub sync does not fully replace Base44's backend resources.

The immediate reason to leave is subscription timing. The strategic reason is control: the app should be able to run from GitHub, deploy on Vercel, store user data in Supabase, and use Cloudflare for the domain without depending on Base44.

## 2. Current Base44 Dependencies

Base44 is currently used in four major ways.

### Frontend SDK

The app imports a shared Base44 client from:

- `src/api/base44Client.js`

That client depends on:

- `@base44/sdk`
- `VITE_BASE44_APP_ID`
- `VITE_BASE44_APP_BASE_URL`
- optional `VITE_BASE44_FUNCTIONS_VERSION`

Base44 is also wired into the Vite build through:

- `vite.config.js`
- `@base44/vite-plugin`

### Auth

The app uses Base44 auth for:

- checking the current user
- login redirect
- logout
- account deletion
- user role checks

Important current calls:

- `base44.auth.me()`
- `base44.auth.redirectToLogin(...)`
- `base44.auth.logout(...)`
- `base44.auth.deleteMe()`

### Entities

The app uses Base44 entities for content and user data:

- `User`
- `UserStats`
- `UserProgress`
- `Streak`
- `Journey`
- `Lesson`
- `Boost`
- `Signal`

Schemas also exist for older or currently unused data:

- `Mission`
- `WinLog`

### Functions

The app uses Base44 backend functions for:

- `gradePractice`
- `generateDailySignal`

`gradePractice` is called from lesson/boost practice blocks and review screens.

`generateDailySignal` creates daily Signal content and writes it into the Base44 `Signal` entity.

## 3. Target Stack

### Vercel

Vercel should host the frontend app.

In the simplest migration, keep the existing React/Vite app first. Do not rewrite to Next.js unless there is a separate reason. A framework migration and a platform migration at the same time increases risk.

Vercel will handle:

- production frontend deploys
- preview deploys from GitHub branches
- optional serverless API routes if we choose Vercel functions instead of Supabase Edge Functions
- optional cron job for daily Signal generation

### Supabase

Supabase should replace Base44 for:

- auth
- user profiles
- database tables
- user progress
- stats
- streaks
- feedback/review state
- backend functions or RPCs

Supabase should not own the canonical lesson/boost content at first unless needed. Static learning content can stay in GitHub as JSON.

### GitHub

GitHub should become the source of truth for:

- app code
- content JSON
- migration scripts
- Supabase schema files
- deployment configuration

After the migration, changes should flow from GitHub to Vercel, not through Base44.

### Cloudflare

Cloudflare should manage:

- DNS records
- `stratiumlab.com`
- `www.stratiumlab.com`
- redirects if needed

Cloudflare should point the domain to Vercel after the app is ready.

## 4. Base44 Auth Replacement Plan

Replace Base44 auth with Supabase Auth.

Current Base44 behavior:

- `base44.auth.me()` returns the logged-in user.
- user records have `id`, `email`, `full_name`, and `role`.
- app routes assume a logged-in user.
- account deletion deletes user data and then deletes the auth user.

Supabase replacement:

- Use `supabase.auth.getUser()` instead of `base44.auth.me()`.
- Use Supabase sign-in/sign-up instead of `base44.auth.redirectToLogin()`.
- Use `supabase.auth.signOut()` instead of `base44.auth.logout()`.
- Create a `profiles` table for app-specific user fields.

Recommended profile fields:

- `id`
- `email`
- `full_name`
- `role`
- `created_at`
- `updated_at`

Important: do not delete Supabase auth users directly from the browser. Account deletion should be a server-side function because it needs privileged access.

## 5. Base44 Entity/Table Replacement Plan

Base44 entities split into two groups.

### User-owned data

This belongs in Supabase tables:

- user stats
- progress
- streaks
- review count
- saved answers
- practice submissions
- written reflections
- account/profile data

This data needs Row Level Security so users can only read and write their own rows.

### Content data

This can stay as local JSON first:

- journeys
- lessons
- boosts
- review questions inside boosts
- block content

The repo already has local JSON content under:

- `src/content/boosts`
- `src/content/journeys`

Keep this content in GitHub unless the app later needs a content editor or admin dashboard.

### Signals

Signals are daily AI-news posts. They are content, but they are generated over time.

Recommended first Supabase table:

- `signals`

This lets the frontend read Signals from Supabase and lets the daily generator insert new Signals.

## 6. Base44 Function Replacement Plan

### `gradePractice`

Current job:

- receives a user practice answer
- sends it to an AI model
- returns structured feedback
- supports rubric types like `rctf`, `brief`, `reflection`, and `match`

Replacement options:

- Supabase Edge Function: `grade-practice`
- or Vercel API route/function: `/api/grade-practice`

Recommended beginner path: use one backend function with the same request and response shape. Do not change the frontend behavior at the same time.

The new function will need:

- direct Anthropic or OpenAI API key
- the same validation rules
- the same JSON response shape
- no Base44 SDK

### `generateDailySignal`

Current job:

- checks whether today's Signal already exists
- calls Anthropic
- writes a new Signal

Replacement options:

- Vercel Cron + Vercel API route
- Supabase scheduled Edge Function

Recommended beginner path: use Vercel Cron if the frontend is already on Vercel. The function writes into Supabase.

Important: the current function and `Signal` schema do not perfectly match. Before migrating, settle the final fields:

- `date`
- `slug`
- `title`
- `teaser`
- `body`
- `source_url`
- `source_name`
- `published_at`
- `related_journey_slug`
- `related_boost_slug`

### Account deletion

Add a privileged backend function:

- `delete-account`

It should:

1. Verify the logged-in user.
2. Delete that user's progress, stats, streak, and profile rows.
3. Delete the Supabase auth user using server-side admin access.

Never expose a service-role key to browser code.

## 7. Supabase Table List

Create these tables first.

### `profiles`

Stores app-specific user profile fields.

Likely columns:

- `id`
- `email`
- `full_name`
- `role`
- `created_at`
- `updated_at`

### `user_stats`

Replaces Base44 `UserStats`.

Likely columns:

- `id`
- `user_id`
- `total_xp`
- `total_lessons_completed`
- `total_boosts_completed`
- `total_journeys_completed`
- `favorite_tracks`
- `last_activity_at`
- `created_at`
- `updated_at`

### `user_progress`

Replaces Base44 `UserProgress`.

Likely columns:

- `id`
- `user_id`
- `content_id`
- `content_type`
- `journey_id`
- `status`
- `check_answers`
- `practice_entries`
- `write_entries`
- `started_at`
- `completed_at`
- `time_spent_seconds`
- `xp_awarded`
- `last_reviewed_at`
- `review_count`
- `created_at`
- `updated_at`

Use JSONB columns for:

- `check_answers`
- `practice_entries`
- `write_entries`

### `streaks`

Replaces Base44 `Streak`.

Likely columns:

- `id`
- `user_id`
- `current_streak`
- `longest_streak`
- `last_completed_date`
- `freeze_count`
- `total_completed_days`
- `created_at`
- `updated_at`

### `signals`

Replaces Base44 `Signal`.

Likely columns:

- `id`
- `date`
- `slug`
- `title`
- `teaser`
- `body`
- `source_url`
- `source_name`
- `published_at`
- `related_journey_slug`
- `related_boost_slug`
- `created_at`
- `updated_at`

### Optional later tables

Only add these if the app needs them:

- `journeys`
- `lessons`
- `boosts`
- `missions`
- `win_logs`

Do not create database tables for content just because Base44 had entities. If GitHub JSON is enough, keep it simpler.

## 8. Environment Variables Needed

### Frontend

These can be exposed to the browser:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_POSTHOG_KEY`
- `VITE_POSTHOG_HOST`
- `VITE_APP_URL`

### Backend only

These must not be exposed to the browser:

- `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY` or `OPENAI_API_KEY`
- `CRON_SECRET`

### Remove after Base44 is gone

Remove these once no code uses Base44:

- `VITE_BASE44_APP_ID`
- `VITE_BASE44_APP_BASE_URL`
- `VITE_BASE44_FUNCTIONS_VERSION`
- `BASE44_LEGACY_SDK_IMPORTS`

Also remove:

- `@base44/sdk`
- `@base44/vite-plugin`

## 9. Migration Phases

### Phase 0: Freeze and export

Do this before changing code.

1. Stop making content schema changes.
2. Export all Base44 data.
3. Save entity schemas.
4. Save backend function code.
5. Confirm the GitHub repo has the latest app code.

Export at least:

- users
- user stats
- user progress
- streaks
- journeys
- lessons
- boosts
- signals

### Phase 1: Move content reads away from Base44

Start with content because it is the least risky.

1. Keep boosts, journeys, and lessons as local JSON.
2. Load learning content from local files instead of Base44.
3. Keep user progress on Base44 for the moment.
4. Verify these routes still work:
   - `/`
   - `/library`
   - `/journey/:slug`
   - `/lesson/:id`
   - `/boost/:id`

This phase makes the app more portable without touching auth.

### Phase 2: Replace `gradePractice`

1. Create a new `grade-practice` backend function.
2. Use direct Anthropic or OpenAI API calls.
3. Keep the frontend request and response shape the same.
4. Switch only the grading call.
5. Test:
   - practice feedback
   - review fill-in grading
   - short-answer validation
   - error states

This removes the highest-value Base44 function dependency.

### Phase 3: Set up Supabase auth

1. Create Supabase project.
2. Configure Supabase Auth.
3. Create `profiles`.
4. Add the auth adapter in the app.
5. Test sign up, sign in, sign out, and current-user loading.

Do not migrate old users until the new auth flow works.

### Phase 4: Move user data to Supabase

1. Create `user_stats`, `user_progress`, and `streaks`.
2. Add Row Level Security.
3. Import exported Base44 user data.
4. Map old Base44 user IDs to new Supabase user IDs.
5. Replace progress/stats/streak reads.
6. Replace progress/stats/streak writes.

Test these flows carefully:

- onboarding creates stats
- starting a lesson creates progress
- answering checks saves progress
- submitting practice saves feedback
- completing a lesson awards XP
- completing a boost awards XP
- streak updates once per day
- reviews update `last_reviewed_at` and `review_count`

### Phase 5: Move Signals

1. Create the `signals` table.
2. Import existing Signals.
3. Update `/signals` and `/signals/:slug` to read from Supabase.
4. Port `generateDailySignal`.
5. Schedule it with Vercel Cron or Supabase scheduling.

### Phase 6: Move deployment to Vercel

1. Connect GitHub repo to Vercel.
2. Add frontend environment variables.
3. Add backend environment variables.
4. Deploy preview.
5. Test the full app on the Vercel preview URL.

Do not move the real domain yet.

### Phase 7: Cut over Cloudflare DNS

Only do this when the Vercel app is ready.

1. Add the Vercel DNS records in Cloudflare.
2. Point `stratiumlab.com` to Vercel.
3. Point `www.stratiumlab.com` to Vercel.
4. Confirm SSL works.
5. Keep Base44 available briefly as a rollback reference.

### Phase 8: Remove Base44

After the Vercel/Supabase app is live and tested:

1. Remove Base44 SDK imports.
2. Remove Base44 Vite plugin.
3. Remove Base44 environment variables.
4. Remove unused `app/base44` backend files or archive them.
5. Cancel Base44 only after confirming production works.

## 10. Risks and What Not To Do

### Risks

- User progress could be lost if Base44 data is not exported before migration.
- Base44 user IDs may not match Supabase user IDs.
- Row Level Security mistakes could expose private progress data.
- Completion currently updates progress, stats, and streaks together; this should become a transaction or server-side RPC.
- The two `gradePractice` files are not identical, so confirm which one is actually deployed before porting.
- The current daily Signal function does not perfectly match the Signal schema.
- Account deletion requires privileged server logic.
- Moving auth and progress at the same time can break the whole app.
- Moving the domain before QA can create avoidable downtime.

### What Not To Do

- Do not rewrite the whole app while migrating platforms.
- Do not move DNS first.
- Do not delete Base44 data before exports are verified.
- Do not expose `SUPABASE_SERVICE_ROLE_KEY` in frontend code.
- Do not store private user progress in local JSON.
- Do not create Supabase tables for every Base44 entity automatically.
- Do not change lesson/boost block schemas during migration.
- Do not migrate user data without a Base44-user-to-Supabase-user mapping.
- Do not cancel Base44 until the Vercel/Supabase production app has passed full-path testing.

## Minimum Safe Cutover Checklist

Before leaving Base44 completely, confirm:

- A new user can sign up.
- A returning user can sign in.
- Home loads.
- Library loads.
- One boost can be started and completed.
- One lesson can be started and completed.
- Practice feedback works.
- Review flow works.
- XP updates.
- Streak updates.
- Progress page shows completed work.
- Account page loads.
- Account deletion works safely.
- Signals page loads.
- Daily Signal generation works or is intentionally disabled.
- Vercel production deploy works.
- Cloudflare DNS points to Vercel with SSL.

If any item fails, do not cancel Base44 yet.
