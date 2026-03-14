# Architecture Research

**Domain:** Interactive CLI Project Setup Wizard (Node.js)
**Researched:** 2026-03-14
**Confidence:** MEDIUM — core patterns from create-t3-app source analysis (HIGH); specific implementation details from WebSearch (MEDIUM)

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      CLI Entry Point                             │
│  npx setup-wizard / bash setup.sh                               │
│  Parses argv, sets defaults, hands off to Wizard Orchestrator   │
└─────────────────────────┬───────────────────────────────────────┘
                           │
┌─────────────────────────▼───────────────────────────────────────┐
│                    Wizard Orchestrator                           │
│  Runs prompt sequence → collects UserSelections object          │
│  @clack/prompts: intro, multiselect, confirm, spinner, outro    │
└──────┬──────────────────┬──────────────────┬────────────────────┘
       │                  │                  │
┌──────▼──────┐  ┌────────▼──────┐  ┌────────▼──────────────────┐
│  Module     │  │  File         │  │  Package Installer        │
│  Registry   │  │  Merger       │  │                           │
│             │  │               │  │  npm install / spawn      │
│  Map of     │  │  fs.copyFile  │  │  Handles deps list from   │
│  module     │  │  JSON merge   │  │  each selected module     │
│  metadata   │  │  template     │  │                           │
│  + deps     │  │  substitution │  │                           │
└──────┬──────┘  └────────┬──────┘  └────────┬──────────────────┘
       │                  │                  │
       └──────────────────┼──────────────────┘
                           │
┌─────────────────────────▼───────────────────────────────────────┐
│                   Post-Install Runner                            │
│  Executes ordered script list: git init, npm install,           │
│  husky install, write .template-config.json, print summary      │
└─────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| CLI Entry Point | Parse argv/flags, set defaults, invoke Wizard | Node.js `process.argv`, `minimist` or built-in parsing |
| Wizard Orchestrator | Sequence prompts, collect answers into `UserSelections` | `@clack/prompts` group/multiselect; pure sequential function |
| Module Registry | Static map of all installable modules with metadata | `const modules: Record<ModuleId, ModuleDefinition>` — plain object |
| File Merger | Copy template files, merge JSON, substitute variables | `fs.cp`, `JSON.parse`/`JSON.stringify` deep merge, `mustache`/string replace |
| Package Installer | Install npm packages (prod + dev) based on selected modules | `child_process.execSync('npm install ...')` or `execa` |
| Post-Install Runner | Ordered side-effect scripts: git init, write config, print done | Ordered array of `() => void` functions executed sequentially |

---

## Recommended Project Structure

```
cli/
├── src/
│   ├── index.ts              # Entry point: parse argv, call runWizard()
│   ├── wizard.ts             # Wizard Orchestrator: prompt sequence → UserSelections
│   ├── registry.ts           # Module Registry: static module metadata map
│   ├── installer/
│   │   ├── index.ts          # Installer coordinator: fan out to sub-installers
│   │   ├── npm.ts            # npm install wrapper (prod + dev deps)
│   │   ├── files.ts          # File copy + template substitution
│   │   └── json-merge.ts     # Deep merge for package.json and config JSONs
│   ├── post-install.ts       # Post-install runner: ordered side-effect scripts
│   ├── types.ts              # Shared types: UserSelections, ModuleDefinition, InstallerOptions
│   └── utils/
│       ├── logger.ts         # Consistent stdout/stderr output with color
│       ├── spawn.ts          # child_process wrapper with error handling
│       └── idempotent.ts     # Guards: "already installed?" checks
templates/
├── husky/                    # Config files for husky module
│   ├── .husky/pre-commit
│   └── commitlint.config.mjs
├── eslint/
│   └── eslint.config.mjs
├── vitest/
│   └── vitest.config.ts
├── tsconfig/
│   └── tsconfig.json
└── ai-tooling/
    ├── .claude/              # Claude Code AI config dir
    └── .cursor/              # Cursor config dir
```

### Structure Rationale

