# Coding Conventions

**Analysis Date:** 2026-03-14

## Context

This is a pre-application SaaS template. No `src/` application code exists yet — only the GSD tooling
under `.claude/get-shit-done/bin/lib/*.cjs` and CI/workflow configuration files. Conventions below
reflect: (1) patterns observed in the existing CJS tooling source, and (2) the intended conventions
specified in `research/RESEARCH-template-technologies.md` for the application code to be added.

## Naming Patterns

**Files:**
- kebab-case for all utility/lib files: `core.cjs`, `frontmatter.cjs`, `phase.cjs`
- UPPER_CASE.md for planning/documentation: `ROADMAP.md`, `STATE.md`, `PLAN.md`, `SUMMARY.md`
- Workflow files: UPPER-KEBAB-CASE.md for agent workflows: `BUGFIX-CI-GITHUB-ISSUES.md`
- Future `src/` application files: kebab-case `.ts`/`.tsx` per research spec
- Future React components: PascalCase `.tsx`

**Functions:**
- camelCase for all functions: `loadConfig`, `safeReadFile`, `normalizePhaseName`, `extractFrontmatter`
- `cmd` prefix for top-level command handler functions: `cmdPhasesList`, `cmdFrontmatterGet`, `cmdStateLoad`
- `Internal` suffix for internal helpers not exported as commands: `findPhaseInternal`, `resolveModelInternal`
- Verbs in names: `searchPhaseInDir`, `getArchivedPhaseDirs`, `generateSlugInternal`

**Variables:**
- camelCase for variables: `phasesDir`, `roadmapPath`, `mergeData`
- UPPER_SNAKE_CASE for module-level constants: `MODEL_PROFILES`, `FRONTMATTER_SCHEMAS`
- Descriptive names over abbreviations: `milestoneEntries` not `mEntries`

**Types (future TypeScript application code per research spec):**
- PascalCase for interfaces and type aliases, no `I` prefix: `User`, `Config`, not `IUser`
- PascalCase for enum names, UPPER_CASE for values: `Status.PENDING`
- Strict TypeScript: `tsconfig.json` with `strict: true`, `noUncheckedIndexedAccess: true`
- Path alias `@/` maps to `src/`

## Code Style

**Language (tooling):**
- CommonJS modules (`require`/`module.exports`) for GSD tooling under `.claude/`, `.gemini/`, `.opencode/`
- All three tool directories contain identical `.cjs` binaries (multi-platform distribution)

**Formatting (intended for application src/, from research spec):**
- Tool: Prettier v3
- Config file: `.prettierrc` (to be added)
- Line length: 100 characters (`"printWidth": 100`)
- Quotes: single quotes (`"singleQuote": true`)
- Semicolons: required (`"semi": true`)
- Trailing commas: all (`"trailingComma": "all"`)
- Indentation: 2 spaces

**Linting (intended for application src/):**
- Tool: ESLint v9+ flat config (`eslint.config.mjs`)
- Config must use `defineConfig()` — flat config format (ESLint 9+, no `.eslintrc`)
- Plugins: `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-config-next`, `eslint-config-prettier`
- Run: `npm run lint`

**EditorConfig:**
- `.editorconfig` ships in template root for cross-editor consistency

## Import Organization

**Order (for future TypeScript application code):**
1. External packages (`react`, `next`, `stripe`, etc.)
2. Internal aliased modules (`@/lib`, `@/components`, `@/services`)
3. Relative imports (`./utils`, `../types`)
4. Type-only imports (`import type { User }`)

**Path Aliases:**
- `@/` maps to `src/` (configured in `tsconfig.json`)

**Tooling (CJS pattern observed):**
- `require()` calls at top of file before any logic
- Internal modules referenced by relative path: `require('./core.cjs')`
- Destructured at import: `const { escapeRegex, normalizePhaseName } = require('./core.cjs')`

## Error Handling

