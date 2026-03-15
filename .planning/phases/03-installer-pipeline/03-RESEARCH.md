# Phase 3: Installer Pipeline - Research

**Researched:** 2026-03-15
**Domain:** Node.js CLI installer — npm programmatic install, file copying, package.json merging, Husky hook setup, Vitest config
**Confidence:** HIGH (codebase is the primary source; all patterns are drawn from existing code or well-known stable APIs)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- Installation runs **immediately after wizard** — `index.ts` flow: `runWizard()` → `writeConfig()` → `runInstaller()`
- In `--yes` mode, wizard + install runs as a single unattended operation (no additional confirmation)
- Installer skips any module where `installState === 'installed'` in `.template-config.json`
- On module install failure: log the error, mark module as `'failed'` in config, continue with remaining modules, show failure summary at end
- Interactive mode: if a template file already exists, prompt the user ("This file exists — overwrite?")
- `--yes` mode: auto-overwrite; log "Overwriting existing [filename]"
- Create a `.bak` backup of any overwritten file (e.g., `eslint.config.mjs.bak`)
- `package.json` is never overwritten — always programmatically merged (scripts keys + config blocks)
- `.husky/pre-commit` and `.husky/commit-msg` are **static template files** in `wizard/templates/husky/` — copied by installer
- `pre-commit` hook runs: lint-staged (ESLint only on staged files) + `tsc --noEmit`
- `commit-msg` hook runs: commitlint with `config-conventional`
- No Prettier in pre-commit (out of scope for Phase 3)
- `postInstall: ['npx husky install']` in registry remains as-is
- Each module shows a `@clack/prompts` spinner during install
- Outro summary via clack; failure: `'Installed: N, Failed: M (see above for details)'`
- On failure: show error message + one-line hint; no full npm stderr

### Claude's Discretion

- Exact `package.json` merge implementation (deep merge vs targeted key injection)
- How to detect and handle edge cases in package.json merge (e.g., existing `lint-staged` config that conflicts)
- File copy order within a module (npm install → template copy → postInstall, or configurable)
- Whether to batch all module `npm install` calls into a single invocation or run per-module

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| QA-01 | Wizard installs and configures Husky v9 + lint-staged v15 — pre-commit hook runs linter on staged files | Template files exist; installer must copy `pre-commit` hook + merge `lint-staged` key into `package.json` |
| QA-02 | Wizard installs and configures commitlint v19 — commit-msg hook enforces conventional commits | `commitlint.config.mjs` template exists; installer must copy `commit-msg` hook |
| QA-03 | Wizard installs Vitest v4 with coverage thresholds (80/80/80/70) | `vitest.config.ts` template exists; installer copies it and adds `test` + `test:coverage` scripts to `package.json` |
| QA-04 | Vitest config pre-wired to output `coverage/lcov.info` for SonarCloud | Template already has correct config; installer ensures file lands at project root |
</phase_requirements>

---

## Summary

Phase 3 wires the execution layer that Phase 2 (wizard UI) currently skips. The wizard already collects selections and writes `.template-config.json`; this phase adds `runInstaller(selections)` called from `index.ts` after `writeConfig()`. The installer iterates over selected modules from `MODULE_REGISTRY`, runs `npm install --save-dev` for each module's `devDeps`, copies template files from `wizard/templates/<module>/` to `process.cwd()`, and runs `postInstall` commands.

The central complexity is `package.json` merging — the installer must programmatically inject `scripts` keys and config blocks (e.g., `lint-staged`) without overwriting the user's existing `package.json`. Husky hook files require explicit LF line endings to work on Linux CI (the `.gitattributes` eol=lf guard only affects git storage, not file writes). The `@clack/prompts` spinner pattern is already established in `wizard.ts` — the installer uses the same import.

All templates that need to exist are partially in place: `commitlint.config.mjs` is already in `wizard/templates/husky/`, and `vitest.config.ts` is in `wizard/templates/vitest/`. Phase 3 must add the two Husky hook script files (`pre-commit`, `commit-msg`) and wire the entire install execution.