- **`registry.ts` is a pure data file:** No logic, only module metadata. This makes adding new modules trivial without touching wizard logic.
- **`installer/` is split by concern:** npm, files, and JSON merge are independent operations — keeping them separate makes each testable in isolation.
- **`templates/` mirrors module IDs:** Each subdirectory matches a registry module ID, so file lookup is `templates/${moduleId}/`.
- **`types.ts` as single source:** `UserSelections` and `ModuleDefinition` types are shared across all components — never inlined.

---

## Architectural Patterns

### Pattern 1: Module Definition Object (create-t3-app's Installer Map pattern)

**What:** Each module is a plain object in the registry with metadata and an `install()` function (or equivalent hook list). The `buildPkgInstallerMap` pattern from create-t3-app maps each module ID to `{ inUse: boolean, installer: InstallerFn }`.

**When to use:** Always — this is the foundational pattern that makes the wizard modular.

**Trade-offs:** Slightly more upfront structure, but eliminates conditional spaghetti in the wizard orchestrator.

**Example:**
```typescript
// registry.ts
export interface ModuleDefinition {
  id: string;
  label: string;
  description: string;
  priority: "must-have" | "should-have" | "nice-to-have";
  deps: string[];         // npm prod dependencies
  devDeps: string[];      // npm dev dependencies
  templateDir: string;    // path under templates/
  postInstall?: string[]; // ordered shell commands to run after file copy
}

export const MODULE_REGISTRY: Record<string, ModuleDefinition> = {
  "husky": {
    id: "husky",
    label: "Husky + commitlint (git hooks)",
    priority: "must-have",
    deps: [],
    devDeps: ["husky@^9", "lint-staged@^15", "@commitlint/cli@^19", "@commitlint/config-conventional@^19"],
    templateDir: "templates/husky",
    postInstall: ["npx husky install"],
  },
  // ...
};
```

### Pattern 2: UserSelections as Immutable Context Object

**What:** All prompt answers are collected into a single `UserSelections` object before any installation begins. No installation logic runs during prompts. This separates "gather intent" from "execute intent."

**When to use:** Always — mixing prompts and side effects makes the wizard unpredictable and harder to test.

**Trade-offs:** Requires all questions upfront; wizard cannot adapt mid-install based on partial results. Acceptable trade-off for v1.

**Example:**
```typescript
// types.ts
export interface UserSelections {
  projectName: string;
  teamSize: "solo" | "small-team";
  aiTooling: ("claude-code" | "cursor" | "vscode")[];
  modules: string[];  // module IDs from MODULE_REGISTRY
  runGitInit: boolean;
  runNpmInstall: boolean;
}
```

### Pattern 3: JSON Deep Merge for package.json

**What:** Each module's template may include a `package.json` fragment (only the keys it needs — scripts, config fields). The File Merger deep-merges these fragments into the user's existing `package.json` rather than overwriting it.

**When to use:** Whenever a module needs to add scripts, extend `lint-staged` config, or set `commitlint` config in `package.json`.

**Trade-offs:** Merge conflicts on deeply nested keys are possible. Mitigation: modules should only write their own keys — document this as an invariant.

**Example:**
```typescript
// installer/json-merge.ts
export function mergePackageJson(target: string, fragment: object): void {
  const existing = JSON.parse(fs.readFileSync(target, "utf8"));
  const merged = deepMerge(existing, fragment);
  fs.writeFileSync(target, JSON.stringify(merged, null, 2) + "\n");
}
```

### Pattern 4: Idempotent Guards

**What:** Before each installation step, check if it has already run (e.g., does `.husky/` already exist? Is `eslint.config.mjs` already present?). If yes, skip with a log message rather than overwriting.

**When to use:** Required — PROJECT.md requires the wizard be idempotent (running twice must not break anything).

**Trade-offs:** Slightly more code per module. Required for correctness.

---

## Data Flow

### Wizard Execution Flow