**Patterns (observed in CJS tooling):**
- Use explicit `error()` helper for fatal errors: `error('file path required')`
- Use `output({ error: 'message', path: filePath }, raw)` for recoverable errors returned as JSON
- Wrap filesystem/external operations in `try/catch`, return `null` or default on failure
- `safeReadFile()` pattern: returns `null` on any read error, no throw
- Empty `catch {}` blocks used deliberately for "best effort" operations (config migration writes)
- `process.exit(0)` via `output()` and `process.exit(1)` via `error()` for CLI termination

**Future application code (from research spec):**
- Throw errors, catch at boundaries (route handlers, server action wrappers)
- Use `try/catch` for async, no `.catch()` chains
- Input validation with Zod: `schema.parse(data)` throws on invalid input
- Type-safe env validation with `@t3-oss/env-nextjs` fails at build time for missing vars

## Logging

**Framework (tooling):**
- No structured logger — direct `process.stderr.write()` for errors, `process.stdout.write()` for output
- `error()` helper: writes to stderr and exits with code 1
- `output()` helper: writes JSON to stdout (or `@file:path` for large payloads > 50KB)

**Framework (intended application, from research spec):**
- Pino.js v9 for structured logging
- Logger instance exported from `src/lib/logger.ts`
- JSON output in production, `pino-pretty` for development
- No `console.log` in committed application code

## Comments

**When to Comment (observed in tooling):**
- Section dividers using `// ─── Section Name ───` banners for visual grouping
- Module-level JSDoc block: `/** Module name — description */` at top of each file
- Inline comments explain non-obvious behavior:
  - `// --no-index checks .gitignore rules regardless of whether the file is tracked.`
  - `// Large payloads exceed Claude Code's Bash tool buffer (~50KB).`
- No obvious/redundant comments

**Format:**
- Section banners: `// ─── Name ──────────────────────────────────────────────────────────────────`
- Inline explanations for tricky logic, environment constraints, or workarounds
- JSDoc `/** */` for exported functions in public modules

## Function Design

**Size (observed):**
- Functions kept focused on a single responsibility
- Large operations split into named helpers: `searchPhaseInDir`, `findPhaseInternal`, `getMilestonePhaseFilter`
- Long linear flows avoided by extracting helpers with clear names

**Parameters:**
- Options objects used when a function accepts 3+ related args: `cmdPhasesList(cwd, options, raw)`
- Destructure options in function body: `const { type, phase, includeArchived } = options`
- `cwd` (current working directory) as first parameter for all command functions
- `raw` boolean as last parameter for output format control

**Return Values:**
- CLI commands call `output()` or `error()` (side-effectful, no return value)
- Internal helpers return structured objects or `null` on failure
- Early returns used for guard clauses: `if (!phase) return null`

## Module Design

**Exports (CJS tooling):**
- Single `module.exports = { ... }` block at end of each file listing all public exports
- Private helpers not exported: functions used only within the file stay local
- Barrel pattern not used in tooling — direct requires from specific files

**File responsibilities:**
- `core.cjs`: Shared utilities, constants, git helpers, phase utilities, config loading
- `frontmatter.cjs`: YAML frontmatter parse/serialize/CRUD — no other concerns
- `phase.cjs`: Phase CRUD and lifecycle operations only
- `state.cjs`: STATE.md operations only
- `commands.cjs`: CLI command routing/dispatch

**Git hooks (intended, from research spec):**
- Husky v9 manages pre-commit and commit-msg hooks
- lint-staged v15 runs ESLint + Prettier only on staged files
- commitlint v19 enforces Conventional Commits: `feat:`, `fix:`, `chore:`, `test:`, `refactor:`

## Commit Message Format

Commit messages follow Conventional Commits with phase/plan scope when applicable:

```
feat(08-02): implement email validation
fix(ci): resolve automated CI failure from issue #42
test(08-02): add failing test for email validation
refactor(08-02): extract regex to constant
chore: update dependencies
```

---

*Convention analysis: 2026-03-14*
*Update when application src/ is added or formatting config files are committed*
