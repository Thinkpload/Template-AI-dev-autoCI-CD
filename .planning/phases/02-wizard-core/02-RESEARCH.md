# Phase 2: Wizard Core - Research

**Researched:** 2026-03-15
**Domain:** Interactive CLI wizard — @clack/prompts, UserSelections, .template-config.json, idempotency, --yes mode, error resilience
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| WIZ-01 | User can run wizard via `./setup.sh` or `npx` and see an interactive prompt sequence | `@clack/prompts` intro/group/outro pattern; `bin` field in wizard/package.json already set to `./dist/index.cjs` |
| WIZ-02 | Wizard presents module categories with checkboxes for multi-select and radio-selects for mutually exclusive choices | `multiselect` (initialValues for pre-check) + `select` (radio) from @clack/prompts; AI methodology and agentic system use `select`; module list uses `multiselect` |
| WIZ-03 | Wizard writes `.template-config.json` with selected modules and install state after completion | `fs.writeFileSync` with `JSON.stringify`; schema defined in research; path = `process.cwd()/.template-config.json` |
| WIZ-04 | Re-running wizard skips already-installed modules | Read `.template-config.json` at startup; filter MODULE_REGISTRY entries where `installState === 'installed'`; show log.warn skipping message |
| WIZ-05 | Wizard detects conflicting module selections and shows error before any installation | `conflicts` field already on ModuleDefinition; validate after multiselect resolves; exit before any install starts |
| WIZ-06 | Wizard supports `--yes` / `--skip` flag for non-interactive/CI mode | `process.argv.includes('--yes')`; default selection = all `must-have` modules + BMAD + GSD |
| WIZ-07 | Wizard gracefully handles install failures — logs error, continues, summarizes at end | try/catch per module; accumulate failures array; render summary with log.warn after all modules attempted |
| AI-01 | User can select BMAD methodology — wizard installs via npm | `select` prompt with `bmad` option; devDeps from MODULE_REGISTRY (`@bmad-method/bmad-agent@6.0.0`); postInstall `npx bmad-method install` |
| AI-02 | User can select GSD workflow engine — wizard confirms GSD active or updates | GSD is in-repo at `.claude/get-shit-done/VERSION`; wizard reads current version, compares to `GSD_VERSION` constant (currently `2.0.0`); Phase 3 handles actual update; Phase 2 only records the selection |
| AI-03 | User can select both BMAD and GSD — both installed without conflicts | `bmad` and `gsd` have no `conflicts` entries in MODULE_REGISTRY; wizard accepts both selected simultaneously |
</phase_requirements>

---

## Summary

Phase 2 builds the interactive wizard layer on top of Phase 1's static data foundation. The wizard is a single TypeScript entry point (`wizard/src/wizard.ts`) that runs under `npx create-ai-template`. It uses `@clack/prompts` (currently v1.1.0) to present a structured prompt sequence, collects all user input into a `UserSelections` object, validates conflict rules from `MODULE_REGISTRY`, writes `.template-config.json`, and exits. The actual module installation happens in Phase 3 — Phase 2 is purely collect-validate-persist.

The three mutually-exclusive selection areas are: (1) AI methodology (`select`: BMAD / GSD / both), (2) agentic system (`select`: Claude Code / Cursor / VS Code), and (3) installable modules (`multiselect` with must-have items pre-checked via `initialValues`). Conflict detection for ORM and Auth pairs lives in MODULE_REGISTRY's `conflicts` field and is validated immediately after the multiselect resolves, before any side effects.

The idempotency guard is simple: at startup read `.template-config.json`; for each module entry where `installState === 'installed'`, remove it from the multiselect options and emit a `log.warn` skip message. This means re-runs present a shorter module list with already-done modules absent. The `--yes` flag bypasses all prompts and selects all must-have modules plus BMAD and GSD.