**Primary recommendation:** Create `wizard/src/installer.ts` exporting `runInstaller(selections, yesMode)`. Implement sequential per-module execution (npm install → copy templates → postInstall). Use targeted key injection for `package.json` merge (no external merge library needed). Write hook files with explicit `\n` line endings using `writeFileSync` with `encoding: 'utf-8'` after normalizing content.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `node:fs` | built-in | File copy, backup creation, package.json read/write | Zero deps; synchronous API suitable for CLI |
| `node:child_process` | built-in | `execSync` for `npm install` and `postInstall` commands | Standard for CLI tool spawning |
| `node:path` | built-in | Cross-platform path joining | Already used throughout codebase |
| `@clack/prompts` | `^1.1.0` | Spinners, overwrite prompts, outro summary | Already installed; established pattern in `wizard.ts` |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `node:os` | built-in | Detect platform for path normalization | Only if Windows-specific path issues arise |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `execSync` for npm install | `execa` or `npm` programmatic API | `execSync` has no extra deps and is sufficient for sequential installs; `execa` adds flexibility but complexity |
| Targeted key injection for package.json merge | `deepmerge` npm package | Targeted injection is safer — avoids clobbering nested user config; external lib adds dep and edge cases |

**Installation:** No new runtime dependencies needed. All required libraries are Node.js built-ins or already installed (`@clack/prompts`).

---

## Architecture Patterns

### Recommended Project Structure

```
wizard/src/
├── index.ts          # entry point — add runInstaller() call here
├── installer.ts      # NEW: runInstaller(), installModule(), copyTemplates(), mergePackageJson()
├── wizard.ts         # existing — unchanged
├── registry.ts       # existing — read-only data source
├── config.ts         # existing — readConfig/writeConfig used by installer
├── types.ts          # existing — InstallState, ModuleInstallRecord already defined
└── dependency-versions.ts  # existing — unchanged

wizard/templates/husky/
├── commitlint.config.mjs   # existing
├── pre-commit              # NEW: hook script (no shebang, LF endings)
└── commit-msg              # NEW: hook script (no shebang, LF endings)
```

### Pattern 1: Sequential Per-Module Installation

**What:** Each module runs as an atomic unit: npm install → copy templates → postInstall. If any step throws, the module is marked `'failed'` and the loop continues.

**When to use:** Always — matches the established error-handling contract in CONTEXT.md (WIZ-07 pattern: log, mark failed, continue).

**Example:**
```typescript
// wizard/src/installer.ts
import { spawnSync } from 'node:child_process';
import { spinner } from '@clack/prompts';

export async function runInstaller(
  selections: UserSelections,
  yesMode: boolean,
): Promise<void> {
  const config = readConfig()!;
  const results: { id: string; status: 'installed' | 'failed' }[] = [];

  for (const moduleId of selections.selectedModules) {
    const record = config.modules.find(m => m.id === moduleId);
    if (record?.installState === 'installed') continue; // idempotency guard

    const mod = MODULE_REGISTRY[moduleId];
    const s = spinner();
    s.start(`Installing ${mod.label}...`);

    try {
      await installModule(mod, yesMode);
      updateModuleState(config, moduleId, 'installed');
      s.stop(`${mod.label} installed`);
      results.push({ id: moduleId, status: 'installed' });
    } catch (err) {
      updateModuleState(config, moduleId, 'failed');
      s.stop(`${mod.label} failed`);
      logFailureHint(mod, err);
      results.push({ id: moduleId, status: 'failed' });
    }

    writeConfig(config);
  }

  printSummary(results);
}
```

### Pattern 2: package.json Targeted Key Injection

**What:** Read existing `package.json`, inject only the specific keys the module requires (scripts, lint-staged, etc.), write back. Never touch keys the installer doesn't own.

**When to use:** Always for `package.json` — never copy-overwrite it.

**Example:**
```typescript
function mergePackageJson(additions: { scripts?: Record<string, string>; [key: string]: unknown }): void {
  const pkgPath = join(process.cwd(), 'package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8')) as Record<string, unknown>;

  if (additions.scripts) {
    const existingScripts = (pkg['scripts'] as Record<string, string> | undefined) ?? {};
    // Only inject keys that don't exist yet — preserve user's existing scripts
    for (const [key, val] of Object.entries(additions.scripts)) {
      if (!(key in existingScripts)) {
        existingScripts[key] = val;
      }
    }
    pkg['scripts'] = existingScripts;
  }

  // Merge top-level config blocks (e.g., lint-staged)
  for (const [key, val] of Object.entries(additions)) {
    if (key === 'scripts') continue;
    if (!(key in pkg)) {
      pkg[key] = val;
    }
    // If key already exists: log a warning, don't overwrite
  }

  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8');
}
```

