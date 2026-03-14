---
phase: 01-foundation
plan: 03
subsystem: infra
tags: [eslint, husky, vitest, typescript, commitlint, templates]

requires:
  - phase: 01-01
    provides: wizard TypeScript scaffolding and MODULE_REGISTRY definition

provides:
  - wizard/templates/ directory tree with 8 files across 6 module directories
  - ESLint v9 flat config template for target projects
  - Husky v9 hook templates (pre-commit, commit-msg) stored as LF in Git index
  - commitlint conventional config template
  - Vitest v4 config with lcov output matching sonar-project.properties
  - TypeScript strict mode tsconfig with path aliases
  - Empty .gitkeep placeholders for bmad and gsd module dirs

affects:
  - 03-installer (Phase 3 installer reads wizard/templates/${moduleId}/ to copy into target projects)

tech-stack:
  added: []
  patterns:
    - "Template files are static — no variable substitution. Installer uses cp verbatim."
    - "Husky hook files stored as plain text with LF endings (no shebang) per Husky v9 API."
    - "Vitest reportsDirectory './coverage' → coverage/lcov.info matches sonar-project.properties."

key-files:
  created:
    - wizard/templates/eslint/eslint.config.mjs
    - wizard/templates/husky/.husky/pre-commit
    - wizard/templates/husky/.husky/commit-msg
    - wizard/templates/husky/commitlint.config.mjs
    - wizard/templates/vitest/vitest.config.ts
    - wizard/templates/tsconfig/tsconfig.json
    - wizard/templates/bmad/.gitkeep
    - wizard/templates/gsd/.gitkeep
  modified: []

key-decisions:
  - "Husky v9 hooks are plain script files (no shebang). #!/bin/sh would break Husky v9."
  - "vitest coverage.include used (not deprecated coverage.all) per Vitest v4 API."
  - "bmad and gsd modules use .gitkeep placeholders — post-install scripts handle their setup in Phase 3."

patterns-established:
  - "Template pattern: one subdirectory per registry module under wizard/templates/"
  - "LF enforcement: .gitattributes text=auto eol=lf covers all template files including Husky hooks"

requirements-completed: [AI-04, QA-05]

duration: 8min
completed: 2026-03-15
---

# Phase 01 Plan 03: Wizard Template Files Summary

**8 static template files across 6 module directories — ESLint v9 flat config, Husky v9 LF-only hooks, Vitest v4 lcov config, TypeScript strict tsconfig, and .gitkeep placeholders for bmad/gsd**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-15T00:00:00Z
- **Completed:** 2026-03-15T00:08:00Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments

- Created complete wizard/templates/ tree with one directory per MODULE_REGISTRY module
- Husky v9 hook files stored with LF endings in the Git index (verified via git ls-files --eol)
- Vitest v4 config outputs coverage/lcov.info matching sonar-project.properties reportPaths

## Task Commits

1. **Task 1 + Task 2: Create all 6 module template directories** - `ab968c8` (feat)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified

- `wizard/templates/eslint/eslint.config.mjs` - ESLint v9 flat config using typescript-eslint
- `wizard/templates/husky/.husky/pre-commit` - Husky v9 hook: `npx lint-staged` (no shebang, LF)
- `wizard/templates/husky/.husky/commit-msg` - Husky v9 hook: `npx --no -- commitlint --edit $1` (no shebang, LF)
- `wizard/templates/husky/commitlint.config.mjs` - commitlint @commitlint/config-conventional
- `wizard/templates/vitest/vitest.config.ts` - Vitest v4, lcov reporter, 80/70 thresholds, reportsDirectory ./coverage
- `wizard/templates/tsconfig/tsconfig.json` - TypeScript strict mode, ESNext/bundler, path alias @/*
- `wizard/templates/bmad/.gitkeep` - Empty placeholder so Phase 3 installer finds dir
- `wizard/templates/gsd/.gitkeep` - Empty placeholder so Phase 3 installer finds dir

## Decisions Made

- Husky v9 hooks have NO shebang line. Shebang would break Husky v9 which treats hooks as plain scripts.
- Used `coverage.include` (not `coverage.all`) — `coverage.all` is removed in Vitest v4.
- bmad and gsd use .gitkeep placeholders since their post-install scripts run at Phase 3 install time.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All 6 module template directories are in place and committed.
- Phase 3 installer can safely do `cp wizard/templates/${moduleId}/* target/` for all modules.
- Husky hooks will have correct LF endings on checkout due to .gitattributes eol=lf rule.

---
*Phase: 01-foundation*
*Completed: 2026-03-15*
