---
phase: 02-wizard-core
plan: 01
subsystem: testing
tags: [clack-prompts, vitest, typescript, tdd, wizard, config]

requires:
  - phase: 01-foundation
    provides: wizard/src/types.ts (ModuleDefinition, ModuleId, ModuleRegistry), wizard/package.json (vitest, tsup), MODULE_REGISTRY with 6 modules

provides:
  - "@clack/prompts installed in wizard/package.json dependencies"
  - "AiMethodology, AgenticSystem, UserSelections, InstallState, ModuleInstallRecord, TemplateConfig types in wizard/src/types.ts"
  - "wizard/src/config.ts with readConfig, writeConfig, buildInitialConfig (GREEN)"
  - "wizard/tests/config.test.ts: 5 passing tests (Wave 0 GREEN)"
  - "wizard/tests/wizard.test.ts: 6 failing stubs + 1 todo (Wave 0 RED — awaiting Plan 02)"
  - "setup.sh at repo root passing args to wizard/dist/index.cjs"

affects: [02-02, 02-03, 03-installer]

tech-stack:
  added: ["@clack/prompts@^1.1.0"]
  patterns:
    - "TDD Wave 0 scaffold: write failing stubs before implementation"
    - "vi.mock node:fs in config tests — no real filesystem I/O"
    - "config.ts uses node:fs + node:path (CJS-compatible, no ESM-only APIs)"

key-files:
  created:
    - wizard/src/config.ts
    - wizard/tests/config.test.ts
    - wizard/tests/wizard.test.ts
    - setup.sh
  modified:
    - wizard/src/types.ts
    - wizard/package.json

key-decisions:
  - "config.ts uses node:fs/node:path with process.cwd() for config file path — not __dirname"
  - "wizard.test.ts stubs use expect.fail() — wizard.ts does not exist until Plan 02"
  - "setup.sh replaced legacy bash-heavy script with minimal passthrough to wizard/dist/index.cjs"
  - "InstallState includes 'failed' and 'skipped' per WIZ-07 schema contract"

patterns-established:
  - "Pattern: config module isolates all file I/O so wizard.ts tests can mock it cleanly"
  - "Pattern: Wave 0 TDD — RED test stubs committed before any implementation in subsequent plans"

requirements-completed: [WIZ-01, WIZ-03, WIZ-04, WIZ-05, WIZ-06, WIZ-07, AI-01, AI-02, AI-03]

duration: 12min
completed: 2026-03-15
---

# Phase 2 Plan 01: Wave 0 Scaffold — Types, Config, and Failing Test Stubs

**@clack/prompts installed; TemplateConfig/UserSelections types + config.ts implemented (GREEN); Wave 0 RED stubs for wizard.ts and setup.sh at repo root**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-03-15T00:08:28Z
- **Completed:** 2026-03-15T00:20:00Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- Installed @clack/prompts@^1.1.0 as wizard dependency
- Extended wizard/src/types.ts with 6 new wizard-layer types (AiMethodology, AgenticSystem, UserSelections, InstallState, ModuleInstallRecord, TemplateConfig)
- Created wizard/src/config.ts with readConfig/writeConfig/buildInitialConfig fully implemented and tested
- Scaffolded wizard/tests/config.test.ts (5 tests, all GREEN) and wizard/tests/wizard.test.ts (6 RED stubs + 1 todo)
- Created setup.sh at repo root (replaces legacy script; passes all args to wizard/dist/index.cjs)

## Task Commits

1. **Task 1: Install @clack/prompts, extend types.ts, create config.ts** - `0ec89b3` (feat)
2. **Task 2: Create Wave 0 failing test stubs and setup.sh** - `73e9d2b` (test)

## Files Created/Modified

- `wizard/src/config.ts` - readConfig/writeConfig/buildInitialConfig using node:fs (CJS-safe)
- `wizard/src/types.ts` - Added 6 wizard-layer types; existing types preserved
- `wizard/tests/config.test.ts` - 5 tests covering readConfig, writeConfig, buildInitialConfig, InstallState contract
- `wizard/tests/wizard.test.ts` - Wave 0 RED stubs for runWizard (6 behaviors) and validateConflicts (1 todo)
- `wizard/package.json` - @clack/prompts@^1.1.0 added to dependencies
- `setup.sh` - Repo root entry point per WIZ-01 (replaced legacy bash script)

## Decisions Made

- config.ts uses `process.cwd()` for CONFIG_PATH (not `__dirname`) — ensures .template-config.json lands in user project dir
- wizard.test.ts imports from `../src/wizard.js` (which does not exist yet) but test stubs use `expect.fail()` rather than relying purely on import failure — this makes the RED state explicit and readable
- setup.sh replaces existing legacy bash wizard with minimal passthrough; legacy content was pre-Phase-2 placeholder

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Wave 0 scaffold complete; Plan 02 can implement wizard/src/wizard.ts and make wizard.test.ts GREEN
- Plan 03 will verify integration (build + smoke test)
- config.ts is fully functional — Plans 02/03 only need to import it, not modify it

---
*Phase: 02-wizard-core*
*Completed: 2026-03-15*