**Primary recommendation:** Build wizard in two source files — `wizard/src/wizard.ts` (all prompt logic, returns `UserSelections`) and `wizard/src/config.ts` (read/write `.template-config.json`). Keep wizard.ts a pure async function that `index.ts` calls, so it is testable with a mock prompts layer in Vitest.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@clack/prompts` | ^1.1.0 | Interactive prompts (intro, select, multiselect, spinner, group) | Locked in project decisions — "TypeScript npx package using @clack/prompts" |
| Node.js `fs` | built-in | Read/write `.template-config.json` | No external dep needed for simple JSON file I/O |
| Node.js `process` | built-in | `process.argv`, `process.cwd()`, `process.exit()` | Standard CLI plumbing |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `tsup` | ^8.x | Bundle `wizard/src/` → CJS (already configured) | Build step only — already in wizard/package.json |
| `vitest` | ^4.x | Unit-test wizard logic (already installed) | test suite for wizard.ts and config.ts |

### Not Needed (intentionally excluded)

| Library | Why Excluded |
|---------|--------------|
| `commander` / `yargs` | Only one flag (`--yes`) — `process.argv.includes('--yes')` is sufficient |
| `inquirer` | Project locked to `@clack/prompts` |
| `cosmiconfig` | Config file location is fixed (`.template-config.json` at cwd) |

**Installation:**
```bash
cd wizard && npm install @clack/prompts
```

---

## Architecture Patterns

### Recommended Source Structure

```
wizard/src/
├── index.ts           # Entry point: calls runWizard(), handles top-level process.exit
├── wizard.ts          # runWizard(): all @clack/prompts calls, returns UserSelections
├── config.ts          # readConfig() / writeConfig() for .template-config.json
├── types.ts           # (exists) ModuleDefinition, UserSelections interface (add in Phase 2)
├── registry.ts        # (exists) MODULE_REGISTRY constant — do not modify
└── dependency-versions.ts  # (exists) version pins — do not modify
```

### UserSelections Interface (add to types.ts)

```typescript
// Add to wizard/src/types.ts

export type AiMethodology = 'bmad' | 'gsd' | 'both';
export type AgenticSystem = 'claude-code' | 'cursor' | 'vscode';

export interface UserSelections {
  aiMethodology: AiMethodology;
  agenticSystem: AgenticSystem;
  selectedModules: ModuleId[];
}
```

### TemplateConfig Schema (persisted to .template-config.json)

```typescript
// wizard/src/config.ts

export type InstallState = 'pending' | 'installed' | 'failed' | 'skipped';

export interface ModuleInstallRecord {
  id: string;
  installState: InstallState;
}

export interface TemplateConfig {
  wizardVersion: string;           // from wizard/package.json version field
  aiMethodology: AiMethodology;
  agenticSystem: AgenticSystem;
  modules: ModuleInstallRecord[];
  createdAt: string;               // ISO 8601
  updatedAt: string;               // ISO 8601
}
```

**Example `.template-config.json` output:**
```json
{
  "wizardVersion": "0.1.0",
  "aiMethodology": "both",
  "agenticSystem": "claude-code",
  "modules": [
    { "id": "eslint", "installState": "pending" },
    { "id": "husky", "installState": "pending" },
    { "id": "vitest", "installState": "pending" },
    { "id": "tsconfig", "installState": "pending" },
    { "id": "bmad", "installState": "pending" },
    { "id": "gsd", "installState": "pending" }
  ],
  "createdAt": "2026-03-15T10:00:00.000Z",
  "updatedAt": "2026-03-15T10:00:00.000Z"
}
```

### Pattern 1: Wizard Entry Point with @clack/prompts

**What:** `runWizard()` is an async function that orchestrates the prompt sequence using `@clack/prompts`. It calls `intro()`, then the prompt sequence, then `outro()`, then returns `UserSelections`.

**When to use:** Always — keep all prompt calls inside `runWizard()` so they can be isolated and mocked in tests.

```typescript
// wizard/src/wizard.ts
// Source: @clack/prompts official docs (bomb.sh/docs/clack/packages/prompts/)

import {
  intro, outro, select, multiselect, isCancel, cancel, log
} from '@clack/prompts';
import { MODULE_REGISTRY } from './registry.js';
import { readConfig } from './config.js';
import type { UserSelections, AiMethodology, AgenticSystem, ModuleId } from './types.js';