```
User runs: bash setup.sh  OR  npx @org/setup-wizard
    │
    ▼
CLI Entry Point
  - parse argv (--yes flag → skip prompts, accept defaults)
  - detect existing .template-config.json (idempotent mode)
    │
    ▼
Wizard Orchestrator
  @clack/prompts sequence:
    intro("Welcome to the AI Dev Template Setup")
    text()         → projectName
    select()       → teamSize (solo | small-team)
    multiselect()  → aiTooling (claude-code, cursor, vscode)
    multiselect()  → modules (from MODULE_REGISTRY, grouped by priority)
    confirm()      → runGitInit
    confirm()      → runNpmInstall
  → UserSelections object (immutable from here)
    │
    ▼
Installer Coordinator
  For each selected module (ordered by dependency graph):
    1. File Merger: copy templateDir → project root (idempotent guard)
    2. JSON Merge:  merge package.json fragments (if any)
    3. Collect dep/devDep lists
  spinner("Installing packages...")
  Package Installer: npm install <deps> && npm install -D <devDeps>
    │
    ▼
Post-Install Runner  (ordered, each step is guarded)
  1. git init (if runGitInit && !.git exists)
  2. husky install (if husky selected)
  3. Write .template-config.json (selections snapshot)
  4. outro("Setup complete! Run npm run dev to start.")
```

### Key Data Flows

1. **UserSelections → Module list:** Wizard output is a flat `string[]` of module IDs. The registry lookup converts each ID to its `ModuleDefinition`, resolving deps, files, and post-install commands.

2. **Module definitions → install order:** Modules are sorted by a simple dependency array (module A lists module B as `requires`). Topological sort ensures B installs before A. For v1 the dependency graph is shallow (at most one level deep).

3. **Template files → project root:** File Merger iterates `templateDir/` recursively, copying each file to the equivalent path in the project root. Files that already exist are skipped unless the `--force` flag is passed.

4. **Selections → `.template-config.json`:** After install, the full `UserSelections` is written to `.template-config.json` in the project root. This serves two purposes: idempotency check on re-run, and documentation of what was installed.

---

## Scaling Considerations

This wizard runs once per project creation, not at runtime. Scale concerns are about maintainability of the wizard itself, not user load.

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 1-10 modules | Inline module definitions in `registry.ts` — simple object literal |
| 10-30 modules | Split registry into `registry/*.ts` by category (code-quality, ai-tooling, cicd), merged in `registry/index.ts` |
| 30+ modules | Consider external `modules.json` fetched from a CDN on run, enabling module updates without wizard version bump |

### Scaling Priorities

1. **First bottleneck — module maintenance:** As the template grows, editing one big `registry.ts` becomes error-prone. Split by category early (at ~10 modules).
2. **Second bottleneck — template drift:** Config files inside `templates/` go stale as tooling versions change. Version-pin templates to semver ranges and add a `wizard update` command that re-fetches templates from npm/GitHub.

---

## Anti-Patterns

### Anti-Pattern 1: Side Effects During Prompts

**What people do:** Run `npm install` or copy files immediately after each prompt answer, before the full wizard completes.

**Why it's wrong:** If the user cancels partway through (Ctrl+C), the project is in a half-installed state. Debugging the mess takes longer than the install itself.

**Do this instead:** Collect all answers first into `UserSelections`, then execute all side effects in a single batch phase. The @clack/prompts `group()` function with `onCancel` callback enforces this — cancel before execution = clean abort.

### Anti-Pattern 2: Hardcoded Package Versions in Wizard Logic

**What people do:** Scatter version strings (`"husky@^9"`, `"eslint@^9"`) throughout installer functions or prompt logic.

**Why it's wrong:** Version bumps require finding all occurrences. create-t3-app addresses this with a centralized `dependencyVersionMap.ts` — copying that pattern avoids the same pain.

**Do this instead:** All versions live in one `dependency-versions.ts` constant object. Every installer imports from it. Version updates are a single-file diff.

### Anti-Pattern 3: Overwriting User Files Without Merging

**What people do:** `fs.copyFile(template, destination, COPYFILE_EXCL)` fails silently if file exists, or overwrites without checking.

**Why it's wrong:** Running the wizard after the user has customized `eslint.config.mjs` or `tsconfig.json` destroys their work. Idempotency requirement from PROJECT.md forbids this.

**Do this instead:** For JSON files, use deep merge (see Pattern 3). For non-JSON config files (`.md`, `.mjs`), check existence first and skip with a `[SKIP] file already exists` log. Provide a `--force` flag for deliberate overwrite.

