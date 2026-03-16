# Phase 5: Packaging and Maintenance - Research

**Researched:** 2026-03-17
**Domain:** npm publish workflow, GitHub Actions cross-platform matrix, Dependabot configuration, Node.js version guard
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **npm publish workflow:** Triggered by pushing a version tag (e.g., `v1.0.0`) — GitHub Actions workflow runs on `push: tags: ['v*']`
- **Package name:** Unscoped `create-ai-template` — matches `create-*` npm convention; users run `npx create-ai-template`
- **Publish workflow steps:** `npm ci` → `npm test` → `npm run build` → `npm publish`
- **Gate:** Publish only proceeds if tests pass — no publishing from a broken build
- **Requires `NPM_TOKEN` secret** in repo settings (document this in CONTRIBUTING.md)
- **Node version guard:** Check `process.versions.node` at the top of `index.ts`, before any imports run — fastest bail-out
- **Node guard condition:** If Node < 20: print a plain-text error message and `process.exit(1)`
- **Error message format:** `Error: create-ai-template requires Node.js 20 or higher. You are running vX.Y.Z. Please upgrade: https://nodejs.org`
- **`engines` field:** `{ "node": ">=20" }` remains in `package.json` as a secondary signal
- **Existing `tsup.config.ts`:** Already configured — CJS output, entry `src/index.ts`, output `dist/index.cjs`. No changes needed.
- **Existing `wizard/package.json`:** Already has correct `bin` field and `"type": "commonjs"`.
- **Publish workflow file:** Separate `publish.yml` (same separation pattern as `ci.yml` and `version-check.yml`)

### Claude's Discretion
- Dependabot config specifics (scope: npm + GitHub Actions; automerge mechanism for patch bumps)
- Cross-platform CI matrix configuration (ubuntu/macos/windows runners, WSL2 setup if applicable)
- Whether to add a `prepublishOnly` script in `package.json` as an additional safety net
- Exact workflow file name and job structure for the publish workflow

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SEC-01 | Template ships `.github/dependabot.yml` — weekly dependency update PRs grouped by minor+patch, automerge patch bumps | Dependabot `groups` config + separate automerge workflow using `dependabot/fetch-metadata@v2`; both documented in GitHub official docs |
</phase_requirements>

---

## Summary

Phase 5 has three distinct delivery areas: (1) a tag-triggered `publish.yml` workflow to push the wizard to npm, (2) a `dependabot.yml` file plus a companion automerge workflow to satisfy SEC-01, and (3) a cross-platform CI matrix that smoke-tests `npx create-ai-template --yes` on ubuntu, macos, and windows runners. A fourth smaller item is the Node version guard at the top of `src/index.ts`.

The existing `wizard/` directory is already correctly wired for CJS publishing — `tsup.config.ts` emits `dist/index.cjs`, `package.json` has `"type": "commonjs"` and a correct `bin` field, and `engines.node` is already `>=20`. The Node version guard and `prepublishOnly` script are pure additions to existing files. The three new files are: `.github/workflows/publish.yml`, `.github/workflows/dependabot-automerge.yml`, and `.github/dependabot.yml`.

The critical cross-platform pitfall is that `windows-latest` GitHub Actions runners run in a non-TTY environment where `process.stdin.isTTY` is false (or undefined). The wizard must run with `--yes` in CI to bypass interactive prompts. The smoke test should verify `npx create-ai-template --yes` exits 0 and writes `.template-config.json`, not that it can render interactive prompts.

**Primary recommendation:** Use NPM_TOKEN (granular automation token) for publish auth — npm trusted publishing (OIDC) is generally available as of July 2025 and is strictly better, but the user has locked `NPM_TOKEN` as the auth mechanism. Use `dependabot/fetch-metadata@v2` + `gh pr merge --auto` for the automerge workflow. Use `strategy.matrix.os` for the cross-platform CI job.

---

## Standard Stack