export async function runWizard(yesMode = false): Promise<UserSelections> {
  intro('create-ai-template — AI dev environment setup');

  const existingConfig = readConfig();    // null if file doesn't exist

  // Step 1: AI Methodology (radio select — mutually exclusive handled by select())
  const aiMethodology = yesMode
    ? 'both'
    : await select<AiMethodology>({
        message: 'Which AI methodology would you like?',
        options: [
          { value: 'bmad', label: 'BMAD Method v6', hint: 'AI-driven development agents' },
          { value: 'gsd', label: 'GSD Workflow Engine', hint: 'Already in repo, will activate' },
          { value: 'both', label: 'Both BMAD + GSD', hint: 'Recommended' },
        ],
        initialValue: 'both',
      });

  if (isCancel(aiMethodology)) { cancel('Setup cancelled.'); process.exit(0); }

  // Step 2: Agentic system (radio select)
  const agenticSystem = yesMode
    ? 'claude-code'
    : await select<AgenticSystem>({
        message: 'Which agentic system do you use?',
        options: [
          { value: 'claude-code', label: 'Claude Code' },
          { value: 'cursor', label: 'Cursor' },
          { value: 'vscode', label: 'VS Code' },
        ],
        initialValue: 'claude-code',
      });

  if (isCancel(agenticSystem)) { cancel('Setup cancelled.'); process.exit(0); }

  // Step 3: Module multi-select — must-have pre-checked, already-installed filtered out
  const installedIds = (existingConfig?.modules ?? [])
    .filter(m => m.installState === 'installed')
    .map(m => m.id);

  const availableModules = Object.values(MODULE_REGISTRY)
    .filter(m => !installedIds.includes(m.id));

  for (const skipped of installedIds) {
    log.warn(`${MODULE_REGISTRY[skipped as ModuleId].label} — already installed, skipping`);
  }

  const mustHaveIds = availableModules
    .filter(m => m.priority === 'must-have')
    .map(m => m.id);

  const selectedModules = yesMode
    ? [...mustHaveIds, 'bmad', 'gsd'].filter(id => availableModules.some(m => m.id === id))
    : await multiselect<ModuleId>({
        message: 'Select modules to install (must-have pre-selected):',
        options: availableModules.map(m => ({
          value: m.id as ModuleId,
          label: m.label,
          hint: m.description,
        })),
        initialValues: mustHaveIds as ModuleId[],
        required: false,
      });

  if (isCancel(selectedModules)) { cancel('Setup cancelled.'); process.exit(0); }

  outro('Selections complete. Writing config...');

  return {
    aiMethodology: aiMethodology as AiMethodology,
    agenticSystem: agenticSystem as AgenticSystem,
    selectedModules: selectedModules as ModuleId[],
  };
}
```

### Pattern 2: Conflict Validation (WIZ-05)

**What:** After collecting `selectedModules`, iterate and check `MODULE_REGISTRY[id].conflicts` against the other selected IDs. Emit `log.error` and exit before any installation.

**When to use:** Always called immediately after multiselect resolves, before writeConfig().

```typescript
// wizard/src/wizard.ts — called inside runWizard() after multiselect resolves

function validateConflicts(selectedIds: ModuleId[]): string[] {
  const errors: string[] = [];
  for (const id of selectedIds) {
    const def = MODULE_REGISTRY[id];
    for (const conflictId of (def.conflicts ?? [])) {
      if (selectedIds.includes(conflictId as ModuleId)) {
        errors.push(
          `"${def.label}" conflicts with "${MODULE_REGISTRY[conflictId as ModuleId].label}" — select one or the other`
        );
      }
    }
  }
  // Deduplicate (A conflicts B and B conflicts A produce two entries)
  return [...new Set(errors)];
}

// Usage in runWizard():
const conflicts = validateConflicts(selectedModules as ModuleId[]);
if (conflicts.length > 0) {
  for (const err of conflicts) { log.error(err); }
  cancel('Resolve conflicts and re-run.');
  process.exit(1);
}
```

### Pattern 3: Config Read/Write (WIZ-03, WIZ-04)

**What:** Two pure functions in `config.ts` — no side effects beyond file I/O.

```typescript
// wizard/src/config.ts
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { TemplateConfig, ModuleInstallRecord } from './types.js';

const CONFIG_PATH = join(process.cwd(), '.template-config.json');

