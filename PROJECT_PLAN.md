# Stratium Lab Big-Picture Plan

This file is the roadmap and source of truth for future Codex tasks in Stratium Lab.

Stratium Lab is for ambitious AI users who already use AI but often get generic, shallow, or unreliable results. This includes university-bound students, university students, ambitious high school graduates, early-career professionals, working professionals, and builders/founders who want to use AI more effectively for study, work, productivity, and projects.

Product promise: Stratium Lab helps ambitious learners and professionals turn AI from a generic chatbot into a sharper thinking and productivity partner.

## Summary

- Recommendation: stay on Base44 for the next private-beta phase, but run it as a hybrid product with GitHub sync, canonical content files, analytics, and a written migration path.
- Reason: Stratium Lab has about 0 users, so the highest-value work is proving the learning loop, not rebuilding infrastructure. Base44 already supports custom domains, backend functions, model selection, and GitHub integration on Builder+ plans, while a full-code stack would slow validation.
- Migration default when needed: Next.js + TypeScript + Tailwind + Supabase + Vercel + direct AI-provider APIs. This becomes the main path only after traction or control/cost pressure.

## Platform Decision

- Use Base44 through private beta and early launch:
  - Connect `stratiumlab.com`.
  - Deploy the Synthetica -> Stratium Lab rename.
  - Enable GitHub sync for version history and local code review.
  - Keep content JSON as the portable source of truth.
- Treat Base44 as a speed layer, not permanent destiny:
  - Base44 GitHub sync is Builder+ and automatic/permanent, so set it up deliberately and document the workflow before heavy changes.
  - Base44 exported app code is React/Vite; some backend resources/entities may require separate CLI/export handling, so do not assume GitHub sync alone equals total platform independence.
  - Base44 eject can clone an existing app into a separate local project, but it creates an empty database, so use it for migration rehearsal, not as the first live workflow.
- Migration trigger:
  - 500 weekly active users, first meaningful paid signal, Base44 credit/cost pain, blocked feature control, or serious analytics/data export limits.
  - At trigger, rebuild into Next.js/Supabase/Vercel.

## 30-Day Product Plan

- Goal: prove first-session activation for ambitious AI users, starting with students/early-career users and working professionals who already use AI but are dissatisfied with generic output.
- Target release: private beta with 10-25 known testers.
- Activation definition: a user completes one core exercise, sees a better AI result in their own AI tool, and submits a reflection in one sitting.
- Week 1:
  - Ship rename and domain.
  - Set up GitHub sync and a simple release discipline.
  - Install PostHog or equivalent event analytics.
- Week 2:
  - Rework onboarding around one promise: "Stop getting generic AI output."
  - Make the first boost the clearest possible proof of the product thesis.
  - Add lightweight feedback prompts after the first completed exercise.
- Weeks 3-4:
  - Run private beta manually.
  - Watch where users stall.
  - Improve onboarding, first boost, grading feedback, and review prompts before writing many new boosts.

## Public Interfaces And Data

- Add analytics events:
  - `signup_started`
  - `onboarding_completed`
  - `boost_started`
  - `prompt_copied`
  - `reflection_submitted`
  - `practice_feedback_viewed`
  - `boost_completed`
  - `first_session_proof_completed`
  - `review_started`
  - `review_completed`
- Keep content architecture stable:
  - Continue using journey/boost JSON as canonical content.
  - Do not change the 12 block types unless a real authoring need appears.
  - Add review questions for boosts #1 and #2 before expanding to 15 more boosts.
- Keep AI grading positioning learner-facing:
  - Say "specific feedback" and "see what your prompt is missing," not "AI grader" as a headline.

## Test Plan

- Product acceptance:
  - At least 15 private-beta testers invited.
  - At least 60% complete the first-session proof.
  - Median time to first meaningful exercise completion under 12 minutes.
  - At least 5 testers can describe, in their own words, what changed in their AI output.
- Platform acceptance:
  - `stratiumlab.com` resolves correctly with SSL.
  - GitHub sync works and a local clone can run the app.
  - Analytics captures the full first-session funnel.
  - Content JSON can be exported and inspected outside Base44.
- Qualitative review:
  - Watch at least 5 sessions or review recordings.
  - Collect friction notes on onboarding, copying prompts, submitting reflections, and interpreting feedback.

## Assumptions

- You are on, or are willing to use, Base44 Builder+ for domain, backend functions, model selection, and GitHub sync.
- The first audience is ambitious AI users who already use AI but get generic or unreliable results. This includes university-bound students, university students, ambitious high school graduates, early-career professionals, working professionals, and builders/founders who want to use AI more effectively for study, work, productivity, and projects.
- The next milestone is activation, not content volume, public launch, or monetization.
- We are not migrating immediately unless Base44 blocks a core learning-loop feature.

## Current Known Technical Issues

- `npm run typecheck` currently fails because of pre-existing errors that were not caused by the previous PR, "Polish reading and review visual states".
- Treat unrelated typecheck failures as existing technical debt unless a task explicitly scopes work to them.

## Completed Changes

- The previous PR, "Polish reading and review visual states", has already been merged.
- Lint passed for that PR.
- Build passed for that PR.

## Codex Workflow Rules

- Treat `PROJECT_PLAN.md` as the roadmap and source of truth for future Codex tasks.
- Keep future Codex tasks small and scoped.
- Before editing, inspect relevant files and explain the plan.
- Make only changes that match the requested task boundary.
- Avoid unrelated refactors.
- Do not fix unrelated typecheck errors unless the task explicitly asks for it.
- After app-code edits, run lint and build.
- Record completed roadmap-relevant work here only when a task specifically asks to update the roadmap.
