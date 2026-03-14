---
phase: 01-foundation
plan: 01
subsystem: infra
tags: [gitattributes, eol, lf, vitest, typescript, tsup, wizard, npm]

requires: []
provides:
  - ".gitattributes with eol=lf rules committed before any template files"
  - "wizard/ npm package scaffold (create-ai-template) with vitest ^4"
  - "Wave 0 TDD RED state: registry and dependency-versions tests failing (sources in Plan 02)"
  - "gitattributes smoke test GREEN"
affects: [02-wizard-source, 03-templates, 04-ci, 05-release]

tech-stack:
  added: [vitest@^4, tsup@^8, typescript@^5.7.3, "@vitest/coverage-v8@^4"]
  patterns: ["TDD Wave 0 scaffold — write failing tests before source exists", "wizard/ as standalone CJS npm package"]

key-files:
  created:
    - .gitattributes
    - wizard/package.json
    - wizard/tsconfig.json
    - wizard/tsup.config.ts
    - wizard/vitest.config.ts
    - wizard/tests/gitattributes.test.ts
    - wizard/tests/dependency-versions.test.ts
    - wizard/tests/registry.test.ts
  modified:
    - "research/task draft.md (line endings renormalized)"

key-decisions:
  - "Used self-contained wizard/tsconfig.json (no root tsconfig exists in this repo)"
  - ".gitattributes committed as the very first artifact to prevent CRLF contamination of future Husky hook files on Windows"
  - "Wave 0 TDD: registry and dependency-versions tests intentionally RED until Plan 02 creates source files"

patterns-established:
  - "Wave 0 TDD: red tests ship before source — establishes expected shape before implementation"
  - "Git normalisation: .gitattributes must precede all other commits in a phase"

requirements-completed: [QA-05, AI-04]

duration: 3min
completed: 2026-03-15
---

# Phase 1 Plan 01: .gitattributes + Wizard Scaffold Summary

**.gitattributes with eol=lf rules committed first, then wizard/ npm package scaffolded with vitest ^4 and Wave 0 TDD red tests for MODULE_REGISTRY and dependency-version constants**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-03-15T00:30:19Z
- **Completed:** 2026-03-15T00:32:59Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments

- `.gitattributes` committed before any template files, with `* text=auto eol=lf` and `*.sh text eol=lf` rules
- Working tree renormalised (research/task draft.md converted to LF)
- `wizard/` npm package scaffold created with vitest ^4, tsup ^8, TypeScript strict mode
- Three test files created: gitattributes (GREEN), dependency-versions (RED), registry (RED)

## Task Commits

1. **Task 1: Commit .gitattributes and renormalise working tree** - `b5dc846` (chore)
2. **Task 1: Renormalise line endings** - `6994dad` (chore)
3. **Task 2: Scaffold wizard npm package** - `749485e` (feat)

## Files Created/Modified

- `.gitattributes` - CRLF normalisation rules (all files LF, shell scripts LF, binaries untouched)
- `wizard/package.json` - CJS npm package "create-ai-template" with vitest/tsup/typescript devDeps
- `wizard/tsconfig.json` - Self-contained TS config (no root tsconfig exists)
- `wizard/tsup.config.ts` - Build config targeting CJS .cjs output
- `wizard/vitest.config.ts` - Test runner config, includes tests/**/*.test.ts, 80% coverage thresholds
- `wizard/tests/gitattributes.test.ts` - Smoke test verifying .gitattributes exists and contains required rules (GREEN)
- `wizard/tests/dependency-versions.test.ts` - Tests for version constant exports (RED — source in Plan 02)
- `wizard/tests/registry.test.ts` - Tests for MODULE_REGISTRY shape and version pin integrity (RED — source in Plan 02)

## Decisions Made

- Used self-contained `wizard/tsconfig.json` because no root tsconfig.json exists in this repo
- `.gitattributes` committed as isolated first commit to ensure CRLF normalisation applies to all subsequent files, especially future Husky hook files on Windows

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 02 can now write `wizard/src/registry.ts` and `wizard/src/dependency-versions.ts` — failing tests already describe the expected shapes
- All text files in the index are LF-normalised; safe to add Husky hooks

---
*Phase: 01-foundation*
*Completed: 2026-03-15*