export function readConfig(): TemplateConfig | null {
  try {
    return JSON.parse(readFileSync(CONFIG_PATH, 'utf-8')) as TemplateConfig;
  } catch {
    return null;
  }
}

export function writeConfig(config: TemplateConfig): void {
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
}

export function buildInitialConfig(
  selections: UserSelections,
  wizardVersion: string,
): TemplateConfig {
  const now = new Date().toISOString();
  return {
    wizardVersion,
    aiMethodology: selections.aiMethodology,
    agenticSystem: selections.agenticSystem,
    modules: selections.selectedModules.map(id => ({
      id,
      installState: 'pending',
    })),
    createdAt: now,
    updatedAt: now,
  };
}
```

### Pattern 4: --yes Flag Wiring in index.ts

**What:** `index.ts` is the CLI entry point. It reads `process.argv`, resolves `yesMode`, calls `runWizard(yesMode)`, calls `writeConfig()`, then exits.

```typescript
// wizard/src/index.ts (Phase 2 additions)
import { runWizard } from './wizard.js';
import { buildInitialConfig, readConfig, writeConfig } from './config.js';
import { createRequire } from 'node:module';

// Read wizard version from package.json (CJS-safe approach)
const require = createRequire(import.meta.url);
const { version } = require('../package.json') as { version: string };

const yesMode = process.argv.includes('--yes') || process.argv.includes('-y');