### Pattern 3: LF-Enforced Hook File Writing

**What:** Write Husky hook files with explicit `\n` line endings regardless of OS.

**When to use:** For all files under `.husky/` — required by QA-05 / CI correctness.

**Example:**
```typescript
function writeHookFile(dest: string, content: string): void {
  // Normalize to LF regardless of OS default
  const normalized = content.replace(/\r\n/g, '\n');
  writeFileSync(dest, normalized, { encoding: 'utf-8' });
  // Husky v9 requires executable bit on Unix
  if (process.platform !== 'win32') {
    chmodSync(dest, 0o755);
  }
}
```

### Pattern 4: Backup Before Overwrite

**What:** Before overwriting any existing template file, copy it to `<filename>.bak`.

**Example:**
```typescript
import { copyFileSync, existsSync } from 'node:fs';

function copyWithBackup(src: string, dest: string): void {
  if (existsSync(dest)) {
    copyFileSync(dest, `${dest}.bak`);
  }
  copyFileSync(src, dest);
}
```

### Anti-Patterns to Avoid

- **Spawning `npm install` with `shell: true` on Windows without quoting:** Package names with `@` scopes can be misinterpreted; use `spawnSync('npm', ['install', '--save-dev', ...pkgs])` with args array.
- **Using `cp -r` via shell for template copy:** Not cross-platform; use `node:fs` `copyFileSync` + `mkdirSync` recursively.
- **Writing hook files without chmod:** Husky v9 on Linux/macOS requires the hook file to be executable. `writeFileSync` alone won't set the bit.
- **Checking `process.platform === 'win32'` for LF:** Always write LF regardless of platform — CI runs on Linux.
- **Blocking the event loop with large `execSync` without `stdio: 'pipe'`:** npm output floods the terminal; capture with `stdio: 'pipe'` and expose only on failure.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Running shell commands | Custom process wrapper | `spawnSync` from `node:child_process` with args array | Handles quoting, non-zero exit codes via `status`, available without deps |
| Reading/writing JSON files | Custom serializer | `JSON.parse` / `JSON.stringify(obj, null, 2) + '\n'` | Trailing newline matches POSIX convention; no extra deps |
| Recursive directory copy | Custom walk | Loop over `readdirSync` + `copyFileSync` | Template dirs are shallow (1-2 files); full recursive walk via `fs.cpSync` (Node 16.7+) is also available |
| Spinner/progress UI | Custom ANSI codes | `@clack/prompts` `spinner()` | Already installed; consistent UX with wizard phase |

**Key insight:** This installer is a thin orchestrator over Node built-ins and one already-installed UX library. Any additional npm dependency is unjustified.

---

## Common Pitfalls

### Pitfall 1: `npx husky install` Fails When Not in a Git Repo

**What goes wrong:** `postInstall: ['npx husky install']` throws if the target project has no `.git` directory. This is a real scenario when running the wizard on a freshly scaffolded directory before `git init`.

**Why it happens:** Husky v9 `install` command requires a git root to register hooks.

**How to avoid:** Before running `npx husky install`, check that `existsSync(join(process.cwd(), '.git'))` is true. If false: log a warning ("Git not initialized — run `git init` then `npx husky install` manually"), mark the postInstall step as skipped (not failed), and continue. Do not fail the entire module install because the npm install + file copy succeeded.

**Warning signs:** `Error: .git can't be found` from husky on stderr.

### Pitfall 2: Husky Hook Files with CRLF Break on Linux CI

**What goes wrong:** Hook scripts written on Windows with `\r\n` endings cause `/usr/bin/env: 'node\r': No such file or directory` on Linux.

**Why it happens:** `writeFileSync` uses the OS default line ending on some Node versions.

**How to avoid:** Explicitly normalize content with `.replace(/\r\n/g, '\n')` before writing. This is separate from the `.gitattributes` eol=lf guard — the guard affects git storage, not the live file written during install.

### Pitfall 3: Husky v9 Hook Files Must Not Have a Shebang

**What goes wrong:** Adding `#!/bin/sh` to `.husky/pre-commit` causes Husky v9 to fail silently or double-execute.

**Why it happens:** Husky v9 changed the hook format — hooks are sourced by Husky's own shell wrapper, not executed directly.

