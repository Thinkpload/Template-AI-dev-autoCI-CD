---
phase: 05-packaging-and-maintenance
plan: 01
subsystem: infra
tags: [dependabot, github-actions, node-version-guard, npm-publish, security]

requires:
  - phase: 04-auto-bugfix-pipeline
    provides: GitHub Actions workflows foundation established in repo

provides:
  - Dependabot weekly PRs for npm (wizard/) and GitHub Actions ecosystems
  - Auto-merge workflow for patch-only Dependabot PRs
  - Node >=20 version guard in wizard binary (user-friendly error before cryptic crash)
  - prepublishOnly gate blocking accidental npm publish without tests+build

affects: [future-phases, publishing, security]

tech-stack:
  added: [dependabot/fetch-metadata@v2]
  patterns: [Node version guard as first executable code in CJS entry point, prepublishOnly npm lifecycle hook for publish safety]

key-files:
  created:
    - .github/dependabot.yml
    - .github/workflows/dependabot-automerge.yml
  modified:
    - wizard/src/index.ts
    - wizard/package.json

key-decisions:
  - "Node version guard placed before ALL require/import calls — tsup CJS output preserves source order guaranteeing the check runs first"
  - "dependabot.yml uses directory '/wizard' (not '/') because repo root has no package.json — only wizard/ subdirectory is an npm package"
  - "Automerge workflow uses pull_request event (not pull_request_target) — Dependabot PRs get elevated GITHUB_TOKEN on pull_request natively"
  - "Auto-merge gated on semver-patch only — minor and major updates require human review"

patterns-established:
  - "Node version guard pattern: check process.versions.node before any require(), write to stderr, exit(1) with upgrade URL"
  - "prepublishOnly pattern: npm test && npm run build gates npm publish behind CI checks locally"

requirements-completed: [SEC-01]

duration: 10min
completed: 2026-03-17
---

# Phase 05 Plan 01: Dependency Maintenance and Node Version Guard Summary

**Dependabot weekly PRs for wizard/ npm and GitHub Actions, automerge for patches, Node >=20 guard in wizard binary with user-friendly error message**

## Performance

- **Duration:** 10 min
- **Started:** 2026-03-17T11:50:00Z
- **Completed:** 2026-03-17T11:52:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Node >=20 version guard inserted as first executable code in wizard/src/index.ts — simulating Node 18 prints clear error and exits 1
- prepublishOnly script added to wizard/package.json blocking accidental npm publish without passing tests and build
- .github/dependabot.yml created with weekly npm (wizard/) and github-actions updates grouped by minor+patch
- .github/workflows/dependabot-automerge.yml auto-merges patch-only Dependabot PRs once CI is green; minor/major require human review
- All 35 existing wizard tests still pass

## Task Commits

1. **Task 1: Node version guard and prepublishOnly** - `7b5c2be` (feat)
2. **Task 2: Dependabot config and automerge workflow** - `5004009` (feat)

## Files Created/Modified
- `wizard/src/index.ts` - Node >=20 guard as first executable lines (before require/import)
- `wizard/package.json` - prepublishOnly: "npm test && npm run build"
- `.github/dependabot.yml` - Weekly Dependabot PRs for npm (/wizard) and github-actions (/)
- `.github/workflows/dependabot-automerge.yml` - Auto-merge patch Dependabot PRs via fetch-metadata@v2

## Decisions Made
- Node version guard uses only `process.versions.node` (built-in) — no require needed, safe to run before any CJS require calls
- `directory: '/wizard'` in dependabot.yml because the repo root has no package.json; wizard/ is the only npm package
- Automerge workflow uses `pull_request` event (not `pull_request_target`) since Dependabot has elevated token permissions on `pull_request` natively
- Auto-merge gated strictly on `version-update:semver-patch` — minor and major always go to human review

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- SEC-01 satisfied: Dependabot configuration committed and automerge workflow in place
- All v1 requirements now complete
- Phase 5 plan 01 complete — ready for plan 02 if it exists, or phase wrap-up

---
*Phase: 05-packaging-and-maintenance*
*Completed: 2026-03-17*
