/**
 * Pinned dependency versions for all wizard-installed packages.
 *
 * RULES:
 * - No @latest anywhere in this file — CI grep check will fail the build.
 * - One version constant per package — import this constant everywhere it is used.
 * - Update path: weekly CI cron resolves @latest and opens a PR with diffs to this file.
 *
 * Compatible with: Node.js >=20
 */

// ─── AI Tooling ────────────────────────────────────────────────────────────
// Kept in the same file as code quality versions — one diff to review all bumps.

/** @bmad-method/bmad-agent — AI-driven development methodology agents */
export const BMAD_VERSION = '6.0.0'; // verify: npm info @bmad-method/bmad-agent version

/** GSD workflow engine — internal in-repo tool, not an npm package.
 *  This constant documents the expected GSD version for upgrade tracking.
 *  Actual GSD update mechanics are Phase 2 scope (AI-02). */
export const GSD_VERSION = '2.0.0';

// ─── Code Quality ───────────────────────────────────────────────────────────

/** husky — git hooks manager v9 (no shebang format) */
export const HUSKY_VERSION = '^9.1.7';

/** lint-staged — run linters on staged files only */
export const LINT_STAGED_VERSION = '^15.2.10';

/** @commitlint/cli — validate commit messages */
export const COMMITLINT_CLI_VERSION = '^19.6.1';

/** @commitlint/config-conventional — Conventional Commits 1.0 ruleset */
export const COMMITLINT_CONVENTIONAL_VERSION = '^19.6.0';

/** eslint — static analysis (flat config, v9+) */
export const ESLINT_VERSION = '^9.19.0';

/** typescript-eslint — TypeScript-aware ESLint rules */
export const TYPESCRIPT_ESLINT_VERSION = '^8.23.0';

// ─── Testing ────────────────────────────────────────────────────────────────

/** vitest — unit/integration test runner v4 */
export const VITEST_VERSION = '^4.0.0';

/** @vitest/coverage-v8 — V8-based coverage for vitest */
export const VITEST_COVERAGE_V8_VERSION = '^4.0.0';

// ─── TypeScript ─────────────────────────────────────────────────────────────

/** typescript — TypeScript compiler */
export const TYPESCRIPT_VERSION = '^5.7.3';
