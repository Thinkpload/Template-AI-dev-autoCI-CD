# Roadmap: AI Dev Template — Universal Project Setup Wizard

## Overview

Build a production-ready interactive CLI wizard distributed as an `npx` package on top of an existing BMAD v6 + GSD + CI/CD foundation. The work proceeds in a strict dependency order dictated by architecture: the module registry (data layer) ships first, the wizard prompt UI is built on top of it, the installer pipeline executes wizard selections, the auto-bugfix pipeline wires the most novel feature, and packaging + maintenance infrastructure closes the loop. Each phase delivers a coherent, independently-verifiable capability.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation** - Module registry, version pinning, template files, and line-ending guards
- [ ] **Phase 2: Wizard Core** - Interactive CLI prompt sequence, UserSelections, idempotency, and AI methodology selection
- [ ] **Phase 3: Installer Pipeline** - File merger, JSON merge, batch npm install, and code quality module activation
- [ ] **Phase 4: Auto-Bugfix Pipeline** - CI audit step, GitHub Issue creation on failure, /fix-issue slash command, and loop guards
- [ ] **Phase 5: Packaging and Maintenance** - npx package publishing, Dependabot, and template rot prevention

## Phase Details

### Phase 1: Foundation
**Goal**: The static data layer that all wizard logic depends on exists — module registry, pinned versions, pre-configured template files, and line-ending guards are committed and verified
**Depends on**: Nothing (first phase)
**Requirements**: AI-04, QA-05
**Success Criteria** (what must be TRUE):
  1. A `MODULE_REGISTRY` exists as a pure data structure where each module entry contains its npm dependencies, template directory path, and post-install scripts — with no wizard or installer logic mixed in
  2. All BMAD and GSD versions are pinned to specific semver strings in a single `dependency-versions.ts` file (no `@latest` references anywhere in the wizard package)
  3. `.gitattributes` is committed with `* text=auto eol=lf` and `*.sh text eol=lf` — cloning the repo on Windows and pushing a shell script does not introduce `\r\n` line endings
  4. Template config directories exist for each module (`templates/eslint/`, `templates/husky/`, `templates/vitest/`, etc.) with their pre-configured config files ready to be copied
**Plans**: 4 plans

Plans:
- [ ] 01-01-PLAN.md — .gitattributes, wizard package scaffold, and Wave 0 test infrastructure
- [ ] 01-02-PLAN.md — types.ts, dependency-versions.ts, and MODULE_REGISTRY (turns tests green)
- [ ] 01-03-PLAN.md — template files for all 6 modules (eslint, husky, vitest, tsconfig, bmad, gsd)
- [ ] 01-04-PLAN.md — CI @latest grep check and weekly version-drift workflow

### Phase 2: Wizard Core
**Goal**: Running `./setup.sh` or `npx create-ai-template` presents a complete interactive prompt sequence, collects all user selections into a `UserSelections` object, persists state to `.template-config.json`, and is idempotent on re-runs
**Depends on**: Phase 1
**Requirements**: WIZ-01, WIZ-02, WIZ-03, WIZ-04, WIZ-05, WIZ-06, WIZ-07, AI-01, AI-02, AI-03
**Success Criteria** (what must be TRUE):
  1. User runs `npx create-ai-template` and sees a `@clack/prompts` welcome banner followed by a prompt sequence covering: AI methodology (BMAD / GSD / both), agentic system (Claude Code / Cursor / VS Code), and module multi-select with Must-Have pre-checked
  2. Selecting both Prisma and Drizzle (or both Better Auth and Clerk) is impossible — the wizard presents them as radio (single-select) choices and shows a clear conflict error if an invalid state is somehow reached before any installation begins
  3. After wizard completes, `.template-config.json` exists in the project root and contains the selected modules, their install state, and the wizard version that ran
  4. Re-running the wizard skips all modules marked as installed in `.template-config.json` and shows a "already installed — skipping" message for each
  5. Running `npx create-ai-template --yes` completes without any interactive prompts using sensible defaults, and a failed module install logs the error and continues — summarizing all failures at the end
**Plans**: TBD

### Phase 3: Installer Pipeline
**Goal**: Every selected code quality module is correctly installed into the target project — Husky pre-commit hook fires on staged files, commitlint enforces conventional commits, Vitest runs and reports coverage, and SonarCloud receives the coverage report
**Depends on**: Phase 2
**Requirements**: QA-01, QA-02, QA-03, QA-04
**Success Criteria** (what must be TRUE):
  1. After wizard selects Husky + lint-staged, a `git commit` with a staged file triggers the pre-commit hook and runs the linter on that file only
  2. After wizard selects commitlint, a commit with a message that does not follow conventional commits format (e.g., `"fixed stuff"`) is rejected by the commit-msg hook with a descriptive error
  3. After wizard selects Vitest, `npm test` runs and produces a `coverage/lcov.info` file — the CI pipeline uploads this file to SonarCloud without any manual configuration
  4. Coverage thresholds are enforced: `npm test` fails if statements, functions, or lines fall below 80%, or branches below 70%
**Plans**: TBD

### Phase 4: Auto-Bugfix Pipeline
**Goal**: A CI failure automatically opens a structured GitHub Issue, a developer can run `/fix-issue <number>` in Claude Code to trigger an AI fix attempt, the workflow cannot loop infinitely, and it stops after 3 failed attempts
**Depends on**: Phase 3
**Requirements**: CI-01, CI-02, CI-03, CI-04, CI-05
**Success Criteria** (what must be TRUE):
  1. `npm audit --audit-level=high` runs as a CI step and causes the pipeline to fail with a non-zero exit code when a high or critical vulnerability is present
  2. When any CI job fails, a GitHub Issue is automatically created within the same workflow run containing: the failing job name, an excerpt of the error log, the commit SHA, and the branch name — all in a structured format
  3. A developer running `/fix-issue 42` inside Claude Code triggers the GSD slash command handler, which reads Issue #42, applies a code fix, and opens a PR — without requiring any manual copy-paste of issue content
  4. The auto-bugfix workflow uses `GITHUB_TOKEN` (not a PAT) and includes an `if: github.actor != 'github-actions[bot]'` guard — pushing a fix commit does not re-trigger the workflow
  5. After 3 consecutive failed fix attempts on the same issue, the workflow stops creating new fix PRs and adds a `needs-human` label to the issue
**Plans**: TBD

### Phase 5: Packaging and Maintenance
**Goal**: The wizard is installable via `npx` on macOS, Linux, and Windows (WSL), ships as a correctly-built CJS package, and the template repo has Dependabot configured to prevent dependency rot
**Depends on**: Phase 4
**Requirements**: SEC-01
**Success Criteria** (what must be TRUE):
  1. Running `npx create-ai-template` on macOS, Linux, and Windows (WSL2) completes the full wizard flow without platform-specific errors — verified by a CI matrix job targeting `ubuntu-latest`, `macos-latest`, and `windows-latest`
  2. `.github/dependabot.yml` is committed to the template repo — Dependabot opens weekly PRs grouped by minor+patch updates, and patch-only bumps are configured for automerge
  3. The wizard npm package builds to CommonJS via `tsup` with a correct `bin` field — `npx create-ai-template` resolves and executes without `ERR_REQUIRE_ESM` errors
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 2/4 | In Progress|  |
| 2. Wizard Core | 0/TBD | Not started | - |
| 3. Installer Pipeline | 0/TBD | Not started | - |
| 4. Auto-Bugfix Pipeline | 0/TBD | Not started | - |
| 5. Packaging and Maintenance | 0/TBD | Not started | - |
