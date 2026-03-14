# Stack Research

**Domain:** Interactive CLI setup wizard — Node.js npx package
**Researched:** 2026-03-14
**Confidence:** HIGH (core wizard stack), MEDIUM (AI tool detection patterns)

---

## The Build Decision: npx TypeScript Package vs Shell Script

The wizard MUST be a Node.js TypeScript package distributed via `npx`, NOT a bash script.

**Why not bash:**
- No interactive multi-select UI in bash without ncurses (which is painful to ship)
- Windows support requires WSL or Git Bash — adds friction before the wizard even runs
- No type safety, no testing, no error handling primitives

**Why npx TypeScript package:**
- `npx create-wizard` works identically on macOS, Linux, Windows CMD, and WSL
- TypeScript gives type-safe config file writes, IDE support, testability
- Same pattern as `create-t3-app`, `create-next-app`, `create-remix` — proven at scale
- No install step for the user: `npx` downloads and runs transiently

**Build target:** CommonJS output via `tsup` (not pure ESM). Reason: chalk v5+ and ora v8+ are pure ESM which creates friction; chalk v4 + ora v6 are CJS-compatible and widely used. The wizard itself is short-lived (one-shot execution), so the ESM/CJS distinction doesn't matter architecturally — pick CJS for maximum compatibility with Node.js ≥ 20.

---

## Recommended Stack

### Core Framework (the wizard itself)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Node.js | ≥ 20.x LTS | Runtime | Project constraint. Node 20 ships with `node:fs/promises`, `node:path` built-ins. LTS until April 2026. |
| TypeScript | 5.x | Language | Type safety for config generation. tsup compiles to CJS in one command. No runtime overhead. |
| tsup | ^8.x | Bundler/compiler | Zero-config TypeScript → CJS bundler. Ships `bin` field entries correctly. Used by create-t3-app, Turborepo, and hundreds of CLI tools. |
| @clack/prompts | ^1.1.0 | Interactive prompts | Best-in-class UX for 2025-2026 CLI wizards. 2.5M weekly downloads, actively maintained (last release March 2026). Provides `select`, `multiselect`, `text`, `confirm`, `spinner`, `group` — everything this wizard needs. 80% smaller than inquirer. Used by Astro CLI, Waku, Analog. |
| picocolors | ^1.1.x | Terminal colors | 14x smaller than chalk, CJS+ESM dual, no dependencies. Used by PostCSS, Stylelint, Vite internals. Sufficient for the wizard's color needs (info, warning, error, success messages). Choose over chalk to avoid the ESM-only chalk v5 complication. |
| execa | ^9.x | Shell command execution | The standard for spawning child processes in Node.js CLIs. v9 added template string syntax, streaming, and full TypeScript support. Used to run `npm install`, `npx husky init`, `git init`, etc. Handles cross-platform differences (Windows path separators, shell quoting). |
| fs-extra | ^11.x | File system operations | Extends `node:fs` with `copy()`, `move()`, `ensureDir()`, `outputFile()`, `readJson()`, `writeJson()`. Prevents EMFILE errors via graceful-fs. Critical for writing config files atomically. Built-in `node:fs/promises` lacks recursive copy — fs-extra fills the gap. |
| commander | ^12.x | CLI argument parsing | Parses `--yes`, `--skip-install`, `--name=myapp` flags for non-interactive/CI mode. Lightweight. Same package used by create-t3-app. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| ora | ^6.3.x | Spinner / progress | Use for long-running operations: `npm install`, `git init`, cloning. v6 is the last CJS-compatible version — v8 is ESM-only. Stick with v6 until wizard migrates to ESM. |
| gradient-string | ^2.0.x | ASCII art banner colors | Renders the wizard's welcome banner with gradient. Optional but matches create-t3-app's aesthetic. Zero-dependency. |
| which | ^4.x | Binary detection in PATH | Used to detect if `git`, `npm`, `node`, `code`, `cursor` are installed and in PATH. More reliable than `execa('which git')` cross-platform. |
| semver | ^7.x | Version comparison | Compare detected Node.js version against minimum required. Fail early with a clear error if Node < 20. |

