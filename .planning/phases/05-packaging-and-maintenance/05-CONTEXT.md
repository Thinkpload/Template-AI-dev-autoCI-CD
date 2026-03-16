# Phase 5: Packaging and Maintenance - Context

**Gathered:** 2026-03-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Publish the wizard as an `npx`-installable package to npm, configure Dependabot for the template repo, and add a CI matrix to verify cross-platform install. Phase boundary: making the wizard distributable and keeping the repo's dependencies from rotting. New features and SaaS module additions are out of scope.

</domain>

<decisions>
## Implementation Decisions

### npm publish workflow
- Publish is triggered by pushing a version tag (e.g., `v1.0.0`) — GitHub Actions workflow runs on `push: tags: ['v*']`
- Package name: **unscoped** `create-ai-template` — matches `create-*` npm convention; users run `npx create-ai-template`
- Publish workflow steps: `npm ci` → `npm test` → `npm run build` → `npm publish`
- Gate: publish only proceeds if tests pass — no publishing from a broken build
- Requires `NPM_TOKEN` secret in repo settings (document this in CONTRIBUTING.md)

### Node version guard
- Check `process.versions.node` at the **top of `index.ts`**, before any imports run — fastest bail-out
- If Node < 20: print a plain-text error message and `process.exit(1)`
- Error message format: `Error: create-ai-template requires Node.js 20 or higher. You are running vX.Y.Z. Please upgrade: https://nodejs.org`
- `engines: { "node": ">=20" }` remains in `package.json` as a secondary signal (npm install-time warning)

### Claude's Discretion
- Dependabot config specifics (scope: npm + GitHub Actions; automerge mechanism for patch bumps)
- Cross-platform CI matrix configuration (ubuntu/macos/windows runners, WSL2 setup if applicable)
- Whether to add a `prepublishOnly` script in package.json as an additional safety net
- Exact workflow file name and job structure for the publish workflow

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches.

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `wizard/tsup.config.ts` — already configured: CJS output, entry `src/index.ts`, output `dist/index.cjs`. Build command is ready, no changes needed for publish.
- `wizard/package.json` — already has correct `bin` field (`"create-ai-template": "./dist/index.cjs"`) and `"type": "commonjs"`. Package name and version are pre-set.
- `.github/workflows/ci.yml` — existing CI workflow; publish workflow should be a separate file (`publish.yml`) to keep concerns separated (same pattern as `version-check.yml`).

### Established Patterns
- Separate workflow files per concern — `ci.yml` for builds, `version-check.yml` for scheduled drift checks. Publish workflow follows the same pattern as a standalone `publish.yml`.
- `github.actor != 'github-actions[bot]'` guard pattern (from `ci.yml`) — publish workflow doesn't need this since it's tag-triggered, not push-triggered.

### Integration Points
- `src/index.ts` — Node version check goes at the very top, before any `import` statements. Since this is CJS compiled by tsup, the check will be in the output bundle's first lines.
- `npm publish` needs `--access public` flag if the package name is ever changed to scoped in the future — document this note in the workflow.

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 05-packaging-and-maintenance*
*Context gathered: 2026-03-17*