### Core
| Library / Feature | Version | Purpose | Why Standard |
|-------------------|---------|---------|--------------|
| `actions/setup-node` | v4 | Set up Node.js in GitHub Actions | Official GitHub action; supports `cache: 'npm'` and `registry-url` for auth |
| `dependabot/fetch-metadata` | v2 | Extract Dependabot PR metadata (update type, semver level) | Official Dependabot action; enables conditional merge logic |
| `gh` CLI (built-in) | — | `gh pr merge --auto` for automerge | Available on all GitHub-hosted runners; no extra action needed |
| `npm publish` | — | Publish to npm registry | Built-in; use `NODE_AUTH_TOKEN` env var for auth |
| `tsup` | ^8.0.0 | Bundle TypeScript to CJS | Already in project; no changes needed |

### Supporting
| Library / Feature | Version | Purpose | When to Use |
|-------------------|---------|---------|-------------|
| `prepublishOnly` script | — | Safety net: runs `npm test && npm run build` before `npm publish` | Add to `wizard/package.json`; catches accidental local publishes without CI |
| `strategy.matrix.os` | — | Run same job on ubuntu/macos/windows | Cross-platform smoke test job |
| `strategy.fail-fast: false` | — | All platform jobs run even if one fails | Shows which platform breaks rather than aborting the matrix |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `NPM_TOKEN` secret (locked) | npm trusted publishing (OIDC) | OIDC is more secure (no long-lived token), GA as of July 2025, requires `id-token: write` permission + npm package configured as trusted publisher; user locked NPM_TOKEN, so document OIDC as upgrade path |
| `gh pr merge --auto` for automerge | third-party automerge action | `gh` is built-in, no external action dependency |

**Installation:**
No new npm packages required. Only new GitHub Actions workflow files and one config file.

---

## Architecture Patterns

### New Files Required
```
.github/
├── dependabot.yml                    # SEC-01: dependency update config
└── workflows/
    ├── ci.yml                        # EXISTING — no changes
    ├── version-check.yml             # EXISTING — no changes
    ├── publish.yml                   # NEW: tag-triggered npm publish
    └── dependabot-automerge.yml      # NEW: auto-merge patch-only PRs

wizard/
└── src/
    └── index.ts                      # MODIFY: add Node version guard at top
```

Also modify: `wizard/package.json` — add `prepublishOnly` script (Claude's discretion item).

### Pattern 1: Tag-Triggered npm Publish Workflow

**What:** A GitHub Actions workflow that fires on `push: tags: v*`, runs in the `wizard/` subdirectory, and publishes to npm using `NODE_AUTH_TOKEN`.

**When to use:** Every versioned release — developer pushes `git tag v1.0.0 && git push --tags`.

```yaml
# Source: https://docs.github.com/en/actions/automating-builds-and-tests/building-and-testing-nodejs
# and https://httptoolkit.com/blog/automatic-npm-publish-gha/
name: Publish to npm

on:
  push:
    tags:
      - 'v*'

jobs:
  publish:
    name: Build · Test · Publish
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: wizard
    permissions:
      contents: read

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'
          cache: 'npm'
          cache-dependency-path: wizard/package-lock.json

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build
        run: npm run build

      - name: Publish
        run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

**Key notes:**
- `working-directory: wizard` set at `defaults.run` level — applies to all `run:` steps; does NOT apply to `uses:` steps (actions must be configured separately via `cache-dependency-path`).
- `registry-url` on `setup-node` is required — it writes the `.npmrc` auth config that `NODE_AUTH_TOKEN` populates.
- No `--access public` flag needed for unscoped packages (public by default). Document it for future scoped migration.
- No `github.actor` guard needed — tag push, not branch push, so bots cannot accidentally trigger it.

### Pattern 2: Dependabot Configuration (SEC-01)

**What:** `dependabot.yml` that configures weekly update PRs for npm and GitHub Actions ecosystems, grouped by minor+patch, with major updates as individual PRs.

```yaml
# Source: https://docs.github.com/en/code-security/dependabot/dependabot-version-updates/configuration-options-for-the-dependabot.yml-file
version: 2
updates:
  - package-ecosystem: 'npm'
    directory: '/wizard'
    schedule:
      interval: 'weekly'
      day: 'monday'
    groups:
      npm-minor-patch:
        applies-to: version-updates
        update-types:
          - 'minor'
          - 'patch'
    labels:
      - 'dependencies'

  - package-ecosystem: 'github-actions'
    directory: '/'
    schedule:
      interval: 'weekly'
      day: 'monday'
    groups:
      actions-minor-patch:
        applies-to: version-updates
        update-types:
          - 'minor'
          - 'patch'
    labels:
      - 'dependencies'
```

**Key notes:**
- `directory: '/wizard'` — Dependabot scans `wizard/package.json`. The root repo has no `package.json` so npm ecosystem lives at `/wizard`.
- `groups` consolidates all minor+patch bumps into one PR per ecosystem per week. Major updates come as individual PRs (default behavior when not grouped).
- `labels` are informational only — the automerge workflow uses `update-type` metadata, not labels, as the trigger condition.

### Pattern 3: Dependabot Automerge Workflow

**What:** A separate `dependabot-automerge.yml` workflow that fires on Dependabot PRs and auto-merges patch-only updates.

```yaml
# Source: https://docs.github.com/en/code-security/dependabot/working-with-dependabot/automating-dependabot-with-github-actions
name: Dependabot auto-merge

on:
  pull_request:
    types: [opened, synchronize, reopened, ready_for_review]

permissions:
  contents: write
  pull-requests: write

jobs:
  automerge:
    runs-on: ubuntu-latest
    if: github.event.pull_request.user.login == 'dependabot[bot]'
    steps:
      - name: Fetch Dependabot metadata
        id: metadata
        uses: dependabot/fetch-metadata@v2
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}

      - name: Auto-merge patch updates
        if: steps.metadata.outputs.update-type == 'version-update:semver-patch'
        run: gh pr merge --merge --auto "$PR_URL"
        env:
          PR_URL: ${{ github.event.pull_request.html_url }}
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