### Development Tools (for the wizard package itself)

| Tool | Purpose | Notes |
|------|---------|-------|
| tsup | Compile TypeScript → CJS with `bin` entry | Config: `{ entry: ['src/index.ts'], format: ['cjs'], dts: false, clean: true }` |
| tsx | Run TypeScript during development | `tsx src/index.ts` for fast iteration without compile step |
| vitest | Unit tests for wizard logic | Test config generation, file writing, detection logic in isolation |
| @types/node | Node.js type definitions | Required for `fs`, `path`, `process` types with TypeScript |
| @types/fs-extra | fs-extra type definitions | — |

---

## Installation

```bash
# Wizard runtime dependencies
npm install @clack/prompts picocolors execa fs-extra commander which semver

# Optional UX enhancement
npm install ora gradient-string

# Dev dependencies
npm install -D typescript tsup tsx vitest @types/node @types/fs-extra
```

---

## AI Tool Detection Patterns

This is the novel part of the wizard. Detection happens by checking the filesystem for known configuration artifacts.

### Claude Code Detection

```typescript
import { existsSync } from 'fs-extra';
import path from 'node:path';

// Claude Code is "installed" if CLAUDE.md or .claude/ directory exists
const hasClaudeCode = (projectRoot: string): boolean => {
  return (
    existsSync(path.join(projectRoot, 'CLAUDE.md')) ||
    existsSync(path.join(projectRoot, '.claude'))
  );
};
```

The `.claude/` directory contains: `settings.json`, `commands/`, `agents/`, `rules/`. The wizard creates this structure when the user selects Claude Code.

### Cursor Detection

```typescript
// Cursor is configured if .cursor/ dir or legacy .cursorrules exists
const hasCursorConfig = (projectRoot: string): boolean => {
  return (
    existsSync(path.join(projectRoot, '.cursor')) ||
    existsSync(path.join(projectRoot, '.cursorrules'))
  );
};
```

The modern Cursor config location (2025+) is `.cursor/rules/*.mdc`. The legacy `.cursorrules` flat file is still supported but deprecated by Cursor team. The wizard should create `.cursor/rules/` and write `.mdc` files — NOT `.cursorrules`.

### VS Code Detection

```typescript
// VS Code is in use if .vscode/ directory exists
const hasVSCode = (projectRoot: string): boolean => {
  return existsSync(path.join(projectRoot, '.vscode'));
};
```

The wizard can detect if `code` binary is in PATH via `which('code')` for stronger signal.

### BMAD Detection

```typescript
// BMAD is installed if .bmad-core/ or bmad-agent/ directories exist
const hasBMAD = (projectRoot: string): boolean => {
  return (
    existsSync(path.join(projectRoot, '.bmad-core')) ||
    existsSync(path.join(projectRoot, 'bmad-agent'))
  );
};
```

### GSD Detection

```typescript
// GSD is installed if .claude/get-shit-done/ directory exists
const hasGSD = (projectRoot: string): boolean => {
  return existsSync(path.join(projectRoot, '.claude', 'get-shit-done'));
};
```

---

## Package Structure (the wizard npm package)

```
create-ai-template/          ← package name (publishable to npm)
├── package.json             ← bin: { "create-ai-template": "./dist/index.cjs" }
├── tsup.config.ts
├── src/
│   ├── index.ts             ← entry point, runs the wizard
│   ├── prompts/
│   │   ├── welcome.ts       ← banner + intro
│   │   ├── ai-tools.ts      ← Claude Code / Cursor / VS Code selection
│   │   ├── code-quality.ts  ← Husky / ESLint / Prettier / Vitest selection
│   │   └── saas-modules.ts  ← Auth / DB / Payments optional modules
│   ├── installers/
│   │   ├── bmad.ts          ← npm install @bmad-method/bmad-agent
│   │   ├── gsd.ts           ← npm install or git clone gsd
│   │   ├── husky.ts         ← npx husky init + write hooks
│   │   ├── eslint.ts        ← write eslint.config.mjs
│   │   ├── vitest.ts        ← write vitest.config.ts + example test
│   │   └── claude-code.ts   ← create .claude/ dir + CLAUDE.md
│   ├── helpers/
│   │   ├── detect-tools.ts  ← filesystem + PATH detection functions
│   │   ├── get-pkg-manager.ts ← detect npm/yarn/pnpm/bun
│   │   └── write-config.ts  ← atomic JSON/YAML/TS config file writer
│   └── types.ts             ← WizardConfig interface
├── dist/                    ← tsup output (gitignored)
└── tests/
    ├── detect-tools.test.ts
    └── installers.test.ts
```

