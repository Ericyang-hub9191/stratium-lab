# Stratium Lab Automation Policy

## Purpose

This policy defines boundaries for unattended ChatGPT and Codex work. It supplements—and never overrides—Eric's current instruction, `STRATIUM_PRODUCT_CONSTITUTION.md`, approved decisions in `STRATIUM_DECISION_LOG.md`, and `AGENTS.md`.

The current product stage is customer and problem validation. Automation must optimize for evidence and validated learning, not code volume.

## Eligible Work

An unattended builder may process only one open GitHub issue per run, and only when:

- its title begins with `[agent-ready]`;
- it states `Approved for agent execution: Yes`;
- acceptance criteria and verification are complete;
- it belongs in the current product stage;
- it requires no unresolved product decision;
- it can be completed on an isolated branch or worktree; and
- it does not overlap another active pull request.

Otherwise, report the blocker and make no changes.

## Permitted Unattended Actions

- Inspect repository state and governing documents.
- Implement the minimum change required by one eligible issue.
- Add or improve tests within scope.
- Run formatting, linting, type checking, builds, and relevant QA.
- Update documentation required by the change.
- Commit on an isolated branch.
- Open or update a draft pull request.
- Address bounded CI or review findings caused by the same change.

## Human Approval Required

Stop and request Eric's approval before:

- changing the target customer, product category, positioning, payment thesis, product stage, or a constitutional principle;
- treating a working hypothesis as validated;
- adding a constitutionally deferred feature;
- changing pricing, monetization, or external promises;
- contacting users, publishing research, or accepting payment;
- changing authentication, authorization, secrets, billing, production data, or production infrastructure;
- applying a destructive or irreversible database migration;
- deploying, merging, enabling auto-merge, or pushing directly to `main`;
- deleting or broadly rewriting existing product code or content;
- resolving a conflict between historical plans and current governance; or
- expanding scope merely to keep an automation busy.

## Branch and Pull Request Rules

- Never work directly on `main`.
- Use one branch or worktree per issue.
- Open pull requests as drafts; never merge or deploy them.
- Re-read the current `main` head before publishing changes.
- Stop if Base44, another bot, or a person changed overlapping files during the run.
- Preserve unrelated changes.
- Include the issue reference, Stratium Alignment block, exact checks, results, risks, and remaining limitations.
- Visual changes require rendered inspection and screenshots when supported.

## Verification Baseline

For application-code changes, run at minimum:

```bash
npm ci
npm run lint
npm run typecheck
npm run build
git diff --check
```

The repository has known pre-existing type-checking debt. Until repaired, type checking is advisory. Agents must show its exact result and must not introduce additional errors.

No automated test command currently exists. Never claim tests passed when no test suite ran.

## Stop Conditions

Stop safely when the queue is empty, requirements are ambiguous, credentials are unavailable, verification cannot separate new regressions from existing debt, the task conflicts with the Constitution, unexpected authority is requested, or human judgment is necessary.

## Concurrency and Reporting

Until this workflow is proven:

- process no more than one issue per run;
- allow no more than two concurrent automation branches;
- do not start overlapping tasks;
- prefer finishing an existing pull request over starting more work.

Every run must report one of:

- `Draft PR ready for review`
- `Blocked — Eric decision required`
- `No eligible task`
- `Verification failed — no merge requested`

Progress is measured by validated, reviewed increments—not agent runtime, commit count, or code volume.