async function main() {
  const selections = await runWizard(yesMode);
  const existingConfig = readConfig();
  const config = buildInitialConfig(selections, version);

  // Preserve already-installed records from a previous run
  if (existingConfig) {
    const installedRecords = existingConfig.modules.filter(m => m.installState === 'installed');
    config.modules = [...installedRecords, ...config.modules];
    config.createdAt = existingConfig.createdAt;  // preserve original creation date
  }

  writeConfig(config);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
```

**Note:** The wizard/package.json has `"type": "commonjs"` and the bin points to `./dist/index.cjs`. The `createRequire` approach shown above is for ESM context — if staying CJS throughout, use `require('../package.json')` directly.

### Pattern 5: WIZ-07 Error-Resilient Install Loop (Phase 3 interface contract)

Phase 2 does NOT install modules — it only writes `pending` records to `.template-config.json`. However, Phase 2 must establish the error-resilience contract in types.ts so Phase 3 can honor it. The `installState: 'failed'` field on `ModuleInstallRecord` is how failures are persisted. The WIZ-07 "summarize failures at end" behavior is Phase 3 implementation, but Phase 2 defines the schema that enables it.

### Anti-Patterns to Avoid

- **Calling install commands from wizard.ts:** wizard.ts only collects selections and writes config. Installation is Phase 3.
- **Using `@clack/prompts` `group()` for the full flow:** `group()` is convenient but makes per-prompt isCancel() checks awkward. Use sequential awaits with individual isCancel() guards.
- **Writing config before conflict validation:** Always validate conflicts, then write config. Never write a partial config.
- **Hardcoding default module IDs in --yes mode:** Derive defaults from `MODULE_REGISTRY` (all `must-have` priority entries) so adding a new module to the registry automatically includes it in CI defaults.
- **Making `readConfig()` throw on missing file:** Return `null` — absent config is not an error, it means first run.
- **Storing the GSD version check result as an error:** GSD version mismatch is not a blocker in Phase 2. Record the selection; Phase 3 handles actual GSD activation. Do NOT make Phase 2 fail if GSD_VERSION constant differs from the in-repo `.claude/get-shit-done/VERSION` file (`1.22.4` vs `2.0.0` currently).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Interactive prompts | Custom readline/ANSI escape sequences | `@clack/prompts` | Handles terminal detection, keypress, colors, accessibility — ~500 lines of complex terminal code |
| Radio select (single choice) | Custom prompt | `@clack/prompts` `select()` | Physically impossible to select two values from a `select()` — enforces constraint at UI level |
| Pre-checked multiselect | Custom toggle logic | `multiselect({ initialValues: [...] })` | Built-in parameter in @clack/prompts 0.5.0+ |
| Config file schema validation | Custom JSON schema validator | TypeScript interface + try/catch parse | Config is written by our own code — strict types are sufficient |
| Argument parsing | commander/yargs | `process.argv.includes('--yes')` | Single flag; full CLI parser adds 50KB to bundle for no benefit |

**Key insight:** The UI complexity of terminal prompts is deceptively high. `@clack/prompts` handles cursor positioning, ANSI codes, Windows terminal compatibility, and graceful CTRL+C handling. Do not reimplement any of this.

---

## Common Pitfalls

### Pitfall 1: multiselect returns symbol on cancel, not empty array

**What goes wrong:** Developer writes `if (selectedModules.length === 0)` to detect cancellation. But `@clack/prompts` returns a `Symbol` when the user presses CTRL+C, not an empty array. Calling `.length` on a Symbol throws `TypeError`.

**Why it happens:** The TypeScript return type `Value[] | symbol` requires an explicit `isCancel()` check before treating the result as an array.

**How to avoid:** Always call `isCancel(result)` immediately after every prompt:
```typescript
if (isCancel(selectedModules)) { cancel('Setup cancelled.'); process.exit(0); }
```

**Warning signs:** `TypeError: Cannot read properties of undefined` at runtime when user cancels.

### Pitfall 2: initialValues key name (singular vs plural)

**What goes wrong:** Developer writes `initialValue: ['eslint', 'husky']` for multiselect. No TypeScript error (older types may not catch it), but pre-selection does not work.

**Why it happens:** `text()` uses `initialValue` (singular). `multiselect()` uses `initialValues` (plural, array). The rename happened in @clack/prompts v0.5.0. Docs sometimes show the old name.

**How to avoid:** Always use `initialValues` (plural) for `multiselect()`. Verify with TypeScript autocomplete — the type definitions are authoritative.

### Pitfall 3: process.cwd() vs __dirname for config file path

**What goes wrong:** Developer writes `join(__dirname, '.template-config.json')`. The config file gets written into the wizard's install directory (inside `node_modules/.bin/` or similar) instead of the user's project root.

**Why it happens:** `__dirname` is the wizard package's own directory. `.template-config.json` must go in the user's project directory (wherever they ran `npx create-ai-template`).

**How to avoid:** Always use `process.cwd()` for the config file path. `__dirname` is only appropriate for resolving wizard's own internal files (e.g., templates).

### Pitfall 4: GSD_VERSION constant mismatch with actual in-repo version

**What goes wrong:** `dependency-versions.ts` has `GSD_VERSION = '2.0.0'` but `.claude/get-shit-done/VERSION` contains `1.22.4`. If Phase 2 wizard does a version check and treats mismatch as a blocking error, every run of the wizard in this repo fails.

**Why it happens:** GSD is an in-repo tool. The version constant in `dependency-versions.ts` documents the *target* version, not the *current* version.

**How to avoid:** Phase 2 wizard does NOT compare GSD_VERSION to the in-repo version. It simply records `gsd` as selected in UserSelections. Phase 3 handles activation logic. The `GSD_VERSION` constant is informational-only in Phase 2 scope.

### Pitfall 5: wizard/package.json "type": "commonjs" vs ESM imports

**What goes wrong:** Developer adds `import { createRequire } from 'node:module'` expecting ESM behavior, but wizard/package.json has `"type": "commonjs"`. tsup bundles to `.cjs` and `import.meta.url` is not available in CJS context.

**Why it happens:** The wizard package is currently configured as CJS (`"type": "commonjs"`, bin points to `./dist/index.cjs`). Phase 1 confirmed this.

**How to avoid:** In CJS context, use `require('./package.json')` or a static import for the version. Do NOT use `import.meta.url` or ESM-only APIs. Keep all source files as standard TS/CJS-compatible.

---

## Code Examples

### Full wizard.ts skeleton with all prompts

```typescript
// wizard/src/wizard.ts
// Source: @clack/prompts API docs (bomb.sh/docs/clack/packages/prompts/)

import {
  intro, outro, select, multiselect, isCancel, cancel, log
} from '@clack/prompts';
import { MODULE_REGISTRY } from './registry.js';
import { readConfig } from './config.js';
import type {
  UserSelections, AiMethodology, AgenticSystem, ModuleId
} from './types.js';

export async function runWizard(yesMode = false): Promise<UserSelections> {
  intro('create-ai-template');

  const existingConfig = readConfig();
  const installedIds = (existingConfig?.modules ?? [])
    .filter(m => m.installState === 'installed')
    .map(m => m.id);

  // Notify user about already-installed modules
  for (const id of installedIds) {
    const mod = MODULE_REGISTRY[id as ModuleId];
    if (mod) log.warn(`${mod.label} — already installed, skipping`);
  }

  const availableModules = Object.values(MODULE_REGISTRY)
    .filter(m => !installedIds.includes(m.id));

  // AI Methodology
  let aiMethodology: AiMethodology = 'both';
  if (!yesMode) {
    const result = await select({
      message: 'Which AI methodology?',
      options: [
        { value: 'bmad' as AiMethodology, label: 'BMAD Method v6' },
        { value: 'gsd' as AiMethodology, label: 'GSD Workflow Engine' },
        { value: 'both' as AiMethodology, label: 'Both (recommended)' },
      ],
      initialValue: 'both' as AiMethodology,
    });
    if (isCancel(result)) { cancel('Cancelled.'); process.exit(0); }
    aiMethodology = result as AiMethodology;
  }

  // Agentic System
  let agenticSystem: AgenticSystem = 'claude-code';
  if (!yesMode) {
    const result = await select({
      message: 'Which agentic system?',
      options: [
        { value: 'claude-code' as AgenticSystem, label: 'Claude Code' },
        { value: 'cursor' as AgenticSystem, label: 'Cursor' },
        { value: 'vscode' as AgenticSystem, label: 'VS Code' },
      ],
      initialValue: 'claude-code' as AgenticSystem,
    });
    if (isCancel(result)) { cancel('Cancelled.'); process.exit(0); }
    agenticSystem = result as AgenticSystem;
  }

  // Module selection
  const mustHaveIds = availableModules
    .filter(m => m.priority === 'must-have')
    .map(m => m.id as ModuleId);

  let selectedModules: ModuleId[];
  if (yesMode) {
    selectedModules = [...mustHaveIds, 'bmad' as ModuleId, 'gsd' as ModuleId]
      .filter(id => availableModules.some(m => m.id === id));
  } else {
    const result = await multiselect<ModuleId>({
      message: 'Select modules to install:',
      options: availableModules.map(m => ({
        value: m.id as ModuleId,
        label: m.label,
        hint: m.description,
      })),
      initialValues: mustHaveIds,
      required: false,
    });
    if (isCancel(result)) { cancel('Cancelled.'); process.exit(0); }
    selectedModules = result as ModuleId[];
  }

  // Conflict validation
  const errors = validateConflicts(selectedModules);
  if (errors.length > 0) {
    for (const err of errors) log.error(err);
    cancel('Resolve conflicts and re-run.');
    process.exit(1);
  }

  outro('Selections captured.');

  return { aiMethodology, agenticSystem, selectedModules };
}

function validateConflicts(ids: ModuleId[]): string[] {
  const seen = new Set<string>();
  const errors: string[] = [];
  for (const id of ids) {
    for (const cid of (MODULE_REGISTRY[id]?.conflicts ?? [])) {
      if (ids.includes(cid as ModuleId)) {
        const key = [id, cid].sort().join('|');
        if (!seen.has(key)) {
          seen.add(key);
          errors.push(
            `"${MODULE_REGISTRY[id].label}" conflicts with "${MODULE_REGISTRY[cid as ModuleId]?.label ?? cid}"`
          );
        }
      }
    }
  }
  return errors;
}
```

### Vitest test structure for wizard.ts

```typescript
// wizard/tests/wizard.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock @clack/prompts before importing wizard
vi.mock('@clack/prompts', () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  select: vi.fn(),
  multiselect: vi.fn(),
  isCancel: vi.fn().mockReturnValue(false),
  cancel: vi.fn(),
  log: { warn: vi.fn(), error: vi.fn() },
}));

