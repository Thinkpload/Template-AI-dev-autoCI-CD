# Phase 1: Foundation - Research

**Researched:** 2026-03-15
**Domain:** Static data layer — module registry, version pinning, template files, line-ending guards
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- All module versions (BMAD, GSD, Husky, ESLint, Vitest, etc.) live in a single `dependency-versions.ts` file — one file to diff for version bumps, no `@latest` anywhere
- Update flow: automated weekly CI cron job resolves `@latest` for each pinned package, diffs against current pinned versions, opens a PR if anything changed
- `@latest` is forbidden in wizard source code — CI step greps for `@latest` in wizard source and **fails the build** if found (prevents BMAD issue #817 style silent drift)

### Claude's Discretion

- Whether to split BMAD/GSD versions into a separate `ai-tools-versions.ts` or keep everything in one file
- Wizard package location (setup/ subfolder vs extracted package) — no discussion requested
- Registry format and schema (TypeScript object vs JSON vs YAML) — no discussion requested
- Template files directory structure — no discussion requested; Claude chooses what makes the installer pipeline (Phase 3) easiest to implement

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AI-04 | Template pins BMAD and GSD to specific versions with a documented upgrade path (prevents silent version drift breaking agent discovery) | `dependency-versions.ts` pattern from create-t3-app; weekly CI cron diff pattern; `@latest` grep CI check |
| QA-05 | Template ships `.gitattributes` with `eol=lf` for all hook scripts (prevents Windows `\r\n` breaking Husky on Linux CI) | `.gitattributes` `* text=auto eol=lf` pattern; `*.sh text eol=lf` rule; Git `core.autocrlf` behavior |
</phase_requirements>

---

## Summary

Phase 1 creates the static foundation that every later phase consumes — no wizard UI, no installer side effects. The output is four artifacts: a `MODULE_REGISTRY` constant (pure data), a `dependency-versions.ts` file (all version pins), a `templates/` directory tree (pre-configured config files per module), and a `.gitattributes` file (CRLF guard). All four are committed before Phase 2 begins.

The patterns for all four artifacts are well-established. The version pinning pattern is directly adapted from create-t3-app's `dependencyVersionMap.ts`. The registry schema is a plain TypeScript `Record<string, ModuleDefinition>` that the Phase 3 installer reads without modification. Template directory layout mirrors the registry's module IDs so file lookup is `templates/${moduleId}/` — no path-mapping logic needed. The `.gitattributes` rules are a one-liner pair that the Git documentation confirms prevents CRLF injection from Windows contributors.

The only discretionary choice is whether BMAD/GSD version constants live in `dependency-versions.ts` or a split `ai-tools-versions.ts`. Recommendation: keep them unified in one file. The sole benefit of splitting is semantic grouping, but the cost is making version-bump diffs span two files instead of one. The locked decision ("one file to diff") argues for a single file.

**Primary recommendation:** Build a `wizard/` subdirectory at the repo root containing `src/registry.ts`, `src/dependency-versions.ts`, and a sibling `templates/` tree. The wizard package lives inside the repo (not extracted to npm yet) for Phase 1-3 development simplicity.

---

## Standard Stack

### Core (Phase 1 — data layer only, no runtime execution)

| File/Tool | Purpose | Why Standard |
|-----------|---------|--------------|
| `src/registry.ts` | `MODULE_REGISTRY` constant — pure TypeScript object, no imports from wizard logic | create-t3-app's `buildPkgInstallerMap` pattern; plain objects are trivially testable and serialisable |
| `src/dependency-versions.ts` | All npm version pins as string constants; imported by registry and installers | create-t3-app's `dependencyVersionMap.ts` — single-file diff for upgrades |
| `src/types.ts` | `ModuleDefinition` interface and supporting types | Defined before registry to enable strict typing with no circular imports |
| `templates/` | Per-module subdirectory tree with ready-to-copy config files | Mirrors module IDs → no path-mapping needed at install time |
| `.gitattributes` | CRLF normalisation rules committed at repo root | Git-native; works before any Node.js tooling is installed |

### Supporting (Phase 1 infrastructure)

| Tool | Version | Purpose | When to Use |
|------|---------|---------|-------------|
| TypeScript | 5.x | Types for registry schema | Already project requirement; `strict: true` |
| tsup | ^8.x | Compiles `wizard/src/` → CJS bundle | Same tool for all phases; configure once in Phase 1 |
| vitest | ^4.x | Unit tests for registry shape and version-pin rules | Tests run in CI; vitest chosen per project stack |

### No Additional Runtime Dependencies for Phase 1

Phase 1 produces only TypeScript source files and static template files. No npm packages need to be installed in the wizard package itself during Phase 1; that happens in Phase 2 (wizard UI) and Phase 3 (installers). The `package.json` for the wizard package is scaffolded in Phase 1 but has zero runtime deps until Phase 2.

---

## Architecture Patterns

### Recommended Project Structure

```
wizard/                             ← wizard npm package root
├── package.json                    ← name: "create-ai-template"; no runtime deps yet
├── tsup.config.ts                  ← { entry: ['src/index.ts'], format: ['cjs'], clean: true }
├── tsconfig.json                   ← { "extends": "../tsconfig.json", strict: true }
├── src/
│   ├── types.ts                    ← ModuleDefinition, WizardConfig interfaces
│   ├── registry.ts                 ← MODULE_REGISTRY constant (pure data)
│   └── dependency-versions.ts      ← all pinned version strings
└── templates/
    ├── eslint/
    │   └── eslint.config.mjs       ← pre-configured ESLint flat config
    ├── husky/
    │   ├── .husky/
    │   │   ├── pre-commit          ← lint-staged runner (no shebang; husky v9 format)
    │   │   └── commit-msg          ← commitlint runner
    │   └── commitlint.config.mjs
    ├── vitest/
    │   └── vitest.config.ts        ← coverage: lcov → coverage/lcov.info
    ├── tsconfig/
    │   └── tsconfig.json           ← strict: true, noUncheckedIndexedAccess, @/* alias
    ├── bmad/                       ← BMAD post-install scaffold (empty dir marker)
    └── gsd/                        ← GSD post-install scaffold (empty dir marker)

.gitattributes                      ← at repo root (not inside wizard/)
```

### Pattern 1: ModuleDefinition Schema

**What:** Each module in the registry is a typed plain object with id, label, deps, devDeps, templateDir, and postInstall. No functions, no closures — just data. The installer (Phase 3) imports this data and acts on it.

**When to use:** Always — keeping the registry as pure data means it can be JSON-serialised, logged, tested, and diffed without side effects.

**Example:**
```typescript
// wizard/src/types.ts
export interface ModuleDefinition {
  id: string;
  label: string;
  description: string;
  priority: 'must-have' | 'should-have' | 'nice-to-have';
  deps: string[];       // runtime npm dependencies
  devDeps: string[];    // dev npm dependencies
  templateDir: string;  // relative path under wizard/templates/
  postInstall: string[]; // ordered shell commands (executed by Phase 3 installer)
  conflicts?: string[]; // module IDs that cannot coexist (e.g., prisma conflicts with drizzle)
}

export type ModuleId =
  | 'eslint'
  | 'husky'
  | 'vitest'
  | 'tsconfig'
  | 'bmad'
  | 'gsd';

export type ModuleRegistry = Record<ModuleId, ModuleDefinition>;
```

### Pattern 2: dependency-versions.ts — Single Source of Truth

**What:** All version strings live as named string constants in one file. The registry imports them. Installers import them. No `@latest`, no semver ranges without a pinned major.

**When to use:** Every time a version string appears anywhere in wizard source — it must come from this file.

**Example:**
```typescript
// wizard/src/dependency-versions.ts

// AI Tooling (kept in the same file — one diff to review all bumps)
export const BMAD_VERSION = '6.0.0';         // @bmad-method/bmad-agent
export const GSD_VERSION = '2.0.0';          // (internal; update path TBD per Phase 2)

// Code Quality
export const HUSKY_VERSION = '^9.1.7';
export const LINT_STAGED_VERSION = '^15.2.10';
export const COMMITLINT_CLI_VERSION = '^19.6.1';
export const COMMITLINT_CONVENTIONAL_VERSION = '^19.6.0';
export const ESLINT_VERSION = '^9.19.0';
export const TYPESCRIPT_ESLINT_VERSION = '^8.23.0';

// Testing
export const VITEST_VERSION = '^4.0.0';
export const VITEST_COVERAGE_V8_VERSION = '^4.0.0';

// TypeScript
export const TYPESCRIPT_VERSION = '^5.7.3';
```

**CI enforcement:** A dedicated `check-no-latest` job in `.github/workflows/ci.yml` runs:
```bash
grep -r "@latest" wizard/src/ && echo "ERROR: @latest found in wizard source" && exit 1 || echo "OK: no @latest found"
```
This job must be added to `ci.yml` as part of Phase 1 (it is a pure YAML addition to the existing workflow).

### Pattern 3: Registry Constant (no logic mixed in)

**What:** `MODULE_REGISTRY` is a typed `Record<ModuleId, ModuleDefinition>` export. It has no functions, no dynamic imports, no conditional branches.

**Example:**
```typescript
// wizard/src/registry.ts
import {
  HUSKY_VERSION,
  LINT_STAGED_VERSION,
  COMMITLINT_CLI_VERSION,
  COMMITLINT_CONVENTIONAL_VERSION,
  ESLINT_VERSION,
  TYPESCRIPT_ESLINT_VERSION,
  VITEST_VERSION,
  VITEST_COVERAGE_V8_VERSION,
  BMAD_VERSION,
} from './dependency-versions.js';
import type { ModuleRegistry } from './types.js';

export const MODULE_REGISTRY: ModuleRegistry = {
  husky: {
    id: 'husky',
    label: 'Husky + commitlint (git hooks)',
    description: 'Pre-commit linting and conventional commit enforcement',
    priority: 'must-have',
    deps: [],
    devDeps: [
      `husky@${HUSKY_VERSION}`,
      `lint-staged@${LINT_STAGED_VERSION}`,
      `@commitlint/cli@${COMMITLINT_CLI_VERSION}`,
      `@commitlint/config-conventional@${COMMITLINT_CONVENTIONAL_VERSION}`,
    ],
    templateDir: 'templates/husky',
    postInstall: ['npx husky install'],
    conflicts: [],
  },
  eslint: {
    id: 'eslint',
    label: 'ESLint v9 flat config + typescript-eslint',
    description: 'Static analysis with TypeScript-aware rules',
    priority: 'must-have',
    deps: [],
    devDeps: [
      `eslint@${ESLINT_VERSION}`,
      `typescript-eslint@${TYPESCRIPT_ESLINT_VERSION}`,
    ],
    templateDir: 'templates/eslint',
    postInstall: [],
    conflicts: [],
  },
  vitest: {
    id: 'vitest',
    label: 'Vitest v4 + coverage',
    description: 'Unit/integration tests with lcov coverage for SonarCloud',
    priority: 'must-have',
    deps: [],
    devDeps: [
      `vitest@${VITEST_VERSION}`,
      `@vitest/coverage-v8@${VITEST_COVERAGE_V8_VERSION}`,
    ],
    templateDir: 'templates/vitest',
    postInstall: [],
    conflicts: [],
  },
  bmad: {
    id: 'bmad',
    label: 'BMAD Method v6',
    description: 'AI-driven development methodology agents',
    priority: 'should-have',
    deps: [],
    devDeps: [`@bmad-method/bmad-agent@${BMAD_VERSION}`],
    templateDir: 'templates/bmad',
    postInstall: ['npx bmad-method install'],
    conflicts: [],
  },
  gsd: {
    id: 'gsd',
    label: 'GSD Workflow Engine',
    description: 'Get-Shit-Done AI planning and execution framework',
    priority: 'should-have',
    deps: [],
    devDeps: [],       // GSD is already in-repo; no npm install needed
    templateDir: 'templates/gsd',
    postInstall: [],   // Phase 3 will handle GSD activation logic
    conflicts: [],
  },
  tsconfig: {
    id: 'tsconfig',
    label: 'TypeScript strict config',
    description: 'tsconfig.json with strict mode + path aliases',
    priority: 'must-have',
    deps: [],
    devDeps: [`typescript@${TYPESCRIPT_VERSION}`],
    templateDir: 'templates/tsconfig',
    postInstall: [],
    conflicts: [],
  },
} as const;
```

### Pattern 4: .gitattributes Line-Ending Rules

**What:** A `.gitattributes` file at the repository root tells Git how to normalise line endings on checkout. `* text=auto eol=lf` normalises all text files to LF on checkout regardless of OS. `*.sh text eol=lf` explicitly forces shell scripts (including Husky hooks) to LF.

**When to use:** Must be committed before any `.sh` or Husky hook files are added to the repository — if committed after, existing files may already have CRLF in the index.

**Exact content to commit:**
```
# Normalise all text files to LF on checkout
* text=auto eol=lf

# Shell scripts must always be LF (Husky hooks, setup.sh)
*.sh text eol=lf

# Binary files — never touch line endings
*.png binary
*.jpg binary
*.ico binary
*.woff2 binary
*.woff binary
```

**Key constraint:** After committing `.gitattributes`, existing files that were checked in with CRLF must be re-normalised. The standard procedure is:
```bash
git add --renormalize .
git commit -m "chore: normalise line endings per .gitattributes"
```
This is a one-time operation and must be the first thing committed in Phase 1 before any other files are added.

### Template File Patterns

**Vitest config** — must output `coverage/lcov.info` to match `sonar-project.properties`:
```typescript
// wizard/templates/vitest/vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      reportsDirectory: './coverage',
      thresholds: {
        statements: 80,
        functions: 80,
        lines: 80,
        branches: 70,
      },
    },
  },
});
```

**ESLint flat config** — ESLint v9 uses `eslint.config.mjs`, not `.eslintrc.*`:
```javascript
// wizard/templates/eslint/eslint.config.mjs
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
);
```

**Husky pre-commit hook** (husky v9 format — no shebang, no `#!/bin/sh`):
```
npx lint-staged
```

**Husky commit-msg hook** (husky v9 format):
```
npx --no -- commitlint --edit $1
```

### Anti-Patterns to Avoid

- **Version strings inline in registry:** Never write `devDeps: ['husky@^9.1.7']` directly — always import from `dependency-versions.ts`. One version string in two places is one too many.
- **Logic in registry.ts:** No `if` statements, no function calls, no dynamic values. If logic is needed, it belongs in Phase 3's installer, not the registry.
- **Templates containing the wizard package itself:** The `wizard/templates/` tree contains files that get copied to user projects. Do not put `wizard/src/` files in `wizard/templates/`.
- **Committing .gitattributes after hook files:** `.gitattributes` must be the first commit in Phase 1. If hook template files land in the index before `.gitattributes`, they may carry CRLF from a Windows dev machine.
- **Empty templateDir for a module:** If a module has no template files (e.g., `gsd` v1), its `templateDir` should point to an existing empty directory with a `.gitkeep`. Do not use an empty string or omit the field — the Phase 3 installer will try to copy from it.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Version string management | Custom update script that edits source files | Weekly CI cron that resolves `@latest` and opens a PR | Package registries change; manual update scripts miss transitive version constraints |
| CRLF normalisation | Pre-commit hook that converts `\r\n` to `\n` | `.gitattributes * text=auto eol=lf` | Git does this natively at checkout time — no Node.js tooling required |
| Template file variable substitution | Custom mustache/handlebars implementation | Static files (no substitution needed in Phase 1 templates) | Phase 1 templates have no project-specific placeholders; defer substitution to Phase 3 if needed |
| Module conflict detection | Ad-hoc `if/else` in wizard logic | `conflicts: string[]` field in `ModuleDefinition` | Encoding conflicts as data in the registry makes them testable and visible without reading wizard code |

**Key insight:** Phase 1 is pure data creation. The temptation to add "just a little" helper logic to `registry.ts` is the primary risk — resist it. The registry's value comes from being a boring, static, fully serialisable data structure.

---

## Common Pitfalls

### Pitfall 1: .gitattributes Committed Too Late

**What goes wrong:** Developer commits template hook files on Windows before `.gitattributes` exists. Git stores the files with CRLF. When CI clones on `ubuntu-latest` and Husky runs hooks, the `\r` character causes `bad interpreter` errors.

**Why it happens:** `.gitattributes` is easy to forget because Git doesn't warn you. The problem is silent until CI runs.

**How to avoid:** Make `.gitattributes` the very first file committed in Phase 1, before any other files. Plan task ordering explicitly: task 1 = `.gitattributes`; task 2 = `git add --renormalize .`; only then add template files.

**Warning signs:** `git ls-files --eol wizard/templates/husky/.husky/pre-commit` shows `i/crlf` in the index.

### Pitfall 2: @latest Creeping In During Development

**What goes wrong:** Developer writes `devDeps: ['husky@latest']` as a placeholder while building the registry, intends to pin later, and forgets. CI passes because the grep check isn't added yet.

**Why it happens:** `@latest` works and resolves correctly in development. The problem only manifests when the published version changes silently after the wizard ships.

**How to avoid:** Add the `@latest` grep CI check in the same plan that creates `dependency-versions.ts`. Do not defer it to a later task.

**Warning signs:** `grep -r "@latest" wizard/src/` returns results.

### Pitfall 3: Registry Imports Breaking CJS Bundle

**What goes wrong:** `registry.ts` uses ESM-style `.js` extension imports (`from './dependency-versions.js'`). tsup compiles to CJS correctly, but a developer adds a dynamic `import()` or top-level `await` (which requires ESM). The CJS bundle breaks at runtime.

**Why it happens:** TypeScript file extensions with `.js` suffix look odd to developers used to `.ts` imports. It's tempting to use `.ts` extensions or omit them entirely, leading to resolver issues.

**How to avoid:** Use explicit `.js` extensions in TypeScript source (TypeScript compiles `.ts` → `.js`, and tsup bundles correctly). Never use dynamic `import()` in the registry — it's a static data file.

**Warning signs:** tsup build output shows warnings about unresolved imports; `require()` calls in the compiled `.cjs` fail with "Cannot find module".

### Pitfall 4: Template Files Diverging from Installed Tool Versions

**What goes wrong:** `vitest.config.ts` in `templates/vitest/` uses Vitest v3 API syntax, but `dependency-versions.ts` pins `VITEST_VERSION = '^4.0.0'`. The template installs fine but the config is silently wrong.

**Why it happens:** Templates and version pins are edited independently. No automated check ties them together.

**How to avoid:** When updating a version pin in `dependency-versions.ts`, immediately review the corresponding template file for API changes. Add a comment in the template file referencing the expected version: `// Compatible with vitest ^4.0.0 — review on major bump`.

---

## Code Examples

### Weekly CI Cron for Version Drift Detection

```yaml
# Addition to .github/workflows/ci.yml (new job, separate from existing build job)
name: Check Dependency Versions
on:
  schedule:
    - cron: '0 9 * * 1'  # Monday 09:00 UTC
  workflow_dispatch:

jobs:
  check-versions:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Resolve latest versions
        id: resolve
        run: node wizard/scripts/check-versions.cjs
      - name: Open PR if versions changed
        if: steps.resolve.outputs.changed == 'true'
        uses: peter-evans/create-pull-request@v6
        with:
          commit-message: 'chore: bump pinned dependency versions'
          title: 'chore: weekly dependency version bump'
          branch: 'chore/version-bump'
```

### @latest Grep CI Check

```yaml
# New step added to existing build job in ci.yml
- name: Check no @latest in wizard source
  run: |
    if grep -r "@latest" wizard/src/; then
      echo "ERROR: @latest found in wizard/src/ — pin all versions in dependency-versions.ts"
      exit 1
    fi
    echo "OK: no @latest found in wizard source"
```

### Verifying .gitattributes Works

```bash
# After committing .gitattributes and running git add --renormalize .
# Verify a hook file is stored as LF in the index:
git ls-files --eol wizard/templates/husky/.husky/pre-commit
# Expected output: i/lf    w/lf    attr/text=auto eol=lf
# Bad output:      i/crlf  w/crlf  ...
```

---

## State of the Art

| Old Approach | Current Approach | Notes |
|--------------|------------------|-------|
| `.eslintrc.json` / `.eslintrc.js` | `eslint.config.mjs` (flat config) | ESLint v9 default; old format still supported via `ESLINT_USE_FLAT_CONFIG=false` but deprecated |
| Husky v8 `#!/bin/sh` shebang hooks | Husky v9 shell-less hooks | v9 hooks are plain script files, no shebang — `npx lint-staged` directly on line 1 |
| `.cursorrules` flat file | `.cursor/rules/*.mdc` | Cursor deprecated `.cursorrules` in 2025; MDC format is current standard |
| `@commitlint/config-conventional` v18 | v19 | v19 aligns with Conventional Commits 1.0 spec; v18 still works but v19 is current |
| Vitest v3 `coverage.all` option | Vitest v4 `coverage.include` / `coverage.exclude` | API change in v4 — template must use v4 API |

**Deprecated/outdated patterns to avoid in templates:**
- `.eslintrc.*` files: Use `eslint.config.mjs`
- Husky v8 `#!/bin/sh` shebang: Husky v9 hooks have no shebang
- `coverage.all: true` in Vitest config: Replaced by `coverage.include` in v4

---

## Open Questions

1. **GSD version pinning mechanism**
   - What we know: GSD is an in-repo tool (`.claude/get-shit-done/`), not an npm package. CONTEXT.md says "wizard confirms GSD is active or updates to latest pinned version."
   - What's unclear: How is a GSD "version" expressed? Is it a git tag on the GSD repo? A field in `package.json`? A comment in `gsd-tools.cjs`?
   - Recommendation: For Phase 1, add a `GSD_VERSION` constant to `dependency-versions.ts` as a documentation string (e.g., `'2.0.0'`). Actual GSD update mechanics are Phase 2 scope (AI-02).

2. **BMAD package name confirmation**
   - What we know: `setup.sh` calls `npx bmad-method install` and STACK.md references `@bmad-method/bmad-agent`.
   - What's unclear: Whether the installable npm package is `@bmad-method/bmad-agent` or just `bmad-method` (the two names appear in different places).
   - Recommendation: Verify the exact npm package name before writing it into `dependency-versions.ts`. Run `npm info @bmad-method/bmad-agent version` as the first step of the registry-creation task.

3. **Vitest v4 coverage API**
   - What we know: REQUIREMENTS.md specifies Vitest v4. The codebase STACK.md references Vitest v4.
   - What's unclear: Whether `coverage.thresholds` syntax changed between v3 and v4 (the `thresholds` sub-key was added in v1.3, but v4 may have further changes).
   - Recommendation: The template provided above uses the v1.3+ `thresholds` object syntax. Verify against official Vitest v4 docs before committing the template file. Confidence on this specific API: MEDIUM.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest v4 (to be installed in wizard package as devDependency) |
| Config file | `wizard/vitest.config.ts` — created in Phase 1 Wave 0 |
| Quick run command | `cd wizard && npx vitest run --reporter=verbose` |
| Full suite command | `cd wizard && npx vitest run --coverage` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AI-04 | `MODULE_REGISTRY` contains `bmad` and `gsd` entries with non-empty version strings | unit | `cd wizard && npx vitest run tests/registry.test.ts -t "bmad version"` | Wave 0 |
| AI-04 | `dependency-versions.ts` exports contain no `@latest` strings | unit | `cd wizard && npx vitest run tests/dependency-versions.test.ts -t "no @latest"` | Wave 0 |
| AI-04 | Every `devDeps` entry in registry resolves to a pinned version from `dependency-versions.ts` | unit | `cd wizard && npx vitest run tests/registry.test.ts -t "all versions pinned"` | Wave 0 |
| QA-05 | `.gitattributes` exists at repo root with `* text=auto eol=lf` rule | smoke | `cd wizard && npx vitest run tests/gitattributes.test.ts` | Wave 0 |
| QA-05 | `.gitattributes` contains `*.sh text eol=lf` rule | smoke | included in above test | Wave 0 |

### Sampling Rate

- **Per task commit:** `cd wizard && npx vitest run --reporter=verbose`
- **Per wave merge:** `cd wizard && npx vitest run --coverage`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `wizard/vitest.config.ts` — Vitest config for wizard package tests
- [ ] `wizard/tests/registry.test.ts` — registry shape, version pin coverage
- [ ] `wizard/tests/dependency-versions.test.ts` — no `@latest`, all exports are non-empty strings
- [ ] `wizard/tests/gitattributes.test.ts` — `.gitattributes` exists and contains required rules
- [ ] `wizard/package.json` — scaffold with `vitest` as devDependency

---

## Sources

### Primary (HIGH confidence)
- `.planning/research/ARCHITECTURE.md` — `MODULE_REGISTRY` pattern, `ModuleDefinition` schema, create-t3-app reference architecture
- `.planning/research/STACK.md` — wizard package structure, CJS target, tsup config, package.json bin field
- `.planning/codebase/STACK.md` — confirmed Vitest v4, Node.js >=20, `coverage/lcov.info` path
- `sonar-project.properties` — confirmed `sonar.javascript.lcov.reportPaths=coverage/lcov.info`
- `.github/workflows/ci.yml` — existing CI structure for @latest grep job integration point
- [create-t3-app dependencyVersionMap pattern](https://github.com/t3-oss/create-t3-app) — centralized version constant pattern

### Secondary (MEDIUM confidence)
- [Git gitattributes documentation](https://git-scm.com/docs/gitattributes) — `text=auto eol=lf` and `*.sh text eol=lf` rule semantics
- [Husky v9 migration guide](https://typicode.github.io/husky/migrate-from-v4.html) — no shebang in v9 hooks
- [ESLint v9 flat config announcement](https://eslint.org/blog/2024/04/eslint-v9.0.0-released/) — `eslint.config.mjs` as default

### Tertiary (LOW — verify before coding)
- Vitest v4 `coverage.thresholds` API — confirm syntax against official v4 docs before committing template
- `@bmad-method/bmad-agent` exact npm package name — verify with `npm info` before hardcoding

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all patterns sourced from existing project research and create-t3-app reference
- Architecture: HIGH — registry schema and version-pinning pattern are direct adaptations of established, verified patterns
- Template file contents: MEDIUM — ESLint and Husky patterns are HIGH; Vitest v4 coverage API is MEDIUM pending version verification
- `.gitattributes` rules: HIGH — Git documentation

**Research date:** 2026-03-15
**Valid until:** 2026-04-15 (stable patterns; Vitest v4 API could change if a v4.x minor introduces breaking coverage config changes)
