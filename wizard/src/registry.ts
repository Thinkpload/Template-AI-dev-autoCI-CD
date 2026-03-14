/**
 * MODULE_REGISTRY — pure data structure defining all installable modules.
 *
 * Rules:
 * - No functions, no closures, no dynamic values — only static data.
 * - All version strings must be imported from dependency-versions.ts.
 * - templateDir must match a real directory under wizard/templates/ (Plan 03 creates them).
 * - Phase 3 installer reads this data without modification.
 */
import {
  HUSKY_VERSION,
  LINT_STAGED_VERSION,
  COMMITLINT_CLI_VERSION,
  COMMITLINT_CONVENTIONAL_VERSION,
  ESLINT_VERSION,
  TYPESCRIPT_ESLINT_VERSION,
  VITEST_VERSION,
  VITEST_COVERAGE_V8_VERSION,
  TYPESCRIPT_VERSION,
  BMAD_VERSION,
} from './dependency-versions.js';
import type { ModuleRegistry } from './types.js';

export const MODULE_REGISTRY: ModuleRegistry = {
  husky: {
    id: 'husky',
    label: 'Husky + commitlint (git hooks)',
    description: 'Pre-commit linting and conventional commit enforcement on staged files',
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
    description: 'Static analysis with TypeScript-aware rules (eslint.config.mjs)',
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
    label: 'Vitest v4 + V8 coverage',
    description: 'Unit/integration tests with lcov coverage output for SonarCloud',
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
  tsconfig: {
    id: 'tsconfig',
    label: 'TypeScript strict config',
    description: 'tsconfig.json with strict mode, noUncheckedIndexedAccess, and @/* path alias',
    priority: 'must-have',
    deps: [],
    devDeps: [
      `typescript@${TYPESCRIPT_VERSION}`,
    ],
    templateDir: 'templates/tsconfig',
    postInstall: [],
    conflicts: [],
  },
  bmad: {
    id: 'bmad',
    label: 'BMAD Method v6',
    description: 'AI-driven development methodology — installs agent configs and personas',
    priority: 'should-have',
    deps: [],
    devDeps: [
      `@bmad-method/bmad-agent@${BMAD_VERSION}`,
    ],
    templateDir: 'templates/bmad',
    postInstall: ['npx bmad-method install'],
    conflicts: [],
  },
  gsd: {
    id: 'gsd',
    label: 'GSD Workflow Engine',
    description: 'Get-Shit-Done AI planning and execution framework (already in-repo)',
    priority: 'should-have',
    deps: [],
    devDeps: [], // GSD is an in-repo tool — no npm install needed
    templateDir: 'templates/gsd',
    postInstall: [], // Phase 3 handles GSD activation logic (AI-02)
    conflicts: [],
  },
} as const;