// Mock config to return null (fresh run)
vi.mock('../src/config.js', () => ({
  readConfig: vi.fn().mockReturnValue(null),
}));

import { runWizard } from '../src/wizard.js';
import * as clack from '@clack/prompts';

describe('runWizard', () => {
  it('--yes mode returns must-have + bmad + gsd without any prompts', async () => {
    const result = await runWizard(true);
    expect(clack.select).not.toHaveBeenCalled();
    expect(clack.multiselect).not.toHaveBeenCalled();
    expect(result.aiMethodology).toBe('both');
    expect(result.selectedModules).toContain('eslint');
    expect(result.selectedModules).toContain('bmad');
  });

  it('conflict validation exits on conflicting modules', async () => {
    // This is tested via validateConflicts directly (export it for testing)
  });
});
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `inquirer` for CLI prompts | `@clack/prompts` | 2022 | Better UX, smaller bundle, more opinionated |
| `initialValue` (singular) for multiselect | `initialValues` (plural, array) | @clack/prompts v0.5.0 | Must use `initialValues` or pre-selection silently fails |
| `commander` for single flags | `process.argv.includes()` | always valid | Eliminate a dependency for one-flag CLIs |
| JSON config in `~/.config/` | Config in project root (`.template-config.json`) | per-project tools convention | Aligns with `package.json`, `.eslintrc` etc. — project-local |

