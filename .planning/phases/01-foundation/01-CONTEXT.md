# Phase 1: Foundation - Context

**Gathered:** 2026-03-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the static data layer that all wizard logic depends on: module registry (pure data structure), version pins for all modules including BMAD/GSD, pre-configured template config files ready to copy, and `.gitattributes` line-ending guards. No wizard UI logic, no installer logic — data and file structure only.

</domain>

<decisions>
## Implementation Decisions

### Version Pinning

- All module versions (BMAD, GSD, Husky, ESLint, Vitest, etc.) live in a single `dependency-versions.ts` file — one file to diff for version bumps, no `@latest` anywhere
- Update flow: automated weekly CI cron job resolves `@latest` for each pinned package, diffs against current pinned versions, opens a PR if anything changed
- `@latest` is forbidden in wizard source code — CI step greps for `@latest` in wizard source and **fails the build** if found (prevents BMAD issue #817 style silent drift)
- BMAD and GSD version handling: Claude's Discretion — use whatever structure makes maintenance easiest (no strong user preference on splitting AI tooling versions into a separate file vs. keeping them in the same `dependency-versions.ts`)

### Claude's Discretion

- Whether to split BMAD/GSD versions into a separate `ai-tools-versions.ts` or keep everything in one file
- Wizard package location (setup/ subfolder vs extracted package) — no discussion requested
- Registry format and schema (TypeScript object vs JSON vs YAML) — no discussion requested
- Template files directory structure — no discussion requested; Claude chooses what makes the installer pipeline (Phase 3) easiest to implement

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches (create-t3-app's `buildPkgInstallerMap` / `dependency-versions.ts` pattern is a good reference per research).

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets

- `setup.sh` at repo root — current post-clone setup script; the wizard replaces its functionality. Phase 1 doesn't touch `setup.sh` but the template files must align with what `setup.sh` currently configures (SonarCloud, BMAD install).
- `.env.example` — already committed with standard vars; wizard template for env files should extend this, not replace it.

### Established Patterns

- Multi-runtime AI support pattern (`.claude/`, `.gemini/`, `.opencode/` mirrors) — template files for AI agent config must be created for all three runtimes if applicable.
- `gsd-tools.cjs` CJS module pattern — the wizard package should follow the same CJS approach (not ESM) for Node 20 compatibility, per research.

### Integration Points

- `sonar-project.properties` — Vitest coverage config in Phase 1 template files must output `coverage/lcov.info` matching this file's `sonar.javascript.lcov.reportPaths` setting.
- `.github/workflows/ci.yml` — the `@latest` CI check fits as a new job in the existing CI workflow.

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-foundation*
*Context gathered: 2026-03-15*