**Key notes:**
- Uses `pull_request` (not `pull_request_target`) — Dependabot PRs run in a privileged context where `GITHUB_TOKEN` has write permissions even on `pull_request`.
- Condition `github.event.pull_request.user.login == 'dependabot[bot]'` prevents this workflow from being triggered by human-authored PRs.
- `--auto` flag tells GitHub to merge as soon as all branch protection requirements pass (i.e., CI must be green).
- `--merge` specifies merge commit strategy (not squash or rebase). All three are valid; `--merge` preserves Dependabot commit messages.
- Minor updates are NOT auto-merged — they land as grouped PRs that require a human review.

### Pattern 4: Cross-Platform Smoke Test Matrix

**What:** A CI job that installs Node 20, then runs `npx create-ai-template --yes` in a temp directory on three OS runners to verify the binary resolves and exits cleanly.

```yaml
# Source: https://docs.github.com/en/actions/automating-builds-and-tests/building-and-testing-nodejs
# and community matrix build patterns
name: Cross-platform install smoke test

on:
  push:
    tags:
      - 'v*'
  workflow_dispatch:

jobs:
  smoke-test:
    name: Smoke test on ${{ matrix.os }}
    runs-on: ${{ matrix.os }}
    strategy:
      fail-fast: false
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Pack wizard package
        working-directory: wizard
        run: |
          npm ci
          npm run build
          npm pack

      - name: Install from local tarball (unix)
        if: runner.os != 'Windows'
        run: |
          TARBALL=$(ls wizard/create-ai-template-*.tgz)
          mkdir -p /tmp/smoke-test && cd /tmp/smoke-test
          npx --yes "$OLDPWD/$TARBALL" --yes

      - name: Install from local tarball (windows)
        if: runner.os == 'Windows'
        shell: bash
        run: |
          TARBALL=$(ls wizard/create-ai-template-*.tgz)
          mkdir -p "$RUNNER_TEMP/smoke-test"
          cd "$RUNNER_TEMP/smoke-test"
          npx --yes "$GITHUB_WORKSPACE/$TARBALL" --yes

      - name: Verify output (unix)
        if: runner.os != 'Windows'
        run: test -f /tmp/smoke-test/.template-config.json

      - name: Verify output (windows)
        if: runner.os == 'Windows'
        shell: bash
        run: test -f "$RUNNER_TEMP/smoke-test/.template-config.json"
```