---

## Open Questions

1. **GSD_VERSION constant value (`2.0.0`) vs in-repo version (`1.22.4`)**
   - What we know: `dependency-versions.ts` has `GSD_VERSION = '2.0.0'`; `.claude/get-shit-done/VERSION` is `1.22.4`
   - What's unclear: Does this discrepancy need to be resolved in Phase 2, or is it a deferred Phase 3 concern?
   - Recommendation: Phase 2 does not check or compare versions — it records GSD as selected. Update `GSD_VERSION` constant to match actual version (`1.22.4`) as part of Phase 2 config setup, OR leave the constant as the target upgrade version and document it. Either way, no blocking behavior in Phase 2.

2. **`npx create-ai-template` vs `./setup.sh` entry point for Phase 2**
   - What we know: WIZ-01 requires both. `wizard/package.json` already has the bin field pointing to `./dist/index.cjs`. `setup.sh` presumably calls `node wizard/dist/index.cjs` or `npx create-ai-template`.
   - What's unclear: Does `setup.sh` exist yet, and what does it contain? Phase 1 plans don't mention creating it.
   - Recommendation: Phase 2 should create/verify `setup.sh` at repo root that does `node wizard/dist/index.cjs "$@"` to pass through flags like `--yes`.

3. **Module list scope for Phase 2 wizard**
   - What we know: MODULE_REGISTRY currently has 6 modules (eslint, husky, vitest, tsconfig, bmad, gsd). REQUIREMENTS.md v2 scope mentions Prisma, Drizzle, Better Auth, Clerk — but these are explicitly v2 scope.
   - What's unclear: Should the wizard's multiselect show any v2 stub entries (disabled) or strictly only the 6 current modules?
   - Recommendation: Show only the 6 modules from MODULE_REGISTRY. No disabled stubs — they would confuse users and create technical debt.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest v4 (already in wizard/package.json devDependencies) |
| Config file | `wizard/vitest.config.ts` (created in Phase 1 Wave 0) |
| Quick run command | `cd wizard && npx vitest run --reporter=verbose` |
| Full suite command | `cd wizard && npx vitest run --coverage` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| WIZ-01 | `wizard/dist/index.cjs` is executable and prints intro banner | smoke | `node wizard/dist/index.cjs --yes 2>&1 \| grep "create-ai-template"` | Wave 0 |
| WIZ-02 | `runWizard(false)` calls `select()` twice and `multiselect()` once | unit | `cd wizard && npx vitest run tests/wizard.test.ts -t "prompt sequence"` | Wave 0 |
| WIZ-02 | must-have modules are pre-checked in multiselect (`initialValues` contains must-haves) | unit | `cd wizard && npx vitest run tests/wizard.test.ts -t "must-have pre-checked"` | Wave 0 |
| WIZ-03 | `writeConfig(buildInitialConfig(selections, version))` produces valid JSON with all required fields | unit | `cd wizard && npx vitest run tests/config.test.ts -t "write config"` | Wave 0 |
| WIZ-04 | Already-installed module IDs are excluded from multiselect options on re-run | unit | `cd wizard && npx vitest run tests/wizard.test.ts -t "idempotency"` | Wave 0 |
| WIZ-05 | `validateConflicts(['prisma', 'drizzle'])` returns a non-empty error array | unit | `cd wizard && npx vitest run tests/wizard.test.ts -t "conflict detection"` | Wave 0 |
| WIZ-06 | `runWizard(true)` returns without calling any prompt function | unit | `cd wizard && npx vitest run tests/wizard.test.ts -t "--yes mode"` | Wave 0 |
| WIZ-07 | `ModuleInstallRecord.installState` type includes 'failed' and 'skipped' | unit | `cd wizard && npx vitest run tests/config.test.ts -t "install state schema"` | Wave 0 |
| AI-01 | `MODULE_REGISTRY.bmad.devDeps` contains `@bmad-method/bmad-agent@6.0.0` | unit | already in existing registry.test.ts | exists |
| AI-02 | `MODULE_REGISTRY.gsd` entry exists with empty devDeps | unit | already in existing registry.test.ts | exists |
| AI-03 | `runWizard(true)` selectedModules includes both `bmad` and `gsd` | unit | `cd wizard && npx vitest run tests/wizard.test.ts -t "both bmad and gsd"` | Wave 0 |