**How to avoid:** Hook files contain only the commands, no shebang line. Confirmed in STATE.md decision: "Husky v9 hooks are plain script files (no shebang). #!/bin/sh would break Husky v9."

### Pitfall 4: `package.json` Missing `test:coverage` Script After Vitest Install

**What goes wrong:** SonarCloud integration expects `npm run test:coverage` to produce `coverage/lcov.info`. If the installer only adds `test` but not `test:coverage`, QA-04 is broken.

**Why it happens:** Easy omission when mapping registry devDeps to scripts.

**How to avoid:** The vitest module's `package.json` injection must add both `"test": "vitest run --reporter=verbose"` and `"test:coverage": "vitest run --coverage"`. Verify in acceptance test that both keys exist after install.

### Pitfall 5: `spawnSync` Status Null vs Non-Zero

**What goes wrong:** Treating `result.status === null` as success. `null` means the process was killed by signal, not that it succeeded.

**How to avoid:** Check `result.status !== 0` OR `result.status === null` both as failure conditions. Check `result.error` first for spawn errors (e.g., `npm` not found on PATH).

---

## Code Examples

### npm install devDeps via spawnSync

```typescript
// Source: node:child_process official docs + project CJS build constraint
import { spawnSync } from 'node:child_process';

function npmInstallDevDeps(packages: string[]): void {
  if (packages.length === 0) return;
  const result = spawnSync('npm', ['install', '--save-dev', ...packages], {
    cwd: process.cwd(),
    stdio: 'pipe',        // capture output; expose only on failure
    encoding: 'utf-8',
  });
  if (result.error) throw result.error;
  if (result.status !== 0 && result.status !== null) {
    throw new Error(result.stderr ?? `npm install exited with code ${result.status}`);
  }
}
```

### Shallow template directory copy

```typescript
import { readdirSync, copyFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

function copyTemplateDir(templateDir: string, destDir: string, yesMode: boolean): void {
  // templateDir is relative to wizard/ root — resolve from __dirname in CJS
  const src = join(__dirname, '..', templateDir);
  mkdirSync(destDir, { recursive: true });

  for (const file of readdirSync(src)) {
    const srcFile = join(src, file);
    const destFile = join(destDir, file);
    if (existsSync(destFile) && !yesMode) {
      // prompt user (use @clack/prompts confirm)
    }
    if (existsSync(destFile)) {
      copyFileSync(destFile, `${destFile}.bak`); // backup
    }
    copyFileSync(srcFile, destFile);
  }
}
```

### Running postInstall commands

```typescript
function runPostInstall(commands: string[]): void {
  for (const cmd of commands) {
    const [bin, ...args] = cmd.split(' ');
    const result = spawnSync(bin!, args, {
      cwd: process.cwd(),
      stdio: 'pipe',
      encoding: 'utf-8',
      shell: false,
    });
    if (result.status !== 0 && result.status !== null) {
      throw new Error(`postInstall "${cmd}" failed: ${result.stderr}`);
    }
  }
}
```

### Husky hook file content

```
# .husky/pre-commit (no shebang — Husky v9 requirement)
npx lint-staged
npx tsc --noEmit
```

```
# .husky/commit-msg (no shebang — Husky v9 requirement)
npx --no -- commitlint --edit "$1"
```

### package.json additions per module

```typescript
// Husky module injections
const HUSKY_PKG_ADDITIONS = {
  scripts: {
    prepare: 'husky install',
  },
  'lint-staged': {
    '*.{ts,tsx,js,jsx}': ['eslint --fix'],
  },
};

// Vitest module injections
const VITEST_PKG_ADDITIONS = {
  scripts: {
    test: 'vitest run --reporter=verbose',
    'test:coverage': 'vitest run --coverage',
  },
};
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `husky install` via `prepare` script | `npx husky install` as explicit postInstall | Husky v9 (2024) | `prepare` still works but postInstall is more explicit for template scenarios |
| `.huskyrc` / `husky` key in `package.json` | Hook files directly in `.husky/` dir | Husky v5+ | Hook content lives in `.husky/`, not config |
| Husky hook files with `#!/bin/sh` shebang | No shebang — plain commands only | Husky v9 | Shebang breaks Husky v9's internal sourcing |
| `nyc` for coverage | `@vitest/coverage-v8` (V8 native) | Vitest v1+ | Faster, no instrumentation overhead, native lcov output |