**Key notes:**
- Use `npm pack` to create a local `.tgz` tarball and run `npx` against it — this tests the actual published artifact without requiring a live npm publish.
- `--yes` flag passed to the wizard disables interactive prompts (WIZ-06). This is required because GitHub Actions runners have no TTY (`process.stdin.isTTY` is `false` or `undefined`).
- `fail-fast: false` ensures all three platforms report results even if one fails.
- Windows runner uses `bash` shell explicitly (`shell: bash`) — avoids PowerShell path escaping issues with forward slashes.
- `$RUNNER_TEMP` is a cross-platform writable temp directory guaranteed on all GitHub-hosted runners.
- This job can live in the `publish.yml` as a second job (runs before publish) or as a separate file. Recommendation: add as a `smoke-test` job in `publish.yml` with `needs: smoke-test` before the publish job.

### Pattern 5: Node Version Guard

**What:** Runtime check at the very top of `wizard/src/index.ts`, before any `import` statements.

```typescript
// Source: https://nodejs.org/api/process.html#processversion
// Must be at top of file, before imports — CJS compilation by tsup ensures
// this executes before any module initialization code
const _nodeVersion = process.versions.node;
const _nodeMajor = parseInt(_nodeVersion.split('.')[0], 10);
if (_nodeMajor < 20) {
  process.stderr.write(
    `Error: create-ai-template requires Node.js 20 or higher. You are running v${_nodeVersion}. Please upgrade: https://nodejs.org\n`
  );
  process.exit(1);
}
```

**Key notes:**
- Use `process.stderr.write` not `console.error` to avoid importing the `console` module before the check (though in CJS this is negligible — either works). `console.error` is fine per the locked decision.
- In CJS compiled by tsup, TypeScript `import` statements at the top of the file are hoisted as `require()` calls before user code. The guard must be inserted as a code block before any `import` lines in the TypeScript source, so tsup emits it before the `require()` calls in the bundle.
- **Critical:** TypeScript will not run ES `import` statements before the version check if the check is placed above all imports, because tsup transforms them to CJS `require()` which are synchronous and appear in source order.

### Anti-Patterns to Avoid
- **Placing version guard after imports:** Any `import` at the top of `index.ts` becomes a `require()` in the CJS bundle. If a dependency requires Node 20 and is `require()`-d before the guard runs, Node throws a cryptic error before the user-friendly message appears. The guard must be the very first executable code.
- **Using `--access public` for an unscoped package:** Unscoped packages are public by default. Adding `--access public` is harmless but creates confusion. Only needed if the package ever becomes scoped (e.g., `@org/create-ai-template`).
- **Testing interactive TTY flow in CI matrix:** The cross-platform matrix should only test that `--yes` mode completes without errors and produces output files. Do not test interactive prompt rendering in CI — it will fail on all platforms because there is no TTY.
- **Running `npm publish` from root:** The `wizard/` subdirectory is a separate npm package. All npm commands in the publish workflow must run inside `wizard/`. Use `defaults.run.working-directory: wizard` at the job level.
- **Triggering automerge for minor updates:** Minor bumps can include behavioral changes. Only patch updates (bug fixes, security patches) are safe for automatic merge. Keep minor Dependabot PRs as human-review required.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Dependabot PR update type detection | Custom script parsing PR title/branch | `dependabot/fetch-metadata@v2` | Official action — handles all Dependabot PR naming conventions; exposes `update-type`, `dependency-names`, `package-ecosystem` |
| npm auth in CI | Custom `.npmrc` manipulation | `setup-node` with `registry-url` | `actions/setup-node` writes the correct `.npmrc` format; manual `.npmrc` is fragile across environments |
| Cross-platform path handling in shell steps | Shell-specific path syntax | `$RUNNER_TEMP`, `$GITHUB_WORKSPACE`, `bash` shell on Windows | These built-in variables work on all GitHub-hosted runners with `shell: bash` |
| Automerge approval | Custom GitHub API calls to approve + merge | `gh pr merge --auto` | `gh` CLI handles branch protection wait, approval, and merge atomically |

---

## Common Pitfalls

### Pitfall 1: `working-directory` Does Not Apply to `uses:` Steps

**What goes wrong:** Setting `defaults.run.working-directory: wizard` makes all `run:` steps run in `wizard/`, but `uses: actions/setup-node` still runs from the repo root. When `cache: 'npm'` is specified without `cache-dependency-path`, setup-node looks for `package-lock.json` in the repo root (which doesn't exist — only `wizard/package-lock.json` exists), so caching silently fails or throws.

**Why it happens:** The `defaults.run.working-directory` key only applies to `run:` steps, not `uses:` action steps. This is by design in GitHub Actions.

**How to avoid:** Always specify `cache-dependency-path: wizard/package-lock.json` on `setup-node` when the lock file is in a subdirectory.

**Warning signs:** Cache miss every run, or `setup-node` warning about missing lock file.

### Pitfall 2: TTY Detection Failure on Windows Runner

**What goes wrong:** `process.stdin.isTTY` returns `false` or `undefined` on GitHub Actions runners (all platforms, but Windows is most problematic). If the wizard's `@clack/prompts` attempts to render interactive UI without a TTY, it may throw or hang.

**Why it happens:** GitHub Actions runners are not terminal emulators. There is no TTY attached to the process.

**How to avoid:** The `--yes` flag (WIZ-06) bypasses all interactive prompts. The smoke test MUST always invoke `npx create-ai-template --yes`. Never run the wizard without `--yes` in CI.

**Warning signs:** Smoke test hangs indefinitely on windows-latest runner (stdin read block with no input source).

### Pitfall 3: `npm pack` Tarball Name Pattern

**What goes wrong:** `npm pack` generates a tarball named `create-ai-template-{version}.tgz`. If the shell glob `create-ai-template-*.tgz` is evaluated before `npm pack` completes (race condition in multi-step shell), the variable is empty and `npx` fails with a path error.

**Why it happens:** Shell variable assignment and globbing in multi-line run steps can be order-dependent.

**How to avoid:** Assign `TARBALL=$(ls wizard/create-ai-template-*.tgz)` as a separate step after the `npm pack` step, or use `$(ls ...)` in the same step where the tarball is consumed. Ensure the pack step uses `working-directory: wizard` so the tarball lands in `wizard/`.

**Warning signs:** `npx: path not found` or `ENOENT` error for the tarball.

### Pitfall 4: NPM Token Permissions

**What goes wrong:** Using a Classic npm token (type: Publish) will work but is discouraged. The token has no expiry and grants publish access to all packages owned by the account.

**Why it happens:** Classic tokens are the legacy default.

**How to avoid:** Create a Granular Access Token on npmjs.com scoped to `create-ai-template` package only, with `Read and write` permission. Store as `NPM_TOKEN` secret. Document token creation steps in CONTRIBUTING.md.

**Warning signs:** Publish succeeds but any token leak grants attacker publish access to all your npm packages.

### Pitfall 5: Node Version Guard Position in TypeScript Source

**What goes wrong:** If the version guard code is placed after any `import` statement in `index.ts`, tsup compiles it after the corresponding `require()` call in the bundle. If that `require()`-d module crashes on Node 18 (e.g., uses syntax only available in Node 20), the error message comes from the module, not the user-friendly guard.

**Why it happens:** tsup preserves source order for CJS `require()` calls.

**How to avoid:** The guard MUST be the first executable statement in `index.ts`. The existing `const { version } = require('../package.json')` at line 7 is a CJS `require()` — it is safe to have the version guard before this line. Add the guard at line 1, before even this `require()`.

**Warning signs:** Cryptic `SyntaxError` or `TypeError` from a dependency when running on Node 18, instead of the friendly version error.

### Pitfall 6: Dependabot `directory` for npm Ecosystem

**What goes wrong:** Setting `directory: '/'` for the npm ecosystem makes Dependabot scan `./package.json` (repo root). This repo has no root `package.json` — the npm package lives in `wizard/`. Dependabot would report no npm dependencies to update.

**Why it happens:** Dependabot uses `directory` relative to the repo root to find the package manifest.

**How to avoid:** Set `directory: '/wizard'` for the npm ecosystem entry.

**Warning signs:** Dependabot opens no npm PRs after the first week.

---

## Code Examples

Verified patterns from official sources:

### Node Version Guard (CJS-safe, top of file)
```typescript
// Place before ALL import/require statements in wizard/src/index.ts
const _nodeVer = process.versions.node;
const _nodeMajor = parseInt(_nodeVer.split('.')[0], 10);
if (_nodeMajor < 20) {
  // Use process.stderr.write — no module imports required
  process.stderr.write(
    `Error: create-ai-template requires Node.js 20 or higher. You are running v${_nodeVer}. Please upgrade: https://nodejs.org\n`
  );
  process.exit(1);
}
// --- imports follow below ---
```

### prepublishOnly Script in wizard/package.json
```json
{
  "scripts": {
    "build": "tsup",
    "test": "vitest run --reporter=verbose",
    "test:coverage": "vitest run --coverage",
    "prepublishOnly": "npm test && npm run build"
  }
}
```
This runs automatically before `npm publish`. If CI is bypassed and someone runs `npm publish` locally, the tests and build must pass first.

### Dependabot fetch-metadata conditional merge
```yaml
# Source: https://docs.github.com/en/code-security/dependabot/working-with-dependabot/automating-dependabot-with-github-actions
- name: Fetch Dependabot metadata
  id: metadata
  uses: dependabot/fetch-metadata@v2
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}

