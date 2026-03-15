# Phase 3: Installer Pipeline - Context

**Gathered:** 2026-03-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Execute the actual installation for each wizard-selected module: run `npm install` for devDeps, copy template files into the target project, run postInstall scripts, and update `.template-config.json` with install state. Wizard UI (Phase 2) is already complete — this phase wires the install execution layer that Phase 2 currently skips.

</domain>

<decisions>
## Implementation Decisions

### Installer trigger
- Installation runs **immediately after wizard** — `index.ts` flow: `runWizard()` → `writeConfig()` → `runInstaller()`
- In `--yes` mode, wizard + install runs as a single unattended operation (no additional confirmation)
- Installer skips any module where `installState === 'installed'` in `.template-config.json` (new modules only, per WIZ-04 idempotency)
- On module install failure: log the error, mark module as `'failed'` in config, continue with remaining modules, show failure summary at end (per WIZ-07)

### Existing file handling
- Interactive mode: if a template file already exists in the target project, prompt the user ("This file exists — overwrite?")
- `--yes` mode: auto-overwrite without prompting; log "Overwriting existing [filename]" so there's a record
- Create a `.bak` backup of any overwritten file (e.g., `eslint.config.mjs.bak`) — safety net for users not under git
- `package.json` is never overwritten — always programmatically merged: read existing JSON, merge in new `scripts` keys and config blocks (e.g., `lint-staged` key), write back

### Husky hook file creation
- `.husky/pre-commit` and `.husky/commit-msg` are **static template files** in `wizard/templates/husky/` — copied by the installer like any other template
- `pre-commit` hook runs: lint-staged (ESLint only on staged files) + `tsc --noEmit` (type-check)
- `commit-msg` hook runs: commitlint with `config-conventional` — format enforcement only, no WIP blocking
- No Prettier in pre-commit — Prettier is a separate future module, not in Phase 3 scope
- `postInstall: ['npx husky install']` in registry remains as-is — runs after npm install to initialize `.husky/` directory

### Progress & error UX
- Each module shows a `@clack/prompts` spinner during install: `'Installing husky...'` → `'✓ husky installed'` or `'✗ husky failed'`
- Outro summary using clack: `'Setup complete! N modules installed.'`; if failures: `'Installed: N, Failed: M (see above for details)'`
- On failure: show error message + one-line hint (e.g., `'Run npm install husky manually to retry'`) — no full npm stderr

### Claude's Discretion
- Exact `package.json` merge implementation (deep merge vs targeted key injection)
- How to detect and handle edge cases in package.json merge (e.g., existing `lint-staged` config that conflicts)
- File copy order within a module (npm install → template copy → postInstall, or configurable)
- Whether to batch all module `npm install` calls into a single `npm install` invocation or run per-module

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches.

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `MODULE_REGISTRY` in `wizard/src/registry.ts` — complete data source: `devDeps`, `templateDir`, `postInstall` per module. Installer reads this without modification.
- `readConfig` / `writeConfig` in `wizard/src/config.ts` — already handles `.template-config.json` read/write; installer uses these to check state and update `installState`
- `types.ts` — `InstallState` (`'pending' | 'installed' | 'failed' | 'skipped'`) and `ModuleInstallRecord` already model the lifecycle
- `wizard/templates/husky/commitlint.config.mjs` — already committed; add `pre-commit` and `commit-msg` hook files alongside it
- `@clack/prompts` — already installed and used in wizard.ts; use same import for installer spinner/outro

### Established Patterns
- CJS build (`wizard/dist/index.cjs`) — installer module must also compile to CJS, no ESM top-level await issues
- `process.cwd()` for target project path — established in `config.ts`; installer should use the same to resolve template copy destination

### Integration Points
- `index.ts` — add `runInstaller(selections)` call after `writeConfig(config)`
- `sonar-project.properties` → `sonar.javascript.lcov.reportPaths=coverage/lcov.info` — Vitest config template must output `coverage/lcov.info` at this path
- `.gitattributes` `eol=lf` guard — generated `.husky/` hook files must be written with LF line endings explicitly (don't rely on OS default)

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 03-installer-pipeline*
*Context gathered: 2026-03-15*