---

## Open Questions

1. **Batch vs per-module npm install**
   - What we know: Per-module is simpler to error-isolate; batch (all devDeps in one `npm install`) is faster.
   - What's unclear: Whether a single module's package resolution failure should block others.
   - Recommendation: Use per-module install — matches the error-isolation contract (mark one module failed, continue). Accept the performance tradeoff; wizard installs are one-time operations.

2. **`lint-staged` in `package.json` vs `.lintstagedrc` file**
   - What we know: Both are supported by lint-staged v15.
   - What's unclear: User preference.
   - Recommendation: Inject `lint-staged` key into `package.json` (fewer files, easier to see). If the key already exists, log a warning and skip injection (don't overwrite user config).

3. **`npx` availability in postInstall on Windows**
   - What we know: `npx` is available when Node/npm is installed.
   - What's unclear: PATH availability during `spawnSync` with `shell: false`.
   - Recommendation: Use `shell: true` for postInstall commands only (since they use `npx`). For `npm install`, use args array with `shell: false`. Document this distinction.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest ^4.0.0 |
| Config file | `wizard/vitest.config.ts` (already exists at project root of wizard/) |
| Quick run command | `cd wizard && npm test` |
| Full suite command | `cd wizard && npm run test:coverage` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| QA-01 | Husky + lint-staged installed and pre-commit hook fires | integration (smoke) | `cd wizard && npm test -- installer.test.ts` | ❌ Wave 0 |
| QA-01 | `package.json` lint-staged key injected without overwriting existing scripts | unit | `cd wizard && npm test -- installer.test.ts` | ❌ Wave 0 |
| QA-02 | commit-msg hook file written with LF endings and correct content | unit | `cd wizard && npm test -- installer.test.ts` | ❌ Wave 0 |
| QA-02 | commitlint.config.mjs copied to target project | unit | `cd wizard && npm test -- installer.test.ts` | ❌ Wave 0 |
| QA-03 | Vitest install adds `test` and `test:coverage` scripts to package.json | unit | `cd wizard && npm test -- installer.test.ts` | ❌ Wave 0 |
| QA-03 | Coverage thresholds in vitest.config.ts are 80/80/80/70 | unit | `cd wizard && npm test -- installer.test.ts` | ❌ Wave 0 |
| QA-04 | vitest.config.ts template outputs `coverage/lcov.info` (lcov reporter + correct path) | unit | `cd wizard && npm test -- installer.test.ts` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `cd wizard && npm test`
- **Per wave merge:** `cd wizard && npm run test:coverage`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `wizard/tests/installer.test.ts` — covers all QA-01 through QA-04 unit + integration assertions
- [ ] Test helper: temp directory fixture for simulating target project (`fs.mkdtempSync` + cleanup)
- [ ] Test helper: mock `spawnSync` to avoid real npm calls in unit tests (use `vi.mock('node:child_process')`)

---

## Sources

### Primary (HIGH confidence)

- Codebase: `wizard/src/registry.ts`, `types.ts`, `config.ts`, `index.ts` — direct inspection of existing patterns
- Codebase: `wizard/templates/husky/commitlint.config.mjs`, `wizard/templates/vitest/vitest.config.ts` — confirmed template content
- `.planning/STATE.md` decisions — confirmed Husky v9 no-shebang rule, `process.cwd()` pattern
- `wizard/package.json` — confirmed `@clack/prompts ^1.1.0` already installed

### Secondary (MEDIUM confidence)

- Husky v9 documentation (confirmed via STATE.md decision log): hooks are plain files, no shebang, `npx husky install` initializes `.husky/`
- Node.js `child_process.spawnSync` official API — standard, stable across Node 20+

### Tertiary (LOW confidence)

- None. All findings are directly verifiable from codebase or well-established Node.js built-in APIs.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all dependencies already in `package.json`; only Node built-ins needed
- Architecture: HIGH — patterns derived directly from existing codebase conventions
- Pitfalls: HIGH — Husky v9 no-shebang is confirmed in STATE.md; LF requirement is in CONTEXT.md; others are well-known Node.js behaviors

**Research date:** 2026-03-15
**Valid until:** 2026-06-15 (stable: Husky v9, Vitest v4, commitlint v19 are all current majors)