- name: Auto-merge patch updates only
  if: steps.metadata.outputs.update-type == 'version-update:semver-patch'
  run: gh pr merge --merge --auto "$PR_URL"
  env:
    PR_URL: ${{ github.event.pull_request.html_url }}
    GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### Cross-platform temp directory usage
```yaml
# Works on ubuntu, macos, windows with shell: bash
- name: Run smoke test (Windows)
  if: runner.os == 'Windows'
  shell: bash
  run: |
    mkdir -p "$RUNNER_TEMP/smoke"
    cd "$RUNNER_TEMP/smoke"
    npx --yes "$GITHUB_WORKSPACE/wizard/create-ai-template-0.1.0.tgz" --yes
    test -f .template-config.json
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Classic npm token (no expiry) | Granular access token (scoped to package) | npm.js UI update 2022+ | Reduced blast radius if token is leaked |
| `NPM_TOKEN` secret | npm trusted publishing (OIDC, no token at all) | GA July 2025 | No long-lived secret; `id-token: write` permission + npm package registered as trusted publisher |
| `pull_request_target` for Dependabot automerge | `pull_request` (Dependabot PRs have elevated permissions natively) | GitHub security model change | `pull_request` is simpler and correct for Dependabot; `pull_request_target` is only needed for forks |
| Dependabot individual PRs per package | Dependabot `groups` (one PR per ecosystem) | Introduced in Dependabot v2 schema | Fewer PRs, less notification noise, grouped review |

**Deprecated/outdated:**
- `pull_request_target` for Dependabot automerge: Was recommended as a workaround for Dependabot's read-only token problem. GitHub later gave Dependabot PRs elevated `GITHUB_TOKEN` permissions natively, making `pull_request` the correct trigger.
- Classic npm tokens: Still work but are an antipattern. Granular tokens are the current standard.

---

## Open Questions

1. **npm trusted publishing vs NPM_TOKEN**
   - What we know: npm OIDC trusted publishing is GA as of July 2025; eliminates need for `NPM_TOKEN` secret; requires `id-token: write` permission in workflow + package configured on npmjs.com.
   - What's unclear: User locked NPM_TOKEN approach. OIDC is strictly better but requires one-time npmjs.com UI configuration per package.
   - Recommendation: Implement NPM_TOKEN as locked. Add a comment in `publish.yml` noting the OIDC upgrade path for future reference.

2. **WSL2 requirement in CI**
   - What we know: The success criterion says "Windows (WSL2)" but GitHub Actions `windows-latest` runners run Windows natively, not WSL2. There is no first-class WSL2 support in GitHub-hosted runners.
   - What's unclear: Whether the success criterion means "test in WSL2 too" or "ensure the package works in WSL2 (which is Linux-compatible)".
   - Recommendation: The `windows-latest` runner test covers native Windows. WSL2 runs the Linux binary of Node — since `ubuntu-latest` covers Linux, WSL2 is implicitly covered. Document this in the smoke test job comment. No dedicated WSL2 runner job needed.

3. **Smoke test placement: separate file or inside publish.yml**
   - What we know: The existing pattern in this repo is one concern per workflow file.
   - What's unclear: Whether the smoke test should only run on tag push (before publish) or also on PRs.
   - Recommendation: Add smoke test as a separate job in `publish.yml` with `needs: smoke-test` blocking publish. This way cross-platform validation is a publish gate, not just a CI check. Running it on every PR push would be expensive (3 OS runners per PR).

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest ^4.0.0 |
| Config file | `wizard/vitest.config.ts` (implicit — detected from `package.json`) |
| Quick run command | `cd wizard && npm test` |
| Full suite command | `cd wizard && npm run test:coverage` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SEC-01 | `.github/dependabot.yml` file exists and is valid YAML | smoke | `test -f .github/dependabot.yml` (CI matrix) | ❌ Wave 0 (file to be created) |
| SEC-01 | Dependabot automerge workflow exists | smoke | `test -f .github/workflows/dependabot-automerge.yml` | ❌ Wave 0 (file to be created) |
| (Success Criteria 1) | `npx create-ai-template --yes` exits 0 on ubuntu/macos/windows | integration | publish.yml smoke-test matrix job | ❌ Wave 0 (workflow to be created) |
| (Success Criteria 3) | `npm run build` produces `dist/index.cjs` with no ESM errors | unit | `cd wizard && npm run build && node dist/index.cjs --yes 2>&1 \| grep -v 'Error:'` | ✅ (build script exists; Node guard test is new) |
| (Node guard) | Node < 20 exits with user-friendly error | unit | `node -e "process.version='v18.0.0'" wizard/dist/index.cjs 2>&1 \| grep 'requires Node.js 20'` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `cd wizard && npm test`
- **Per wave merge:** `cd wizard && npm run test:coverage`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `.github/dependabot.yml` — covers SEC-01 (file creation)
- [ ] `.github/workflows/dependabot-automerge.yml` — covers SEC-01 automerge
- [ ] `.github/workflows/publish.yml` — covers Success Criteria 1 and 3
- [ ] Node version guard unit test (optional but recommended) — covers guard behavior in `wizard/tests/`
- [ ] Framework install: Vitest already installed — no gap

---

## Sources

### Primary (HIGH confidence)
- [GitHub Docs — Dependabot configuration options](https://docs.github.com/en/code-security/dependabot/dependabot-version-updates/configuration-options-for-the-dependabot.yml-file) — `groups`, `schedule`, `package-ecosystem`, `directory` fields
- [GitHub Docs — Automating Dependabot with GitHub Actions](https://docs.github.com/en/code-security/dependabot/working-with-dependabot/automating-dependabot-with-github-actions) — `dependabot/fetch-metadata` usage, `pull_request` trigger pattern
- [GitHub Docs — Building and testing Node.js](https://docs.github.com/en/actions/automating-builds-and-tests/building-and-testing-nodejs) — matrix strategy, `setup-node` usage
- [npm trusted publishing GA](https://github.blog/changelog/2025-07-31-npm-trusted-publishing-with-oidc-is-generally-available/) — OIDC status, granular token recommendation
- Existing project files — `wizard/tsup.config.ts`, `wizard/package.json`, `.github/workflows/ci.yml` — confirms existing CJS build setup

### Secondary (MEDIUM confidence)
- [httptoolkit.com — Automatic npm publishing with GitHub Actions](https://httptoolkit.com/blog/automatic-npm-publish-gha/) — `NODE_AUTH_TOKEN`, granular token pattern, `working-directory` for subdirectory publish
- [DEV Community — Auto-merge Dependabot patch updates](https://dev.to/newbee1939/automatically-merge-dependabot-patch-updates-with-github-actions-316g) — `gh pr merge --auto` pattern
- [Node.js issue #43302](https://github.com/nodejs/node/issues/43302) — `isTTY` undefined in GitHub Actions (confirms TTY pitfall)

### Tertiary (LOW confidence)
- Various blog posts on npm publish workflows — used for corroboration of patterns documented in official GitHub Actions docs

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all tools are official GitHub/npm; versions from existing project files
- Architecture: HIGH — patterns verified against official GitHub Actions and Dependabot docs
- Pitfalls: HIGH (TTY, working-directory, Dependabot directory) / MEDIUM (npm token type guidance) — TTY and working-directory issues confirmed via Node.js issue tracker; Dependabot directory confirmed via docs

**Research date:** 2026-03-17
**Valid until:** 2026-06-17 (stable domain — GitHub Actions and Dependabot config schema changes slowly; npm OIDC is new but additive)