**package.json bin field:**
```json
{
  "name": "create-ai-template",
  "bin": {
    "create-ai-template": "./dist/index.cjs"
  },
  "engines": { "node": ">=20.0.0" }
}
```

Users run: `npx create-ai-template` or `npm create ai-template`.

---

## Package Manager Detection

The wizard must detect which package manager is in use and use it consistently:

```typescript
import { existsSync } from 'fs-extra';
import { which } from 'which';

type PackageManager = 'npm' | 'pnpm' | 'yarn' | 'bun';

const detectPackageManager = async (projectRoot: string): Promise<PackageManager> => {
  if (existsSync(path.join(projectRoot, 'bun.lockb'))) return 'bun';
  if (existsSync(path.join(projectRoot, 'pnpm-lock.yaml'))) return 'pnpm';
  if (existsSync(path.join(projectRoot, 'yarn.lock'))) return 'yarn';
  // Fallback: check npm_config_user_agent set by npx
  const agent = process.env.npm_config_user_agent ?? '';
  if (agent.startsWith('pnpm')) return 'pnpm';
  if (agent.startsWith('yarn')) return 'yarn';
  if (agent.startsWith('bun')) return 'bun';
  return 'npm';
};
```

This is the same pattern used by create-t3-app and Astro CLI. The `npm_config_user_agent` env var is set by npm/yarn/pnpm/bun when they invoke `npx`.

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| @clack/prompts | @inquirer/prompts | If you need plugin ecosystem (custom prompt types), or are extending an existing inquirer-based CLI |
| @clack/prompts | inquirer v9 (legacy) | Never for new projects — not actively developed |
| picocolors | chalk v4 | If you need true-color (16M colors) or chained API like `chalk.bold.red()`. Chalk v4 is CJS-compatible. |
| picocolors | chalk v5 | Avoid: ESM-only, causes `ERR_REQUIRE_ESM` in CJS wizards |
| execa v9 | child_process | Only if you need to avoid any dependencies. execa handles Windows cross-platform, shell quoting, and streaming far better. |
| execa v9 | shelljs | Avoid: shelljs is unmaintained and uses synchronous blocking APIs |
| tsup | tsc directly | tsc works but doesn't produce a single-file CJS bundle with shebang. tsup handles this in one command. |
| tsup | esbuild directly | tsup is a wrapper around esbuild — use tsup unless you need fine-grained esbuild config |
| Node.js script | Python script | Violates project constraint: "no additional runtime." Python is not guaranteed on Windows. |
| Node.js script | Go binary (compiled) | Overkill. Go binaries need per-platform builds/releases. Node.js via npx is simpler to distribute. |
| Node.js script | Rust/clap binary | Same issue as Go. Binary distribution requires GitHub Releases + per-platform matrix. Unnecessary complexity for v1. |
| fs-extra | node:fs/promises | node:fs/promises lacks recursive copy, mkdirp, and atomic JSON write. fs-extra fills these gaps. |
| ora v6 | ora v8 | ora v8 is ESM-only — avoid in CJS wizard. v6 is the last CJS-compatible major version. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| chalk v5+ | Pure ESM — breaks CJS wizard with `ERR_REQUIRE_ESM`. Even with tsup's bundling, chalk v5 imports cause issues at runtime. | picocolors (CJS+ESM dual, 14x smaller) or chalk v4 (pinned) |
| ora v7+ | ESM-only since v7. Same ERR_REQUIRE_ESM problem as chalk v5. | ora v6.3.x (CJS-compatible) |
| inquirer (legacy) | Not actively developed. Replaced by @inquirer/prompts (same author, rewritten). Poor TypeScript support in legacy version. | @clack/prompts or @inquirer/prompts |
| shelljs | Unmaintained (last release 2022). Synchronous blocking. Known issues with Windows paths. | execa v9 |
| Python / bash as primary wizard | Breaks project constraint: "no additional runtime." Python absent on fresh Windows. Bash has no native multi-select prompts. | Node.js + @clack/prompts |
| Compiled binary (Go/Rust) | Per-platform build matrix for distribution. No benefit over npx for a one-shot wizard. | npx TypeScript package |
| .cursorrules (flat file) | Deprecated by Cursor team in 2025. Still works but will be removed. | .cursor/rules/*.mdc (MDC format) |
| Hardcoded `npm` calls | Breaks for pnpm/yarn/bun users. | Detect package manager via lockfile + npm_config_user_agent |

---

## Stack Patterns by Variant

**If wizard runs inside an existing Next.js project (post-clone):**
- Run from `package.json` scripts: `"setup": "npx create-ai-template --existing"`
- Use `--existing` flag to skip project scaffolding, only activate modules
- Read existing `package.json` to detect current deps before installing

**If wizard runs to create a new project from scratch:**
- Default mode: `npx create-ai-template my-app`
- Creates directory, copies template files, then runs installation steps

**If running in CI/non-interactive mode:**
- `npx create-ai-template --yes` skips all prompts, uses all defaults
- Detect `CI=true` env var (set by GitHub Actions, Vercel, etc.) and auto-apply defaults
- @clack/prompts supports non-interactive mode via programmatic API

---

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| @clack/prompts@1.x | Node.js ≥ 16 | Works fine on Node 20+ |
| execa@9.x | Node.js ≥ 18.19 | Requires Node 18.19+ for native fetch. Use execa@8 if supporting Node 16. |
| tsup@8.x | TypeScript 5.x | Full TS 5 decorators support. Requires tsup ≥ 8.0 for correct `verbatimModuleSyntax`. |
| ora@6.x | Node.js ≥ 12 | Last CJS version. Do not upgrade to ora@7+ without migrating wizard to ESM. |
| chalk@4.x | Node.js ≥ 12 | Last CJS version. If pinning chalk, pin to `"chalk": "^4.1.2"`. |
| fs-extra@11.x | Node.js ≥ 14.14 | Safe on Node 20. v11 uses `fs.cpSync` internally where available. |

---

## Sources

- [@clack/prompts npm](https://www.npmjs.com/package/@clack/prompts) — v1.1.0, 2.5M weekly downloads, last published March 2026 (HIGH confidence)
- [bombshell-dev/clack GitHub](https://github.com/bombshell-dev/clack) — Active maintenance confirmed (HIGH confidence)
- [create-t3-app package.json](https://github.com/t3-oss/create-t3-app/blob/main/cli/package.json) — Reference architecture: chalk, commander, execa, ora, fs-extra, gradient-string (HIGH confidence)
- [Cursor Rules docs](https://docs.cursor.com/context/rules) — .cursor/rules/*.mdc is current standard; .cursorrules deprecated (HIGH confidence)
- [Claude Code memory docs](https://code.claude.com/docs/en/memory) — .claude/ directory structure, CLAUDE.md detection (HIGH confidence)
- [picocolors vs chalk comparison](https://dev.to/webdiscus/comparison-of-nodejs-libraries-to-colorize-text-in-terminal-4j3a) — Size/performance benchmarks (MEDIUM confidence)
- [Execa v9 release](https://medium.com/@ehmicky/execa-9-release-d0d5daaa097f) — Template strings, streaming, TypeScript improvements (HIGH confidence)
- [tsup npm](https://www.npmjs.com/package/tsup) — Zero-config TypeScript bundler for CLI packages (HIGH confidence)
- TypeScript in 2025 ESM/CJS publishing — chalk v5 ESM-only issue documented in [nodejs/node issue #60204](https://github.com/nodejs/node/issues/60204) (HIGH confidence)

---

*Stack research for: Interactive CLI setup wizard (npx package)*
*Researched: 2026-03-14*