**Note on WIZ-05 test:** Current MODULE_REGISTRY has no conflicting modules (all `conflicts: []`). The conflict validation logic can be tested by calling `validateConflicts` with a synthetic pair of IDs that have been given conflicts in the registry. Alternatively, add a test module pair to the registry for test purposes only. Recommendation: export `validateConflicts` from wizard.ts and test it directly with a mocked registry.

### Sampling Rate

- **Per task commit:** `cd wizard && npx vitest run --reporter=verbose`
- **Per wave merge:** `cd wizard && npx vitest run --coverage`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `wizard/tests/wizard.test.ts` — covers WIZ-01, WIZ-02, WIZ-04, WIZ-05, WIZ-06, AI-03
- [ ] `wizard/tests/config.test.ts` — covers WIZ-03, WIZ-07 schema validation
- [ ] `@clack/prompts` added to `wizard/package.json` dependencies (not yet installed)

---

## Sources

### Primary (HIGH confidence)
- [bomb.sh/docs/clack/packages/prompts/](https://bomb.sh/docs/clack/packages/prompts/) — full API reference: select, multiselect, intro, outro, spinner, isCancel, cancel, group
- [app.unpkg.com/@clack/prompts@0.9.1/files/README.md](https://app.unpkg.com/@clack/prompts@0.9.1/files/README.md) — function signatures and examples
- `wizard/src/types.ts` (local) — existing ModuleDefinition, ModuleId, ModuleRegistry types
- `wizard/src/registry.ts` (local) — MODULE_REGISTRY with 6 modules and conflicts fields
- `wizard/package.json` (local) — confirmed `"type": "commonjs"`, bin `./dist/index.cjs`, tsup build
- `.claude/get-shit-done/VERSION` (local) — actual GSD version `1.22.4`
- `.planning/phases/01-foundation/01-RESEARCH.md` (local) — Phase 1 architecture decisions

### Secondary (MEDIUM confidence)
- WebSearch results confirming @clack/prompts v1.1.0 current, `initialValues` plural form since v0.5.0
- [docs.bmad-method.org/how-to/install-bmad/](https://docs.bmad-method.org/how-to/install-bmad/) — `npx bmad-method install` confirmed as correct invocation

### Tertiary (LOW confidence — verify before coding)
- `@clack/prompts` `multiselect` TypeScript return type `Value[] | symbol` — verify autocomplete matches when installing v1.1.0
- `select()` `initialValue` parameter availability in v1.1.0 (documented in 0.9.1 README, expected stable)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — @clack/prompts confirmed from official docs; project already has tsup/vitest
- Architecture: HIGH — patterns derived from existing Phase 1 types and registry; direct adaptation
- Pitfalls: HIGH — isCancel/symbol trap and initialValues naming are well-documented gotchas
- GSD version discrepancy: MEDIUM — factual observation, recommendation is conservative (no blocking behavior in Phase 2)

**Research date:** 2026-03-15
**Valid until:** 2026-04-15 (stable; @clack/prompts API unlikely to break between minor versions)
