---
phase: 02-wizard-core
plan: 02
subsystem: wizard
tags: [clack-prompts, vitest, typescript, tdd, wizard, idempotency, conflict-validation]

requires:
  - phase: 02-wizard-core
    plan: 01
    provides: "wizard/src/config.ts (readConfig/writeConfig/buildInitialConfig), wizard/tests/wizard.test.ts (RED stubs), types.ts with UserSelections/TemplateConfig/AiMethodology/AgenticSystem"

provides:
  - "wizard/src/wizard.ts with runWizard(yesMode) and exported validateConflicts"
  - "runWizard(true) returns UserSelections without any @clack/prompts calls"
  - "runWizard(false) calls select() x2, multiselect() x1 with must-have initialValues"
  - "Idempotency guard: installed modules excluded from multiselect options"
  - "validateConflicts: deduplicates conflict pairs, returns string[] of error messages"
  - "All 23 wizard tests GREEN (was 16 GREEN + 1 failing suite)"

affects: [02-03, 03-installer]

tech-stack:
  added: ["@types/node (devDependency — required for process, node:fs, node:path)"]
  patterns:
    - "TDD: RED commit (expect.fail stubs → real assertions) then GREEN commit (wizard.ts)"
    - "Export validateConflicts separately for unit testing without wizard prompt flow"
    - "yesMode derives defaults from MODULE_REGISTRY at runtime — no hardcoded ID lists"

key-files:
  created:
    - wizard/src/wizard.ts
  modified:
    - wizard/tests/wizard.test.ts
    - wizard/tsconfig.json
    - wizard/package.json

key-decisions:
  - "validateConflicts exported at module level (not nested inside runWizard) so tests can call it directly"
  - "yesMode selectedModules = must-have IDs + bmad + gsd, all filtered to availableModules — handles idempotency in --yes mode too"
  - "tsconfig rootDir changed from ./src to . to allow type-checking tests/ alongside src/"
  - "tsconfig module changed from CommonJS to ESNext to allow top-level await in test files"

patterns-established:
  - "Pattern: wizard.ts is a pure async function — no process.argv parsing, no config writes — caller (index.ts) handles those"
  - "Pattern: conflict validation called after both yesMode selection and interactive multiselect, before outro()"

requirements-completed: [WIZ-02, WIZ-04, WIZ-05, WIZ-06, AI-01, AI-02, AI-03]

duration: 15min
completed: 2026-03-15
---

# Phase 2 Plan 02: Wizard Core Implementation Summary

**runWizard() with --yes mode, idempotency guard, conflict validation, and @clack/prompts prompt sequence — all wizard.test.ts stubs GREEN**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-03-15T03:11:00Z
- **Completed:** 2026-03-15T03:15:00Z
- **Tasks:** 1 (TDD: RED + GREEN commits)
- **Files modified:** 4

## Accomplishments

- Implemented wizard/src/wizard.ts with full runWizard() and exported validateConflicts()
- --yes mode: returns must-have + bmad + gsd without calling any prompt functions
- Interactive mode: select() x2 (AI methodology, agentic system) + multiselect() x1 (modules with initialValues)
- Idempotency: reads existingConfig at start, excludes installState=installed modules from multiselect options
- Conflict validation after selection (both modes) — exits before outro() if conflicts detected
- Fixed pre-existing tsconfig.json bugs that blocked TypeScript strict compilation

## Task Commits

1. **TDD RED: Add real failing test assertions** - `a88bdbb` (test)
2. **TDD GREEN: Implement wizard.ts + fix tsconfig** - `56396da` (feat)

## Files Created/Modified

- `wizard/src/wizard.ts` - runWizard(yesMode) and validateConflicts(), 115 lines
- `wizard/tests/wizard.test.ts` - Replaced expect.fail() stubs with real test assertions (7 tests)
- `wizard/tsconfig.json` - Fixed rootDir and module settings for type correctness
- `wizard/package.json` + `wizard/package-lock.json` - Added @types/node devDependency

## Decisions Made

- validateConflicts exported at module level (not nested) so it can be tested directly without mocking the full prompt flow
- yesMode module selection uses runtime derivation from MODULE_REGISTRY (priority === 'must-have') plus hardcoded 'bmad'/'gsd' — both filtered through availableModules so idempotency applies in --yes mode too
- tsconfig module: CommonJS → ESNext to allow top-level `await import()` in test files (pre-existing issue)
- tsconfig rootDir: ./src → . to include tests/ in type-check scope (pre-existing issue)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] tsconfig.json rootDir mismatch prevented TypeScript compilation**
- **Found during:** Task 1 verification (`npx tsc --noEmit`)
- **Issue:** `rootDir: "./src"` but `include` contained `tests/**/*` — TS6059 error for all test files
- **Fix:** Changed rootDir to `"."` to cover both src/ and tests/
- **Files modified:** wizard/tsconfig.json
- **Verification:** `npx tsc --noEmit` — no errors
- **Committed in:** 56396da (feat commit)

**2. [Rule 1 - Bug] tsconfig.json module: CommonJS blocked top-level await in tests**
- **Found during:** Task 1 verification (`npx tsc --noEmit`)
- **Issue:** `module: "CommonJS"` causes TS1378 on top-level `await import()` in config.test.ts
- **Fix:** Changed module to `"ESNext"` (tsup handles CJS output; tsconfig is for type-checking only)
- **Files modified:** wizard/tsconfig.json
- **Verification:** `npx tsc --noEmit` — no errors
- **Committed in:** 56396da (feat commit)

**3. [Rule 2 - Missing Critical] @types/node missing from devDependencies**
- **Found during:** Task 1 verification (`npx tsc --noEmit`)
- **Issue:** `process`, `node:fs`, `node:path` unresolvable without Node.js type declarations
- **Fix:** `npm install --save-dev @types/node`
- **Files modified:** wizard/package.json, wizard/package-lock.json
- **Verification:** `npx tsc --noEmit` — no errors
- **Committed in:** 56396da (feat commit)

---

**Total deviations:** 3 auto-fixed (2 Rule 1 bugs, 1 Rule 2 missing critical)
**Impact on plan:** All three were pre-existing bugs in tsconfig/package.json that blocked the `npx tsc --noEmit` success criterion. No scope creep — fixes enable the stated verification gate.

## Issues Encountered

None beyond the pre-existing tsconfig bugs above.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- wizard/src/wizard.ts complete and tested; Plan 03 (integration smoke test + build verification) can proceed
- All 23 tests GREEN; TypeScript strict compilation passes
- validateConflicts exported and tested — Plan 03 integration test can import and verify

---
*Phase: 02-wizard-core*
*Completed: 2026-03-15*