### Anti-Pattern 4: Monolithic Install Function

**What people do:** One large `install()` function with 10+ conditional branches (`if (selections.includes('husky')) { ... } if (selections.includes('eslint')) { ... }`).

**Why it's wrong:** Adding module 11 means editing the monolith. Testing a single module requires running the whole function. The create-t3-app `buildPkgInstallerMap` pattern exists precisely to avoid this.

**Do this instead:** Each module's install logic lives in its `ModuleDefinition.install()` hook or in `installer/{moduleId}.ts`. The coordinator loops over selected modules and calls each installer — it never knows module-specific details.

---

## Integration Points

### External Services / Tools

| Service/Tool | Integration Pattern | Notes |
|--------------|---------------------|-------|
| npm registry | `child_process.execSync('npm install ...')` | Requires Node.js ≥ 20; no npm API client needed |
| GitHub (git init) | `child_process.execSync('git init && git add -A && git commit ...')` | Only if user opts in; graceful skip if git not found |
| BMAD npm package | `child_process.execSync('npx bmad-method install')` | Existing `setup.sh` already does this; wizard wraps it |
| AI tooling dirs | Direct `fs.cp` of `.claude/`, `.cursor/` template directories | No external API; pure file operation |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Wizard Orchestrator → Installer Coordinator | `UserSelections` object passed as function argument | Synchronous; no events needed |
| Installer Coordinator → Module Registry | Direct import; `registry[id]` lookup | Registry is read-only during installation |
| Installer Coordinator → File Merger | Function call with `(sourceDir, destDir, substitutions)` | File Merger is stateless |
| Installer Coordinator → Package Installer | Function call with `(deps[], devDeps[])` | Package Installer spawns npm subprocess |
| Post-Install Runner → disk | Direct `fs.writeFileSync` for `.template-config.json` | No abstraction needed |
| Wizard → existing `setup.sh` | Wizard either replaces `setup.sh` entirely, or calls `bash setup.sh` as a post-install step | Decision: wizard replaces `setup.sh` in v1; `setup.sh` becomes the bash shim that invokes the Node.js wizard |

---

## Build Order Implications

The component dependency graph dictates implementation order:

```
1. types.ts              (no deps — define UserSelections, ModuleDefinition first)
2. registry.ts           (depends on types.ts only)
3. utils/spawn.ts        (no deps — needed by npm installer and post-install)
4. utils/logger.ts       (no deps — needed by all)
5. installer/json-merge.ts  (no deps — pure function)
6. installer/files.ts    (depends on logger, json-merge)
7. installer/npm.ts      (depends on spawn, logger)
8. installer/index.ts    (coordinates files + npm; depends on registry, files, npm)
9. post-install.ts       (depends on spawn, logger)
10. wizard.ts            (depends on registry for prompt options, types for return type)
11. index.ts             (wires wizard → installer → post-install; the only stateful orchestrator)
```

Phase building implication: **build the data layer (types, registry, utils) before the UI layer (wizard prompts), and the UI layer before the integration layer (installer coordinator, post-install runner).** This order means each piece is testable before wiring up the next.

---

## Sources

- [create-t3-app GitHub — cli/src/](https://github.com/t3-oss/create-t3-app) — `buildPkgInstallerMap`, `dependencyVersionMap`, installer interface patterns (MEDIUM confidence — source inferred from DeepWiki analysis and WebSearch)
- [create-t3-app DeepWiki: CLI Usage and Options](https://deepwiki.com/t3-oss/create-t3-app/2.2-cli-usage-and-options) — Installer function shape, InstallerOptions type (MEDIUM)
- [@clack/prompts](https://www.clack.cc/) — `group()`, `multiselect()`, `spinner()`, `onCancel` pattern (HIGH — official site)
- [lirantal/nodejs-cli-apps-best-practices](https://github.com/lirantal/nodejs-cli-apps-best-practices) — General Node.js CLI patterns (MEDIUM)
- [copy-json-file-merged npm package](https://www.npmjs.com/package/copy-json-file-merged) — JSON merge strategy confirmation (MEDIUM)

---
*Architecture research for: Interactive CLI Project Setup Wizard*
*Researched: 2026-03-14*
